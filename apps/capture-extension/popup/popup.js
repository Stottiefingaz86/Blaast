const $ = (id) => document.getElementById(id);

function showError(msg) {
  const el = $("error");
  if (!msg) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.textContent = msg;
}

function send(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, ...payload });
}

async function saveSettings() {
  await send("BLAAST_SAVE_SETTINGS", {
    apiBase: $("api-base").value.trim() || "http://localhost:3000",
    adminSessionId: $("admin-session").value.trim(),
  });
}

async function refresh() {
  showError("");
  const res = await send("BLAAST_GET_STATE");
  if (!res?.ok) {
    showError(res?.error || "Failed to load state");
    return;
  }

  if (res.settings) {
    if (!$("api-base").value) $("api-base").value = res.settings.apiBase || "";
    if (!$("admin-session").value) {
      $("admin-session").value = res.settings.adminSessionId || "";
    }
  }

  const { session, steps, recording } = res;
  const status = $("status");
  const active = session?.status === "recording";

  if (!session) {
    status.textContent = "Idle";
    status.classList.remove("recording");
  } else if (recording) {
    status.textContent = `Beat · ${recording.coverageStepId}`;
    status.classList.add("recording");
  } else if (active) {
    status.textContent = `Linked · ${session.operatorHint || ""}`;
    status.classList.add("recording");
  } else {
    status.textContent = `Review · ${steps.length} steps`;
    status.classList.remove("recording");
  }

  $("btn-start").disabled = active;
  $("btn-capture").disabled = !active;
  $("btn-stop").disabled = !active;
  $("btn-stop-beat").disabled = !recording;
  $("count").textContent = String(steps.length);

  const ul = $("steps");
  ul.innerHTML = "";
  for (const step of [...steps].reverse()) {
    const li = document.createElement("li");
    const img = document.createElement("img");
    img.alt = "";
    if (step.thumbDataUrl) img.src = step.thumbDataUrl;
    const meta = document.createElement("div");
    meta.className = "meta";
    const flags = (step.review?.sensitiveFlags || []).join(", ");
    meta.innerHTML = `
      <div><strong>#${step.index + 1}</strong> · ${escapeHtml(shortUrl(step.page?.url))}</div>
      <div class="muted">${step.nodeCount || 0} nodes · ${step.cssVarCount || 0} CSS vars</div>
      ${flags ? `<div class="flags">Flags: ${escapeHtml(flags)}</div>` : ""}
    `;
    li.append(img, meta);
    ul.append(li);
  }
}

function shortUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

$("btn-start").addEventListener("click", async () => {
  await saveSettings();
  const journeyLabel = $("journey").value.trim();
  const res = await send("BLAAST_START", { journeyLabel });
  if (!res?.ok) showError(res?.error || "Start failed");
  await refresh();
});

$("btn-capture").addEventListener("click", async () => {
  const res = await send("BLAAST_CAPTURE");
  if (!res?.ok) showError(res?.error || "Capture failed");
  await refresh();
});

$("btn-stop-beat").addEventListener("click", async () => {
  const res = await send("BLAAST_STOP_BEAT");
  if (!res?.ok) showError(res?.error || "Stop beat failed");
  await refresh();
});

$("btn-stop").addEventListener("click", async () => {
  const res = await send("BLAAST_STOP");
  if (!res?.ok) showError(res?.error || "Stop failed");
  await refresh();
});

$("btn-clear").addEventListener("click", async () => {
  await send("BLAAST_CLEAR");
  await refresh();
});

$("admin-session").addEventListener("change", saveSettings);
$("api-base").addEventListener("change", saveSettings);

refresh();
setInterval(refresh, 2000);
