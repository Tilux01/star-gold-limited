const dns = require("dns"); dns.setDefaultResultOrder("ipv4first");
const CREDENTIAL = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAC5nlVkBUD0UL8QxnB2VAWq39SlBB6ahY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "star-gold-ac376.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://star-gold-ac376-default-rtdb.firebaseio.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "star-gold-ac376",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "star-gold-ac376.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "573316212399",
  appId: process.env.FIREBASE_APP_ID || "1:573316212399:web:9a82cc43311cd7d21c965a"
};

const DB_URL = String(CREDENTIAL.databaseURL).replace(/\/+$/, "");
const ROOT = String(process.env.FIREBASE_DB_ROOT || "star-gold").replace(/^\/+|\/+$/g, "");
const SERVICE_EMAIL = String(process.env.FIREBASE_SERVICE_EMAIL || "service@stargoldlimited.com").trim().toLowerCase();
const SERVICE_PASSWORD = String(process.env.FIREBASE_SERVICE_PASSWORD || "");
const AUTH_HOST = "https://identitytoolkit.googleapis.com/v1/accounts";
const TIMEOUT = 20000;

const MESSAGES = {
  EMAIL_EXISTS: "An account with that email already exists.",
  EMAIL_NOT_FOUND: "No account matches those details.",
  INVALID_PASSWORD: "That password is incorrect.",
  INVALID_LOGIN_CREDENTIALS: "Email or password is incorrect.",
  INVALID_EMAIL: "Enter a valid email address.",
  MISSING_EMAIL: "Enter a valid email address.",
  MISSING_PASSWORD: "Enter your password.",
  WEAK_PASSWORD: "Use a password with at least 6 characters.",
  PASSWORD_LOGIN_DISABLED: "Password sign in is turned off for this project.",
  TOO_MANY_ATTEMPTS_TRY_LATER: "Too many attempts. Try again in a few minutes.",
  USER_DISABLED: "This account has been disabled.",
  OPERATION_NOT_ALLOWED: "Email and password sign in is not enabled for this project.",
  INVALID_ID_TOKEN: "Your session expired. Sign in again.",
  TOKEN_EXPIRED: "Your session expired. Sign in again.",
  INVALID_OOB_CODE: "That reset link is invalid or has already been used.",
  EXPIRED_OOB_CODE: "That reset link has expired. Request a new one.",
  INVALID_REFRESH_TOKEN: "Your session expired. Sign in again."
};

class FirebaseError extends Error {
  constructor(code, message, status) {
    super(message || MESSAGES[code] || "Firebase request failed.");
    this.name = "FirebaseError";
    this.code = code || "FIREBASE_ERROR";
    this.status = status || 400;
  }
}

function friendly(code, fallback) {
  return MESSAGES[code] || fallback || "Firebase request failed.";
}

function readCode(payload) {
  const raw = payload && payload.error && payload.error.message;
  if (!raw) return "FIREBASE_ERROR";
  return String(raw).split(" ")[0].split(":")[0];
}

async function request(url, options) {
  let response;
  try {
    response = await fetch(url, Object.assign({ signal: AbortSignal.timeout(TIMEOUT) }, options || {}));
  } catch (err) {
    throw new FirebaseError("NETWORK", "The account service could not be reached.", 503);
  }
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (err) {
      payload = null;
    }
  }
  return { ok: response.ok, status: response.status, payload: payload };
}

async function identity(action, body) {
  const out = await request(AUTH_HOST + ":" + action + "?key=" + CREDENTIAL.apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!out.ok) {
    const code = readCode(out.payload);
    throw new FirebaseError(code, friendly(code, code), out.status === 400 ? 400 : out.status);
  }
  return out.payload || {};
}

let session = { token: "", expiresAt: 0, uid: "" };

function hasServiceCredential() {
  return Boolean(SERVICE_PASSWORD);
}

async function serviceSession(force) {
  if (!force && session.token && Date.now() < session.expiresAt) return session;
  if (!hasServiceCredential()) {
    throw new FirebaseError("NO_SERVICE_CREDENTIAL", "Database credential is not configured.", 503);
  }
  let out;
  try {
    out = await identity("signInWithPassword", {
      email: SERVICE_EMAIL,
      password: SERVICE_PASSWORD,
      returnSecureToken: true
    });
  } catch (err) {
    if (!["EMAIL_NOT_FOUND", "INVALID_LOGIN_CREDENTIALS", "INVALID_PASSWORD"].includes(err.code)) throw err;
    try {
      out = await identity("signUp", {
        email: SERVICE_EMAIL,
        password: SERVICE_PASSWORD,
        returnSecureToken: true
      });
    } catch (signup) {
      if (signup.code === "EMAIL_EXISTS") {
        throw new FirebaseError("SERVICE_LOGIN_FAILED", "The database sync account exists with a different password.", 401);
      }
      throw signup;
    }
  }
  const lifetime = Number(out.expiresIn || 3600) * 1000;
  session = {
    token: out.idToken,
    expiresAt: Date.now() + Math.max(lifetime - 300000, 60000),
    uid: out.localId || ""
  };
  return session;
}

function encodePath(path) {
  return String(path || "")
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part.replace(/[.#$\[\]]/g, "-")))
    .join("/");
}

function dbPath(path) {
  const clean = encodePath(path);
  return clean ? ROOT + "/" + clean : ROOT;
}

async function database(method, path, body) {
  let attempt = 0;
  while (attempt < 2) {
    const active = await serviceSession(attempt === 1);
    const out = await request(DB_URL + "/" + dbPath(path) + ".json?auth=" + encodeURIComponent(active.token), {
      method: method,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (out.ok) return out.payload;
    const message = out.payload && out.payload.error ? String(out.payload.error) : "";
    if (/permission denied/i.test(message)) {
      throw new FirebaseError("DB_PERMISSION_DENIED", "Database rules are blocking access.", 403);
    }
    if (attempt === 0 && out.status === 401) {
      attempt = 1;
      continue;
    }
    if (out.status === 401) throw new FirebaseError("TOKEN_EXPIRED", "Database session expired.", 503);
    throw new FirebaseError("DB_ERROR", "The database request failed.", 503);
  }
  throw new FirebaseError("DB_ERROR", "The database request failed.", 503);
}

const read = (path) => database("GET", path);
const write = (path, value) => database("PUT", path, value);
const remove = (path) => database("DELETE", path);

async function check() {
  try {
    await database("GET", "");
    return { ok: true, reason: "connected" };
  } catch (err) {
    return { ok: false, reason: err.code || "DB_ERROR", message: err.message };
  }
}

async function signUp(email, password, displayName) {
  const body = { email: email, password: password, returnSecureToken: true };
  if (displayName) body.displayName = displayName;
  return identity("signUp", body);
}

const signIn = (email, password) =>
  identity("signInWithPassword", { email: email, password: password, returnSecureToken: true });

async function accountInfo(idToken) {
  const out = await identity("lookup", { idToken: idToken });
  const user = out.users && out.users[0];
  if (!user) throw new FirebaseError("INVALID_ID_TOKEN", friendly("INVALID_ID_TOKEN"), 401);
  return user;
}

async function updateAccount(idToken, data) {
  const body = { idToken: idToken, returnSecureToken: true };
  Object.keys(data || {}).forEach((key) => {
    if (data[key] !== undefined) body[key] = data[key];
  });
  return identity("update", body);
}

const deleteAccount = (idToken) => identity("delete", { idToken: idToken });

const sendResetEmail = (email) =>
  identity("sendOobCode", { requestType: "PASSWORD_RESET", email: email });

async function resetPassword(oobCode, password) {
  const out = await identity("resetPassword", { oobCode: oobCode, newPassword: password });
  return out;
}

const verifyCode = (oobCode) => identity("resetPassword", { oobCode: oobCode });

async function ensureAccount(email, password, displayName) {
  try {
    return await signIn(email, password);
  } catch (err) {
    if (!["EMAIL_NOT_FOUND", "INVALID_LOGIN_CREDENTIALS", "INVALID_PASSWORD"].includes(err.code)) throw err;
    try {
      return await signUp(email, password, displayName);
    } catch (signup) {
      if (signup.code !== "EMAIL_EXISTS") throw signup;
      throw new FirebaseError("This email already has an account with a different password.", "ACCOUNT_PASSWORD_MISMATCH");
    }
  }
}

module.exports = {
  credential: CREDENTIAL,
  projectId: CREDENTIAL.projectId,
  databaseURL: DB_URL,
  root: ROOT,
  serviceEmail: SERVICE_EMAIL,
  hasServiceCredential,
  FirebaseError,
  friendly,
  read,
  write,
  remove,
  check,
  signUp,
  signIn,
  accountInfo,
  updateAccount,
  deleteAccount,
  sendResetEmail,
  resetPassword,
  verifyCode,
  ensureAccount
};
