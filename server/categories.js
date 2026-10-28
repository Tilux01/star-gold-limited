const db = require("./db");
const { CATEGORIES } = require("./seed");

function defaults() {
  return CATEGORIES.map((row, index) => ({
    id: row.slug,
    slug: row.slug,
    label: row.label,
    blurb: row.blurb || "",
    image: row.image || "",
    sortOrder: index + 1,
    active: true
  }));
}

async function all() {
  let rows = [];
  try {
    rows = await db.all("categories");
  } catch (err) {
    rows = [];
  }
  const list = rows && rows.length ? rows : defaults();
  return list
    .map((row) => Object.assign({
      id: row.slug || row.id,
      blurb: "",
      image: "",
      sortOrder: 99,
      active: true
    }, row, { slug: row.slug || row.id }))
    .sort((a, b) => Number(a.sortOrder || 99) - Number(b.sortOrder || 99));
}

async function live() {
  const rows = await all();
  return rows.filter((row) => row.active !== false);
}

async function find(slug) {
  const rows = await all();
  return rows.find((row) => row.slug === slug || row.id === slug) || null;
}

async function ensure() {
  let rows = [];
  try {
    rows = await db.all("categories");
  } catch (err) {
    rows = [];
  }
  if (rows && rows.length) return rows;
  const seeded = defaults();
  for (const row of seeded) {
    try {
      await db.createWithId("categories", row.slug, row);
    } catch (err) {
      return seeded;
    }
  }
  return seeded;
}

module.exports = { defaults, all, live, find, ensure };
