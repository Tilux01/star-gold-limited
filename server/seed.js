require("dotenv").config();
const db = require("./db");
const firebase = require("./firebase");

const CATEGORIES = [
  { slug: "jeans", label: "Jeans", blurb: "Denim cut with intent", image: "jeans-1.jpg" },
  { slug: "gowns", label: "Gowns", blurb: "Evening statements", image: "gown-1.jpg" },
  { slug: "shirts", label: "Shirts", blurb: "Poplin, linen, oxford", image: "shirt-1.jpg" },
  { slug: "up-and-down", label: "Up and Down", blurb: "Heritage two pieces", image: "updown-1.jpg" },
  { slug: "trousers", label: "Trousers", blurb: "Tailored drape", image: "trousers-1.jpg" },
  { slug: "caps", label: "Caps", blurb: "Finished headwear", image: "cap-1.jpg" },
  { slug: "shoes", label: "Shoes", blurb: "Leather, built to last", image: "shoes-1.jpg" },
  { slug: "bags", label: "Bags", blurb: "Carry with confidence", image: "bag-1.jpg" }
];

function clothing(sizes, colors, base) {
  const out = [];
  sizes.forEach((size, si) => {
    colors.forEach((color, ci) => {
      out.push({
        id: `v-${si}-${ci}`,
        size,
        color,
        stock: Math.max(0, base + ((si * 3 + ci * 5) % 9) - 2)
      });
    });
  });
  return out;
}

function oneSize(colors, base) {
  return colors.map((color, ci) => ({ id: `v-0-${ci}`, size: "One Size", color, stock: base + ci * 2 }));
}

const products = [
  {
    id: "heritage-selvedge-straight-jeans", name: "Heritage Selvedge Straight Jeans",
    category: "jeans", origin: "Turkey", price: 68500, compareAt: 84000,
    badge: "Sale", rating: 4.8, reviews: 46, features: ["New In", "Best Seller"],
    description: "A straight-leg selvedge denim woven on shuttle looms in Turkey. Mid rise, clean hem, and a deep indigo that takes on character with every wear.",
    details: ["14oz Turkish selvedge denim", "Mid rise with a straight leg", "Button fly with copper hardware", "Machine wash cold, hang dry"],
    images: ["jeans-1.jpg", "jeans-2.jpg", "jeans-3.jpg"],
    material: "100% cotton selvedge denim",
    variants: clothing(["30", "32", "34", "36", "38"], ["Indigo", "Washed Black"], 6)
  },
  {
    id: "midnight-slim-denim", name: "Midnight Slim Denim",
    category: "jeans", origin: "China", price: 54000, compareAt: 0,
    badge: "New", rating: 4.6, reviews: 21, features: ["New In"],
    description: "A stretch-finished slim jean in a true midnight wash. Sharp enough for the office, comfortable enough for a long evening.",
    details: ["Comfort stretch cotton blend", "Slim tapered leg", "Five pocket construction", "Machine wash cold inside out"],
    images: ["jeans-2.jpg", "jeans-1.jpg", "jeans-3.jpg"],
    material: "98% cotton, 2% elastane",
    variants: clothing(["30", "32", "34", "36"], ["Midnight", "Charcoal"], 5)
  },
  {
    id: "atlas-wide-leg-denim", name: "Atlas Wide-Leg Denim",
    category: "jeans", origin: "Turkey", price: 62500, compareAt: 0,
    badge: "", rating: 4.7, reviews: 18, features: ["New In"],
    description: "Relaxed wide-leg denim with a fluid drape. Cut long on purpose so it breaks softly over the shoe.",
    details: ["Rigid organic cotton denim", "High rise, wide leg", "Contrast stitching", "Wash inside out with similar colours"],
    images: ["jeans-3.jpg", "jeans-1.jpg", "jeans-2.jpg"],
    material: "100% organic cotton",
    variants: clothing(["28", "30", "32", "34"], ["Ecru", "Indigo"], 4)
  },
  {
    id: "aurelia-silk-evening-gown", name: "Aurelia Silk Evening Gown",
    category: "gowns", origin: "Turkey", price: 185000, compareAt: 210000,
    badge: "Sale", rating: 4.9, reviews: 64, features: ["Best Seller"],
    description: "A floor-sweeping silk blend gown with a sculpted bodice and a quiet sheen that reads beautifully under evening light.",
    details: ["Silk blend satin with a matte lining", "Structured bodice, liquid drape skirt", "Concealed side zip", "Dry clean only"],
    images: ["gown-1.jpg", "gown-2.jpg", "gown-3.jpg"],
    material: "70% silk, 30% triacetate",
    variants: clothing(["XS", "S", "M", "L", "XL"], ["Champagne", "Midnight", "Ink Rose"], 3)
  },
  {
    id: "nocturne-satin-column-gown", name: "Nocturne Satin Column Gown",
    category: "gowns", origin: "China", price: 148000, compareAt: 0,
    badge: "New", rating: 4.7, reviews: 29, features: ["New In"],
    description: "A clean column silhouette in heavyweight satin. No fuss, no noise, just a long uninterrupted line from shoulder to hem.",
    details: ["Heavyweight satin with stretch", "Column cut with a back vent", "Hidden back zip", "Dry clean recommended"],
    images: ["gown-2.jpg", "gown-1.jpg", "gown-3.jpg"],
    material: "95% polyester, 5% elastane",
    variants: clothing(["XS", "S", "M", "L"], ["Black", "Ivory"], 4)
  },
  {
    id: "ivory-muse-bridal-gown", name: "Ivory Muse Bridal Gown",
    category: "gowns", origin: "Turkey", price: 320000, compareAt: 0,
    badge: "Atelier", rating: 5, reviews: 12, features: ["Best Seller"],
    description: "Our atelier bridal piece. Hand finished lace applique across a soft tulle skirt with a covered button back.",
    details: ["Hand applied lace applique", "Tulle overlay with satin underlayer", "Covered button back closure", "Specialist dry clean only"],
    images: ["gown-3.jpg", "gown-1.jpg", "gown-2.jpg"],
    material: "Tulle, lace, satin lining",
    variants: clothing(["XS", "S", "M", "L"], ["Ivory"], 2)
  },
  {
    id: "elan-cotton-poplin-shirt", name: "Elan Cotton Poplin Shirt",
    category: "shirts", origin: "Turkey", price: 38500, compareAt: 0,
    badge: "", rating: 4.8, reviews: 88, features: ["Best Seller"],
    description: "The shirt you will reach for without thinking. Long staple Turkish poplin, a soft collar, and a relaxed but tidy cut.",
    details: ["Long staple cotton poplin", "Mother of pearl buttons", "Single chest pocket", "Machine wash at 30 degrees"],
    images: ["shirt-1.jpg", "shirt-2.jpg", "shirt-3.jpg"],
    material: "100% long staple cotton",
    variants: clothing(["S", "M", "L", "XL", "XXL"], ["White", "Sky", "Sand"], 7)
  },
  {
    id: "regent-oxford-shirt", name: "Regent Oxford Shirt",
    category: "shirts", origin: "China", price: 42000, compareAt: 0,
    badge: "New", rating: 4.6, reviews: 34, features: ["New In"],
    description: "A button-down oxford with a slightly fuller body. Dresses up with a blazer, settles down with denim.",
    details: ["Brushed oxford cotton", "Button-down collar", "Split back yoke", "Machine wash cold"],
    images: ["shirt-2.jpg", "shirt-3.jpg", "shirt-1.jpg"],
    material: "100% brushed cotton",
    variants: clothing(["S", "M", "L", "XL"], ["White", "Navy", "Olive"], 6)
  },
  {
    id: "linen-coast-shirt", name: "Linen Coast Shirt",
    category: "shirts", origin: "Turkey", price: 45000, compareAt: 0,
    badge: "", rating: 4.7, reviews: 41, features: [],
    description: "Washed linen with an easy camp collar. Built for heat, holidays, and long lunches that run into the evening.",
    details: ["Garment washed European linen", "Camp collar with a straight hem", "Coconut shell buttons", "Machine wash cold, line dry"],
    images: ["shirt-3.jpg", "shirt-1.jpg", "shirt-2.jpg"],
    material: "100% washed linen",
    variants: clothing(["S", "M", "L", "XL"], ["Ecru", "Slate", "Clay"], 5)
  },
  {
    id: "ankara-royal-two-piece", name: "Ankara Royal Two-Piece",
    category: "up-and-down", origin: "Turkey", price: 95000, compareAt: 118000,
    badge: "Sale", rating: 4.9, reviews: 73, features: ["Best Seller", "New In"],
    description: "A sharp two-piece set in a bold wax print. Structured shoulders, tapered trousers, and a finish that photographs beautifully.",
    details: ["Wax print cotton with a soft hand", "Structured longline jacket", "Tapered matching trousers", "Dry clean to preserve colour"],
    images: ["updown-1.jpg", "updown-2.jpg", "updown-3.jpg"],
    material: "100% wax print cotton",
    variants: clothing(["S", "M", "L", "XL", "XXL"], ["Royal Blue", "Terracotta"], 4)
  },
  {
    id: "kaftan-grand-set", name: "Kaftan Grand Set",
    category: "up-and-down", origin: "Turkey", price: 125000, compareAt: 0,
    badge: "Atelier", rating: 4.8, reviews: 26, features: ["Best Seller"],
    description: "A floor length kaftan with hand finished gold thread at the neckline. Made for ceremonies, worn like a second skin.",
    details: ["Embroidered crepe with gold thread", "Floor length with side slits", "Matching inner slip included", "Dry clean only"],
    images: ["updown-2.jpg", "updown-3.jpg", "updown-1.jpg"],
    material: "Crepe with metallic embroidery",
    variants: clothing(["S", "M", "L", "XL"], ["Ivory Gold", "Onyx Gold"], 3)
  },
  {
    id: "marble-print-lounge-set", name: "Marble Print Lounge Set",
    category: "up-and-down", origin: "China", price: 78000, compareAt: 92000,
    badge: "Sale", rating: 4.5, reviews: 19, features: [],
    description: "A relaxed shirt and wide trouser set in a muted marble print. Travels well and never looks slept in.",
    details: ["Fluid viscose blend", "Relaxed shirt with wide trousers", "Elasticated drawstring waist", "Hand wash cold"],
    images: ["updown-3.jpg", "updown-1.jpg", "updown-2.jpg"],
    material: "80% viscose, 20% linen",
    variants: clothing(["S", "M", "L", "XL"], ["Stone", "Charcoal"], 5)
  },
  {
    id: "tailored-wool-trousers", name: "Tailored Wool Trousers",
    category: "trousers", origin: "Turkey", price: 72000, compareAt: 0,
    badge: "", rating: 4.7, reviews: 52, features: ["Best Seller"],
    description: "A pleated wool trouser with a clean front and a taper that holds its line all day. Boardroom or dinner, it behaves.",
    details: ["Italian wool blend suiting", "Single pleat with side adjusters", "Half lined to the knee", "Dry clean only"],
    images: ["trousers-1.jpg", "trousers-2.jpg", "trousers-3.jpg"],
    material: "Wool blend suiting",
    variants: clothing(["30", "32", "34", "36", "38"], ["Charcoal", "Navy", "Stone"], 5)
  },
  {
    id: "pleated-wide-trousers", name: "Pleated Wide Trousers",
    category: "trousers", origin: "China", price: 58000, compareAt: 0,
    badge: "New", rating: 4.6, reviews: 23, features: ["New In"],
    description: "High waisted, deep pleats, and a generous leg. The quiet partner to a fitted shirt or a cropped knit.",
    details: ["Structured cotton twill", "Double pleat front", "High rise with belt loops", "Machine wash cold"],
    images: ["trousers-2.jpg", "trousers-3.jpg", "trousers-1.jpg"],
    material: "Cotton twill",
    variants: clothing(["XS", "S", "M", "L", "XL"], ["Black", "Camel"], 6)
  },
  {
    id: "noir-slim-trousers", name: "Noir Slim Trousers",
    category: "trousers", origin: "Turkey", price: 49500, compareAt: 0,
    badge: "", rating: 4.5, reviews: 38, features: [],
    description: "A sharp slim trouser with just enough stretch. Sits clean under a jacket without pulling at the pocket.",
    details: ["Stretch cotton blend", "Slim leg with pressed crease", "Zip fly with hidden hook", "Machine wash at 30 degrees"],
    images: ["trousers-3.jpg", "trousers-1.jpg", "trousers-2.jpg"],
    material: "97% cotton, 3% elastane",
    variants: clothing(["30", "32", "34", "36"], ["Black", "Graphite"], 7)
  },
  {
    id: "signature-canvas-cap", name: "Signature Canvas Cap",
    category: "caps", origin: "China", price: 22000, compareAt: 0,
    badge: "", rating: 4.4, reviews: 57, features: ["Best Seller"],
    description: "A six panel canvas cap with a low profile crown and an adjustable brass strap. The everyday finish.",
    details: ["Washed cotton canvas", "Six panel low profile crown", "Adjustable brass buckle strap", "Spot clean only"],
    images: ["cap-1.jpg", "cap-2.jpg", "cap-3.jpg"],
    material: "100% cotton canvas",
    variants: oneSize(["Black", "Sand", "Navy"], 12)
  },
  {
    id: "gold-monogram-cap", name: "Gold Monogram Cap",
    category: "caps", origin: "Turkey", price: 28500, compareAt: 34000,
    badge: "Sale", rating: 4.7, reviews: 31, features: ["New In"],
    description: "Structured cotton twill with a raised gold monogram at the front. Small detail, strong signal.",
    details: ["Structured cotton twill", "Raised gold embroidery", "Moisture wicking sweatband", "Spot clean only"],
    images: ["cap-2.jpg", "cap-3.jpg", "cap-1.jpg"],
    material: "Cotton twill",
    variants: oneSize(["Black", "Ivory"], 9)
  },
  {
    id: "structured-trucker-cap", name: "Structured Trucker Cap",
    category: "caps", origin: "China", price: 24000, compareAt: 0,
    badge: "", rating: 4.3, reviews: 14, features: [],
    description: "Mesh back, firm front, curved brim. The one you keep in the car and wear on repeat.",
    details: ["Cotton front with mesh back", "Pre-curved brim", "Snapback closure", "Hand wash cold"],
    images: ["cap-3.jpg", "cap-1.jpg", "cap-2.jpg"],
    material: "Cotton and polyester mesh",
    variants: oneSize(["Black", "White", "Forest"], 10)
  },
  {
    id: "leather-derby-shoes", name: "Leather Derby Shoes",
    category: "shoes", origin: "Turkey", price: 155000, compareAt: 0,
    badge: "", rating: 4.9, reviews: 44, features: ["Best Seller"],
    description: "Full grain leather derbies with a hand finished sole. Break them in for a week and they are yours for a decade.",
    details: ["Full grain calf leather upper", "Leather lined with a cushioned insole", "Blake stitched leather sole", "Use shoe trees after wear"],
    images: ["shoes-1.jpg", "shoes-2.jpg", "shoes-3.jpg"],
    material: "Full grain calf leather",
    variants: clothing(["40", "41", "42", "43", "44", "45"], ["Black", "Tan"], 3)
  },
  {
    id: "suede-chelsea-boots", name: "Suede Chelsea Boots",
    category: "shoes", origin: "Turkey", price: 168000, compareAt: 195000,
    badge: "Sale", rating: 4.8, reviews: 37, features: ["New In"],
    description: "Italian suede Chelsea boots with elastic gussets and a stacked heel. Sharp with tailoring, easy with denim.",
    details: ["Italian suede upper", "Elastic side gussets", "Stacked leather heel", "Protect with suede spray before first wear"],
    images: ["shoes-2.jpg", "shoes-3.jpg", "shoes-1.jpg"],
    material: "Italian suede",
    variants: clothing(["40", "41", "42", "43", "44"], ["Tobacco", "Charcoal"], 4)
  },
  {
    id: "court-leather-sneakers", name: "Court Leather Sneakers",
    category: "shoes", origin: "China", price: 98000, compareAt: 0,
    badge: "New", rating: 4.6, reviews: 62, features: ["New In", "Best Seller"],
    description: "A clean court sneaker in soft nappa leather with a cupsole and a subtle gold foil logo at the heel.",
    details: ["Soft nappa leather upper", "Cushioned cupsole", "Gold foil heel detail", "Wipe clean with a damp cloth"],
    images: ["shoes-3.jpg", "shoes-1.jpg", "shoes-2.jpg"],
    material: "Nappa leather",
    variants: clothing(["40", "41", "42", "43", "44", "45"], ["White", "Black"], 6)
  },
  {
    id: "milano-leather-tote", name: "Milano Leather Tote",
    category: "bags", origin: "Turkey", price: 210000, compareAt: 0,
    badge: "Best Seller", rating: 4.9, reviews: 58, features: ["Best Seller"],
    description: "A structured tote with a suede lined interior and a laptop sleeve. Holds a fourteen inch machine without losing its shape.",
    details: ["Vegetable tanned leather", "Suede lined interior", "Fits a 14 inch laptop", "Detachable shoulder strap included"],
    images: ["bag-1.jpg", "bag-2.jpg", "bag-3.jpg"],
    material: "Vegetable tanned leather",
    variants: oneSize(["Black", "Tan"], 5)
  },
  {
    id: "structured-mini-bag", name: "Structured Mini Bag",
    category: "bags", origin: "China", price: 145000, compareAt: 0,
    badge: "New", rating: 4.7, reviews: 27, features: ["New In"],
    description: "Small but architectural. A rigid body, gold clasp, and an optional chain strap for evening.",
    details: ["Rigid leather body", "Gold tone clasp closure", "Optional chain strap", "Store in the dust bag provided"],
    images: ["bag-2.jpg", "bag-3.jpg", "bag-1.jpg"],
    material: "Smooth calf leather",
    variants: oneSize(["Black", "Ivory", "Burgundy"], 4)
  },
  {
    id: "weekender-leather-holdall", name: "Weekender Leather Holdall",
    category: "bags", origin: "Turkey", price: 265000, compareAt: 295000,
    badge: "Sale", rating: 4.8, reviews: 22, features: ["Best Seller"],
    description: "A weekend bag built to outlive the trip. Thick leather, solid brass hardware, and a canvas shoulder strap that softens with use.",
    details: ["Thick vegetable tanned leather", "Solid brass hardware", "Detachable canvas shoulder strap", "Cabin friendly dimensions"],
    images: ["bag-3.jpg", "bag-1.jpg", "bag-2.jpg"],
    material: "Vegetable tanned leather",
    variants: oneSize(["Cognac", "Black"], 3)
  }
];

function normalize(product, index) {
  const category = CATEGORIES.find((row) => row.slug === product.category);
  return Object.assign({}, product, {
    categoryLabel: category ? category.label : product.category,
    images: product.images.map((file) => `/assets/products/${file}`),
    compareAt: product.compareAt || 0,
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
    active: true,
    tags: product.features || []
  });
}

async function seedProducts() {
  const existing = await db.count("products");
  if (existing > 0) {
    console.log(`Products already present (${existing}), skipping product seed.`);
    return;
  }
  const rows = products.map(normalize);
  for (const row of rows) {
    await db.create("products", row);
  }
  console.log(`Seeded ${rows.length} products.`);
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@stargoldlimited.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "StarGold2024!";
  let uid = null;

  if (db.driver === "firebase") {
    try {
      const account = await firebase.ensureAccount(email, password, "Star Gold Admin");
      uid = account.localId;
    } catch (err) {
      console.warn(`Administrator sign-in failed: ${err.code || err.message}`);
    }
  }

  const existing = await db.find("users", (row) => row.email === email);
  const current = existing[0] || null;

  if (current && (!uid || current.id === uid)) {
    if (current.role !== "admin") {
      await db.update("users", current.id, { role: "admin" });
      console.log(`Administrator role restored for ${email}.`);
      return;
    }
    console.log("Administrator account already present.");
    return;
  }

  const record = {
    name: (current && current.name) || "Star Gold Admin",
    email,
    phone: (current && current.phone) || process.env.WHATSAPP_NUMBER || "2348063494273",
    role: "admin",
    addresses: Array.isArray(current && current.addresses) ? current.addresses : [],
    createdAt: (current && current.createdAt) || new Date().toISOString()
  };

  if (current) await db.remove("users", current.id);
  if (uid) record.id = uid;
  await db.create("users", record);
  if (current && current.id !== record.id) await db.remove("users", current.id);
  console.log(`Administrator created for ${email}.`);
}

async function run() {
  await db.ready();
  await seedProducts();
  await seedAdmin();
  console.log(`Storage driver: ${db.driver}`);
}

if (require.main === module) {
  run().then(() => setTimeout(() => process.exit(0), 400)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run, seedProducts, seedAdmin, CATEGORIES };
