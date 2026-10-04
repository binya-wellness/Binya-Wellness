const cfg = window.NORTH_STAR_AWS_CONFIG || {};
const authStoreKey = "north_star_auth";
const pkceKey = "north_star_pkce";
const stateKey = "north_star_state";

const $ = (id) => document.getElementById(id);

function b64url(bytes) {
  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}

function randomString(length = 64) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return b64url(bytes).slice(0, length);
}

function parseJwt(token) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = part + "=".repeat((4 - part.length % 4) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

function getAuth() {
  try { return JSON.parse(sessionStorage.getItem(authStoreKey) || "null"); }
  catch { return null; }
}

function setAuth(auth) {
  sessionStorage.setItem(authStoreKey, JSON.stringify(auth));
}

function clearAuth() {
  sessionStorage.removeItem(authStoreKey);
  sessionStorage.removeItem(pkceKey);
  sessionStorage.removeItem(stateKey);
}

function notice(message, kind = "info") {
  const el = $("app-notice");
  if (!el) return;
  el.textContent = message;
  el.className = "notice " + (kind === "error" ? "error" : kind === "success" ? "success" : "");
  el.classList.remove("hidden");
}

function hideNotice() {
  $("app-notice")?.classList.add("hidden");
}

function requireConfig() {
  const required = ["apiBase","clientId","cognitoBase","portalUrl"];
  const missing = required.filter(k => !cfg[k] || String(cfg[k]).includes("__"));
  if (missing.length) {
    const gate = $("gate-notice");
    gate.textContent = "North Star AWS deployment is not configured yet.";
    gate.className = "notice error";
    $("sign-in-btn").disabled = true;
    return false;
  }
  return true;
}

async function beginSignIn() {
  if (!requireConfig()) return;

  const verifier = randomString(96);
  const challenge = b64url(await sha256(verifier));
  const state = randomString(40);
  sessionStorage.setItem(pkceKey, verifier);
  sessionStorage.setItem(stateKey, state);

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    response_type: "code",
    scope: "openid email",
    redirect_uri: cfg.portalUrl,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state
  });

  location.assign(cfg.cognitoBase + "/login?" + params.toString());
}

async function exchangeCode(code, state) {
  const expected = sessionStorage.getItem(stateKey);
  const verifier = sessionStorage.getItem(pkceKey);
  if (!expected || expected !== state || !verifier) throw new Error("Sign-in validation failed.");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: cfg.clientId,
    code,
    redirect_uri: cfg.portalUrl,
    code_verifier: verifier
  });

  const res = await fetch(cfg.cognitoBase + "/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });

  if (!res.ok) throw new Error("Secure sign-in could not be completed.");
  const tokens = await res.json();

  setAuth({
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in || 900) * 1000
  });

  sessionStorage.removeItem(pkceKey);
  sessionStorage.removeItem(stateKey);
  history.replaceState({}, "", location.pathname);
}

async function refreshTokens(auth) {
  if (!auth?.refreshToken) return null;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: cfg.clientId,
    refresh_token: auth.refreshToken
  });

  const res = await fetch(cfg.cognitoBase + "/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });

  if (!res.ok) return null;
  const tokens = await res.json();

  const updated = {
    ...auth,
    accessToken: tokens.access_token,
    idToken: tokens.id_token || auth.idToken,
    expiresAt: Date.now() + (tokens.expires_in || 900) * 1000
  };
  setAuth(updated);
  return updated;
}

async function validAuth() {
  let auth = getAuth();
  if (!auth) return null;
  if (auth.expiresAt > Date.now() + 60_000) return auth;

  auth = await refreshTokens(auth);
  if (!auth) clearAuth();
  return auth;
}

async function api(path, options = {}) {
  const auth = await validAuth();
  if (!auth) {
    showGate();
    throw new Error("Your secure session expired. Sign in again.");
  }

  const res = await fetch(cfg.apiBase.replace(/\/$/, "") + path, {
    ...options,
    headers: {
      "authorization": "Bearer " + auth.accessToken,
      "content-type": "application/json",
      ...(options.headers || {})
    },
    cache: "no-store"
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 401 || res.status === 403) {
    clearAuth();
    showGate();
  }
  if (!res.ok) throw new Error(data.error || "The North Star could not complete that request.");
  return data;
}

function showGate() {
  $("auth-gate").classList.remove("hidden");
  $("dashboard").classList.add("hidden");
  $("sign-out-btn").classList.add("hidden");
}

function showDashboard() {
  $("auth-gate").classList.add("hidden");
  $("dashboard").classList.remove("hidden");
  $("sign-out-btn").classList.remove("hidden");
}

function renderRows(targetId, items, formatter, emptyText) {
  const box = $(targetId);
  if (!box) return;
  box.innerHTML = items?.length ? items.map(formatter).join("") : `<p class="lead">${emptyText}</p>`;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
}

async function loadDashboard() {
  hideNotice();
  const me = await api("/me");
  showDashboard();

  $("user-summary").textContent = me.user.email ? `Signed in as ${me.user.email}.` : "Signed in securely.";
  $("security-state").textContent = me.security.sensitiveUploadsEnabled ? "PHI upload gate enabled" : "PHI uploads locked";
  $("security-state").className = "status security";

  $("upload-panel").classList.toggle("hidden", !me.security.sensitiveUploadsEnabled);
  $("upload-locked").classList.toggle("hidden", me.security.sensitiveUploadsEnabled);

  const [tasks, messages, appointments, documents] = await Promise.all([
    api("/tasks"), api("/messages"), api("/appointments"), api("/documents")
  ]);

  renderRows("tasks-list", tasks.items, t =>
    `<div class="row"><strong>${esc(t.title || "Task")}</strong><small>${esc(t.status || "Open")}</small></div>`,
    "No tasks right now."
  );

  renderRows("appointments-list", appointments.items, a =>
    `<div class="row"><strong>${esc(a.label || "Appointment")}</strong><small>${esc(a.startsAt ? new Date(a.startsAt).toLocaleString() : a.status || "")}</small></div>`,
    "No upcoming appointments."
  );

  renderRows("messages-list", messages.items, m =>
    `<div class="row"><strong>${esc(m.division || "Binya")}</strong><div>${esc(m.message || "")}</div><small>${esc(m.createdAt ? new Date(m.createdAt).toLocaleString() : "")}</small></div>`,
    "No secure messages yet."
  );

  renderRows("documents-list", documents.items, d =>
    `<div class="row"><strong>${esc(d.filename || "Document")}</strong><small>${esc(d.division || "")}</small><div class="actions"><button class="btn secondary" type="button" data-download="${esc(d.id)}">Download</button></div></div>`,
    "No documents yet."
  );

  document.querySelectorAll("[data-download]").forEach(btn => {
    btn.addEventListener("click", () => downloadDocument(btn.dataset.download));
  });
}

async function sendMessage() {
  const message = $("message-body").value.trim();
  if (!message) return;
  const division = $("message-division").value;

  $("send-message-btn").disabled = true;
  try {
    await api("/messages", {
      method: "POST",
      body: JSON.stringify({ division, message })
    });
    $("message-body").value = "";
    notice("Secure message sent.", "success");
    await loadDashboard();
  } catch (e) {
    notice(e.message, "error");
  } finally {
    $("send-message-btn").disabled = false;
  }
}

async function uploadDocument() {
  const file = $("document-file").files?.[0];
  const division = $("document-division").value;
  if (!file) return;

  $("upload-btn").disabled = true;
  try {
    const meta = await api("/documents/upload-url", {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        division
      })
    });

    const upload = await fetch(meta.uploadUrl, {
      method: "PUT",
      headers: meta.requiredHeaders,
      body: file
    });

    if (!upload.ok) throw new Error("The document upload did not complete.");

    $("document-file").value = "";
    notice("Document uploaded securely.", "success");
    await loadDashboard();
  } catch (e) {
    notice(e.message, "error");
  } finally {
    $("upload-btn").disabled = false;
  }
}

async function downloadDocument(id) {
  try {
    const data = await api("/documents/" + encodeURIComponent(id) + "/download-url");
    location.assign(data.downloadUrl);
  } catch (e) {
    notice(e.message, "error");
  }
}

function signOut() {
  clearAuth();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    logout_uri: cfg.portalUrl
  });
  location.assign(cfg.cognitoBase + "/logout?" + params.toString());
}

async function boot() {
  $("sign-in-btn").addEventListener("click", beginSignIn);
  $("sign-out-btn").addEventListener("click", signOut);
  $("send-message-btn").addEventListener("click", sendMessage);
  $("upload-btn").addEventListener("click", uploadDocument);

  if (!requireConfig()) return;

  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    $("gate-notice").textContent = "Secure sign-in was not completed.";
    $("gate-notice").className = "notice error";
    history.replaceState({}, "", location.pathname);
    return;
  }

  if (code) {
    try {
      await exchangeCode(code, state);
    } catch (e) {
      $("gate-notice").textContent = e.message;
      $("gate-notice").className = "notice error";
      return;
    }
  }

  if (await validAuth()) {
    try {
      await loadDashboard();
    } catch (e) {
      notice(e.message, "error");
    }
  } else {
    showGate();
  }
}

boot();
