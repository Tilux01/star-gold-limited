const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const firebase = require("./firebase");

const DATA_DIR = path.join(__dirname, "..", "data");
const LOCAL_FILE = path.join(DATA_DIR, "db.json");
const COLLECTIONS = ["users", "products", "orders", "subscribers", "messages", "categories", "settings", "promos", "media"];

let mode = "local";
let booting = null;
let memory = {};

function blank() {
  const shape = {};
  COLLECTIONS.forEach((name) => {
    shape[name] = [];
  });
  return shape;
}

function loadLocal() {
  try {
    const raw = fs.readFileSync(LOCAL_FILE, "utf8");
    const parsed = JSON.parse(raw);
    memory = blank();
    COLLECTIONS.forEach((name) => {
      if (Array.isArray(parsed[name])) memory[name] = parsed[name];
    });
  } catch (err) {
    memory = blank();
  }
}

function persist() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(memory, null, 2));
  } catch (err) {
    console.error("Local store could not be saved:", err.message);
  }
}

loadLocal();

async function boot() {
  if (!firebase.hasServiceCredential()) {
    console.warn("Realtime Database credential missing, running on local storage.");
    return;
  }
  const health = await firebase.check();
  if (health.ok) {
    mode = "firebase";
    return;
  }
  const detail = health.reason === "DB_PERMISSION_DENIED"
    ? "database rules blocked the request"
    : health.message || health.reason || "unknown error";
  console.warn("Realtime Database unavailable (" + detail + "), running on local storage.");
}

booting = boot().catch((err) => {
  console.warn("Realtime Database check failed:", err.message);
});

async function ready() {
  await booting;
  return mode;
}

function rowsFrom(data) {
  if (!data || typeof data !== "object") return [];
  return Object.keys(data)
    .filter((key) => data[key] && typeof data[key] === "object")
    .map((key) => Object.assign({}, data[key], { id: key }));
}

function normalize(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) {
    return value.map((entry) => (entry === undefined ? null : entry));
  }
  if (typeof value === "object") {
    const out = {};
    Object.keys(value).forEach((key) => {
      if (value[key] !== undefined) out[key] = value[key];
    });
    return out;
  }
  return value;
}

function key(id) {
  return String(id == null ? "" : id).replace(/[.#$/\[\]]/g, "-");
}

function randomId() {
  return crypto.randomBytes(9).toString("hex");
}

const memCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

function invalidateCache(col) {
  if (col) memCache.delete(col);
  else memCache.clear();
}

async function all(collection) {
  await ready();
  if (mode === "firebase") {
    const entry = memCache.get(collection);
    const now = Date.now();
    if (entry && (now - entry.time < CACHE_TTL_MS)) {
      return entry.data.map((r) => Object.assign({}, r));
    }
    const data = await firebase.read(collection);
    const rows = rowsFrom(data);
    memCache.set(collection, { time: now, data: rows });
    return rows.map((r) => Object.assign({}, r));
  }
  return (memory[collection] || []).slice();
}

async function find(collection, predicate) {
  const rows = await all(collection);
  const kept = [];
  for (const row of rows) {
    let hit = predicate(row);
    if (hit && typeof hit.then === "function") hit = await hit;
    if (hit) kept.push(row);
  }
  return kept;
}

async function get(collection, id) {
  if (!id) return null;
  await ready();
  const entry = memCache.get(collection);
  if (entry && (Date.now() - entry.time < CACHE_TTL_MS)) {
    const s = String(id).trim();
    const hit = entry.data.find((row) => String(row.id).trim() === s || String(row.slug || "").trim() === s);
    if (hit) return Object.assign({}, hit);
  }
  if (mode === "firebase") {
    const data = await firebase.read(collection + "/" + key(id));
    if (!data || typeof data !== "object") return null;
    return Object.assign({}, data, { id: String(id) });
  }
  return (memory[collection] || []).find((row) => row.id === id) || null;
}

async function create(collection, data) {
  const id = data.id || randomId();
  const record = Object.assign({}, data, { id });
  await ready();
  invalidateCache(collection);
  if (mode === "firebase") {
    await firebase.write(collection + "/" + key(id), normalize(record));
    return record;
  }
  if (!memory[collection]) memory[collection] = [];
  memory[collection].push(record);
  persist();
  return record;
}

async function update(collection, id, patch) {
  await ready();
  invalidateCache(collection);
  if (mode === "firebase") {
    const current = await get(collection, id);
    if (!current) return null;
    const merged = Object.assign({}, current, patch, { id: String(id) });
    await firebase.write(collection + "/" + key(id), normalize(merged));
    return merged;
  }
  const list = memory[collection] || [];
  const index = list.findIndex((row) => row.id === id || (row.slug && row.slug === id));
  if (index === -1) return null;
  list[index] = Object.assign({}, list[index], patch);
  persist();
  return list[index];
}

async function remove(collection, id) {
  await ready();
  invalidateCache(collection);
  if (mode === "firebase") {
    await firebase.remove(collection + "/" + key(id));
    return true;
  }
  const before = (memory[collection] || []).length;
  memory[collection] = (memory[collection] || []).filter((row) => row.id !== id && (!row.slug || row.slug !== id));
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

function status() {
  return {
    driver: mode,
    connected: mode === "firebase",
    project: firebase.projectId,
    database: firebase.databaseURL
  };
}

module.exports = {
  get driver() {
    return mode;
  },
  ready,
  status,
  all,
  find,
  get,
  create,
  createWithId,
  update,
  remove,
  count,
  randomId
};
