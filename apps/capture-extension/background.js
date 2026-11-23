/**
 * Service worker: session state, guided poll, tab clip + still, upload to admin API.
 */

const EXTENSION_VERSION = "0.2.0";
const SCHEMA_VERSION = "1.0.0";
const POLL_ALARM = "blaast-guide-poll";

function uuid() {
  return crypto.randomUUID();
}

async function getLocal() {
  return chrome.storage.local.get({
    apiBase: "http://localhost:3000",
    adminSessionId: "",
  });
}

async function getState() {
  const data = await chrome.storage.session.get(["session", "steps", "recording"]);
  return {
    session: data.session || null,
    steps: data.steps || [],
    recording: data.recording || null,
  };
}

async function setState(partial) {
  const cur = await getState();
  await chrome.storage.session.set({
    session: partial.session !== undefined ? partial.session : cur.session,
    steps: partial.steps !== undefined ? partial.steps : cur.steps,
    recording: partial.recording !== undefined ? partial.recording : cur.recording,
  });
}

function originFromUrl(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

async function ensureOriginPermission(origin) {
  if (!origin) return false;
  const has = await chrome.permissions.contains({ origins: [`${origin}/*`] });
  if (has) return true;
  return chrome.permissions.request({ origins: [`${origin}/*`] });
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function requestStructure(tabId) {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: "BLAAST_CAPTURE_STRUCTURE" });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/structure.js"],
    });
    return chrome.tabs.sendMessage(tabId, { type: "BLAAST_CAPTURE_STRUCTURE" });
  }
}

async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });
  if (contexts.length) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Record short tab clips for Blaast guided coverage",
  });
}

async function startSession(journeyLabel) {
  const tab = await activeTab();
  if (!tab?.id || !tab.url) throw new Error("No active tab");
  const origin = originFromUrl(tab.url);
  if (!origin || origin.startsWith("chrome")) {
    throw new Error("Open a normal http(s) page to capture");
  }
  const granted = await ensureOriginPermission(origin);
  if (!granted) throw new Error("Permission denied for this site");

  const { adminSessionId, apiBase } = await getLocal();
  const session = {
    sessionId: uuid(),
    adminSessionId: adminSessionId || undefined,
    apiBase,
    allowedOrigin: origin,
    platform: "desktop_web",
    startedAt: new Date().toISOString(),
    status: "recording",
    journeyLabel: journeyLabel || undefined,
    operatorHint: new URL(tab.url).hostname,
    viewport: {
      width: 0,
      height: 0,
      devicePixelRatio: 1,
      scrollX: 0,
      scrollY: 0,
    },
    extensionVersion: EXTENSION_VERSION,
    schemaVersion: SCHEMA_VERSION,
    lastGuideSeq: 0,
  };
  await setState({ session, steps: [], recording: null });
  if (adminSessionId) {
    await ensureOffscreen();
    try {
      await chrome.runtime.sendMessage({ type: "OFFSCREEN_POLL_START" });
    } catch {
      /* offscreen may not be ready yet */
    }
    await chrome.alarms.create(POLL_ALARM, { periodInMinutes: 1 });
  }
  return session;
}

async function stopSession() {
  const { session, steps } = await getState();
  if (!session) return null;
  if ((await getState()).recording) {
    try {
      await finishBeatRecording({ upload: true });
    } catch {
      /* ignore */
    }
  }
  const next = {
    ...session,
    stoppedAt: new Date().toISOString(),
    status: "review",
  };
  await setState({ session: next, steps });
  await chrome.alarms.clear(POLL_ALARM);
  try {
    await chrome.runtime.sendMessage({ type: "OFFSCREEN_POLL_STOP" });
  } catch {
    /* ignore */
  }
  return { session: next, steps };
}

function dataUrlToBase64(dataUrl) {
  const i = dataUrl.indexOf(",");
  return i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
}

async function captureStill() {
  const { session, steps } = await getState();
  if (!session || session.status !== "recording") {
    throw new Error("Start a session first");
  }
  const tab = await activeTab();
  if (!tab?.id || !tab.url) throw new Error("No active tab");
  const origin = originFromUrl(tab.url);
  if (origin !== session.allowedOrigin) {
    throw new Error(`Tab origin ${origin} ≠ session ${session.allowedOrigin}`);
  }

  const structureRes = await requestStructure(tab.id);
  if (!structureRes?.ok) {
    throw new Error(structureRes?.error || "Structure capture failed");
  }
  const snapshot = structureRes.snapshot;
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: "png",
  });
  const localId = uuid();
  const stepId = uuid();

  const step = {
    stepId,
    sessionId: session.sessionId,
    index: steps.length,
    kind: "screenshot",
    capturedAt: snapshot.capturedAt,
    page: snapshot.page,
    viewport: snapshot.viewport,
    screenshot: {
      localId,
      mimeType: "image/png",
      dataUrl,
    },
    structure: {
      capturedAt: snapshot.capturedAt,
      documentTitle: snapshot.documentTitle,
      cssVariables: snapshot.cssVariables,
      nodes: snapshot.nodes,
      stylesAvailability: snapshot.stylesAvailability,
      extractorVersion: snapshot.extractorVersion,
    },
    review: {
      approvedForUpload: false,
      sensitiveFlags: snapshot.sensitiveFlags || [],
    },
  };

  const nextSession = {
    ...session,
    viewport: snapshot.viewport,
    platform: snapshot.viewport.width < 900 ? "mobile_web" : "desktop_web",
  };
  const nextSteps = [...steps, step];
  await setState({ session: nextSession, steps: nextSteps });
  return step;
}

async function startBeatRecording(coverageStepId, maxClipSec) {
  const { session, recording } = await getState();
  if (!session) throw new Error("Start a session first");
  if (recording) throw new Error("Already recording a beat");

  const tab = await activeTab();
  if (!tab?.id) throw new Error("No active tab");

  let videoStarted = false;
  try {
    await ensureOffscreen();
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tab.id,
    });
    await chrome.runtime.sendMessage({
      type: "OFFSCREEN_START",
      streamId,
      maxClipSec: maxClipSec || 12,
    });
    videoStarted = true;
  } catch (err) {
    console.warn("tabCapture failed, will fall back to still", err);
  }

  await setState({
    recording: {
      coverageStepId,
      startedAt: Date.now(),
      maxClipSec: maxClipSec || 12,
      videoStarted,
      tabId: tab.id,
      windowId: tab.windowId,
    },
  });
  return { videoStarted };
}

async function finishBeatRecording({ upload }) {
  const { session, recording } = await getState();
  if (!session || !recording) return null;

  let videoBase64 = null;
  let videoMime = null;
  let durationMs = Date.now() - recording.startedAt;

  if (recording.videoStarted) {
    try {
      const res = await chrome.runtime.sendMessage({ type: "OFFSCREEN_STOP" });
      if (res?.blobBase64) {
        videoBase64 = res.blobBase64;
        videoMime = res.mimeType || "video/webm";
        durationMs = res.durationMs || durationMs;
      }
    } catch (err) {
      console.warn("stop video failed", err);
    }
  }

  // Always grab poster + structure
  const tab = await activeTab();
  let posterBase64 = null;
  let structureJson = null;
  let pageUrl = tab?.url;
  let pageTitle = tab?.title;
  let viewport = null;
  let sensitiveFlags = [];

  if (tab?.id && tab.windowId != null) {
    try {
      const structureRes = await requestStructure(tab.id);
      if (structureRes?.ok) {
        structureJson = structureRes.snapshot;
        pageUrl = structureRes.snapshot.page?.url || pageUrl;
        pageTitle = structureRes.snapshot.documentTitle || pageTitle;
        viewport = structureRes.snapshot.viewport;
        sensitiveFlags = structureRes.snapshot.sensitiveFlags || [];
      }
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: "png",
      });
      posterBase64 = dataUrlToBase64(dataUrl);
    } catch (err) {
      console.warn("poster capture failed", err);
    }
  }

  await setState({ recording: null });

  const kind = videoBase64 ? "clip" : "still";
  const payload = {
    coverageStepId: recording.coverageStepId,
    kind,
    pageUrl,
    pageTitle,
    viewport,
    sensitiveFlags,
    durationMs,
    videoBase64: videoBase64 || undefined,
    videoMime: videoMime || undefined,
    posterBase64: posterBase64 || undefined,
    posterMime: "image/png",
    structureJson: structureJson || undefined,
  };

  if (upload && session.adminSessionId) {
    await uploadArtifact(session, payload);
  }

  return payload;
}

async function uploadArtifact(session, payload) {
  const { apiBase, adminSessionId } = await getLocal();
  const base = (session.apiBase || apiBase || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const sid = session.adminSessionId || adminSessionId;
  if (!sid) throw new Error("Set Admin session ID in the extension popup");

  const res = await fetch(`${base}/api/admin/sessions/${sid}/artifacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data;
}

async function pollGuide() {
  const { session, recording } = await getState();
  const { apiBase, adminSessionId } = await getLocal();
  const sid = session?.adminSessionId || adminSessionId;
  if (!sid || !session || session.status !== "recording") return;

  const base = (session.apiBase || apiBase || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  try {
    const res = await fetch(`${base}/api/admin/sessions/${sid}`);
    if (!res.ok) return;
    const data = await res.json();
    const guide = data.session?.guide;
    if (!guide) return;

    const seq = guide.commandSeq || 0;
    if (seq === session.lastGuideSeq && guide.phase === "recording" && recording) {
      // still recording same command
      if (Date.now() - recording.startedAt > (recording.maxClipSec + 2) * 1000) {
        await finishBeatRecording({ upload: true });
      }
      return;
    }

    if (seq === session.lastGuideSeq && guide.phase !== "recording") return;

    await setState({
      session: { ...session, lastGuideSeq: seq },
    });

    if (guide.phase === "recording" && guide.currentStepId && !recording) {
      await startBeatRecording(guide.currentStepId, guide.maxClipSec || 12);
      return;
    }

    if (guide.phase === "idle" && recording) {
      await finishBeatRecording({ upload: true });
    }
  } catch (err) {
    console.warn("guide poll failed", err);
  }
}

async function clearAll() {
  await chrome.alarms.clear(POLL_ALARM);
  try {
    await chrome.runtime.sendMessage({ type: "OFFSCREEN_POLL_STOP" });
  } catch {
    /* ignore */
  }
  await chrome.storage.session.clear();
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === POLL_ALARM) pollGuide();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "capture-step") return;
  try {
    const { recording } = await getState();
    if (recording) {
      await finishBeatRecording({ upload: true });
    } else {
      await captureStill();
    }
  } catch (err) {
    console.warn("capture-step failed", err);
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === "BLAAST_START") {
        const session = await startSession(msg.journeyLabel);
        sendResponse({ ok: true, session });
        return;
      }
      if (msg?.type === "BLAAST_STOP") {
        const result = await stopSession();
        sendResponse({ ok: true, ...result });
        return;
      }
      if (msg?.type === "BLAAST_CAPTURE") {
        const step = await captureStill();
        sendResponse({
          ok: true,
          step: {
            ...step,
            screenshot: {
              localId: step.screenshot.localId,
              mimeType: step.screenshot.mimeType,
              hasImage: true,
            },
          },
        });
        return;
      }
      if (msg?.type === "BLAAST_RECORD_BEAT") {
        const r = await startBeatRecording(
          msg.coverageStepId || "manual",
          msg.maxClipSec || 12,
        );
        sendResponse({ ok: true, ...r });
        return;
      }
      if (msg?.type === "BLAAST_STOP_BEAT") {
        const payload = await finishBeatRecording({ upload: true });
        sendResponse({ ok: true, payload });
        return;
      }
      if (msg?.type === "BLAAST_GET_STATE") {
        const state = await getState();
        const local = await getLocal();
        sendResponse({
          ok: true,
          session: state.session,
          recording: state.recording,
          settings: local,
          steps: state.steps.map((s) => ({
            stepId: s.stepId,
            index: s.index,
            capturedAt: s.capturedAt,
            page: s.page,
            review: s.review,
            cssVarCount: s.structure?.cssVariables?.length || 0,
            nodeCount: s.structure?.nodes?.length || 0,
            thumbDataUrl: s.screenshot?.dataUrl,
          })),
        });
        return;
      }
      if (msg?.type === "BLAAST_SAVE_SETTINGS") {
        await chrome.storage.local.set({
          apiBase: msg.apiBase || "http://localhost:3000",
          adminSessionId: msg.adminSessionId || "",
        });
        sendResponse({ ok: true });
        return;
      }
      if (msg?.type === "BLAAST_CLEAR") {
        await clearAll();
        sendResponse({ ok: true });
        return;
      }
      if (msg?.type === "OFFSCREEN_AUTO_STOP") {
        const { recording } = await getState();
        if (recording) await finishBeatRecording({ upload: true });
        sendResponse({ ok: true });
        return;
      }
      if (msg?.type === "BLAAST_POLL_GUIDE") {
        await pollGuide();
        sendResponse({ ok: true });
        return;
      }
      sendResponse({ ok: false, error: "Unknown message" });
    } catch (err) {
      sendResponse({ ok: false, error: String(err?.message || err) });
    }
  })();
  return true;
});
