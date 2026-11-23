/**
 * Offscreen MediaRecorder — receives tab streamId from the service worker.
 * Also heartbeats guide poll so the SW wakes while a session is linked.
 */

let mediaRecorder = null;
let chunks = [];
let stream = null;
let pollTimer = null;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === "OFFSCREEN_START") {
      await start(msg.streamId, msg.maxClipSec || 12);
      sendResponse({ ok: true });
      return;
    }
    if (msg?.type === "OFFSCREEN_STOP") {
      const result = await stop();
      sendResponse({ ok: true, ...result });
      return;
    }
    if (msg?.type === "OFFSCREEN_POLL_START") {
      if (!pollTimer) {
        pollTimer = setInterval(() => {
          chrome.runtime.sendMessage({ type: "BLAAST_POLL_GUIDE" });
        }, 1000);
      }
      sendResponse({ ok: true });
      return;
    }
    if (msg?.type === "OFFSCREEN_POLL_STOP") {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
      sendResponse({ ok: true });
      return;
    }
    sendResponse({ ok: false, error: "Unknown" });
  })();
  return true;
});

async function start(streamId, maxClipSec) {
  await stopQuiet();
  stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      // @ts-expect-error chrome media source constraint
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
  });
  chunks = [];
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
  mediaRecorder.ondataavailable = (e) => {
    if (e.data?.size) chunks.push(e.data);
  };
  mediaRecorder.start(250);
  setTimeout(() => {
    if (mediaRecorder?.state === "recording") {
      chrome.runtime.sendMessage({ type: "OFFSCREEN_AUTO_STOP" });
    }
  }, maxClipSec * 1000);
}

function stopQuiet() {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      mediaRecorder = null;
      chunks = [];
      resolve();
      return;
    }
    mediaRecorder.onstop = () => {
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      mediaRecorder = null;
      chunks = [];
      resolve();
    };
    try {
      mediaRecorder.stop();
    } catch {
      resolve();
    }
  });
}

function stop() {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      stream?.getTracks().forEach((t) => t.stop());
      resolve({ blobBase64: null, mimeType: null, durationMs: 0 });
      return;
    }
    const started = Date.now();
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType || "video/webm" });
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      const buf = await blob.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const blobBase64 = btoa(binary);
      const mimeType = blob.type || "video/webm";
      mediaRecorder = null;
      chunks = [];
      resolve({
        blobBase64,
        mimeType,
        durationMs: Date.now() - started,
      });
    };
    try {
      mediaRecorder.stop();
    } catch (err) {
      resolve({ blobBase64: null, mimeType: null, durationMs: 0, error: String(err) });
    }
  });
}
