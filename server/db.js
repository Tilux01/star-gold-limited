const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", ".data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
const COLLECTIONS = ["users", "products", "orders", "subscribers", "messages"];

let firestore = null;
let memory = null;
let saveTimer = null;

function initFirebase() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  const file = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
  let creds = null;
  if (inline && inline.trim().startsWith("{")) {
    try {
      creds = JSON.parse(inline);
    } catch (err) {
      console.warn("Firebase credentials could not be parsed, using local storage.");
    }
  }
  if (!creds && file) {
    const abs = path.isAbsolute(file) ? file : path.join(__dirname, "..", file);
    if (fs.existsSync(abs)) {
      try {
        creds = JSON.parse(fs.readFileSync(abs, "utf8"));
      } catch (err) {
        console.warn("Firebase key file unreadable, using local storage.");
      }
    }
  }
  if (!creds) return null;
  try {
    const admin = require("firebase-admin");
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(creds),
        projectId: creds.project_id
      });
    }
    return admin.firestore();
  } catch (err) {
    console.warn("Firebase init failed, using local storage:", err.message);
    return null;
  }
}

function loadLocal() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    memory = {};
    COLLECTIONS.forEach((name) => { memory[name] = []; });
    persist();
    return memory;
  }
  try {
    memory = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (err) {
    memory = {};
  }
  COLLECTIONS.forEach((name) => {
    if (!Array.isArray(memory[name])) memory[name] = [];
  });
  return memory;
}

function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(memory, null, 2));
    } catch (err) {
      console.error("Local store write failed:", err.message);
    }
  }, 120);
}

firestore = initFirebase();
if (!firestore) loadLocal();

const driver = firestore ? "firebase" : "local";

function randomId() {
  return crypto.randomBytes(9).toString("hex");
}

async function all(collection) {
  if (firestore) {
    const snap = await firestore.collection(collection).get();
    const rows = [];
    snap.forEach((doc) => rows.push(Object.assign({ id: doc.id }, doc.data())));
    return rows;
  }
  return memory[collection].slice();
}

async function find(collection, predicate) {
  const rows = await all(collection);
  return rows.filter(predicate);
}

async function get(collection, id) {
  if (!id) return null;
  if (firestore) {
    const doc = await firestore.collection(collection).doc(String(id)).get();
    if (!doc.exists) return null;
    return Object.assign({ id: doc.id }, doc.data());
  }
  return memory[collection].find((row) => row.id === id) || null;
}

async function create(collection, data) {
  const id = data.id || randomId();
  const record = Object.assign({}, data, { id });
  if (firestore) {
    await firestore.collection(collection).doc(id).set(record);
  } else {
    memory[collection].push(record);
    persist();
  }
  return record;
}

async function update(collection, id, patch) {
  if (firestore) {
    await firestore.collection(collection).doc(String(id)).set(patch, { merge: true });
    return get(collection, id);
  }
  const index = memory[collection].findIndex((row) => row.id === id);
  if (index === -1) return null;
  memory[collection][index] = Object.assign({}, memory[collection][index], patch);
  persist();
  return memory[collection][index];
}

async function remove(collection, id) {
  if (firestore) {
    await firestore.collection(collection).doc(String(id)).delete();
    return true;
  }
  const before = memory[collection].length;
  memory[collection] = memory[collection].filter((row) => row.id !== id);
  persist();
  return memory[collection].length < before;
}

async function count(collection) {
  const rows = await all(collection);
  return rows.length;
}

async function createWithId(collection, id, data) {
  return create(collection, Object.assign({}, data, { id }));
}

module.exports = { driver, all, find, get, create, createWithId, update, remove, count, randomId };
