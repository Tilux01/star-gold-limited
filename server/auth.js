const jwt = require("jsonwebtoken");
const db = require("./db");

const SECRET = process.env.JWT_SECRET || "star-gold-development-secret";
const TTL = "30d";

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: TTL });
}

function readToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(header.slice(7), SECRET);
  } catch (err) {
    return null;
  }
}

async function optionalAuth(req, res, next) {
  const payload = readToken(req);
  req.user = null;
  if (payload && payload.sub) {
    const user = await db.get("users", payload.sub);
    if (user) req.user = user;
  }
  next();
}

async function requireAuth(req, res, next) {
  const payload = readToken(req);
  if (!payload) return res.status(401).json({ error: "Please sign in to continue." });
  const user = await db.get("users", payload.sub);
  if (!user) return res.status(401).json({ error: "Your session has expired. Sign in again." });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Administrator access required." });
  }
  next();
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    addresses: user.addresses || [],
    createdAt: user.createdAt
  };
}

module.exports = { signToken, optionalAuth, requireAuth, requireAdmin, publicUser };
