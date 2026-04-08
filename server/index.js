import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();

const PORT = Number(process.env.PORT || 4000);
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://snmgroup:Manchester%402025@cluster0.30nluvr.mongodb.net/?appName=Cluster0";
const JWT_SECRET = process.env.JWT_SECRET || "snm-group-secret";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Manchester@2025";

const uploadDir = path.resolve("./server/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const sanitizeFileName = (originalName) => {
  const baseName = path.basename(originalName);
  return baseName.replace(/[^a-zA-Z0-9_.-]/g, "_");
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = sanitizeFileName(file.originalname);
    cb(null, `${Date.now()}-${safeName}`);
  },
});
const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

function resolveBaseUrl(req) {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${protocol}://${host}`.replace(/\/+$/, "");
}

function xmlEscape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const client = new MongoClient(MONGO_URI);
let db;

async function connectDb() {
  await client.connect();
  db = client.db("snmgroup");
  await ensureSeedData();
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
}

async function ensureSeedData() {
  const users = db.collection("users");
  const admin = await users.findOne({ username: ADMIN_USERNAME });
  if (!admin) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await users.insertOne({
      username: ADMIN_USERNAME,
      passwordHash,
      role: "admin",
      createdAt: new Date(),
    });
    console.log("Seeded admin user:", ADMIN_USERNAME);
  }

  const config = db.collection("siteConfig");
  const existingConfig = await config.findOne({ _id: "site" });
  if (!existingConfig) {
    await config.insertOne({
      _id: "site",
      companyName: "SNM Group",
      logoAssetId: "",
      address: "Jl. Modern No. 10, Jakarta, Indonesia",
      email: "info@snmgroup.co.id",
      phone: "+62 21 1234 5678",
      themePrimary: "#7E57FF",
      themePrimaryHover: "#6a3fff",
      themeDark: "#081828",
      themeBackground: "#ffffff",
      socials: [
        { name: "LinkedIn", url: "https://www.linkedin.com/company/snm-group" },
        { name: "Instagram", url: "https://instagram.com/snmgroup" },
      ],
      navbar: [{ label: "Home", link: "/" }],
      footer: [
        { label: "Privacy", link: "/privacy" },
        { label: "Contact", link: "/contact" },
      ],
      description:
        "SNM Group menyediakan layanan konsultasi bisnis dan teknologi modern untuk perusahaan Indonesia.",
      updatedAt: new Date(),
    });
    console.log("Seeded default site configuration");
  }
}

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username dan password diperlukan" });
  const user = await db.collection("users").findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Username atau password salah" });
  }
  const token = jwt.sign(
    { id: user._id.toString(), username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "8h" },
  );
  res.json({ token, user: { username: user.username, role: user.role } });
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(req.user.id) });
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
  res.json({ username: user.username, role: user.role });
});

app.get("/api/auth/users", authMiddleware, async (req, res) => {
  const users = await db
    .collection("users")
    .find({}, { projection: { username: 1, role: 1, createdAt: 1 } })
    .toArray();
  res.json(users);
});

app.post("/api/auth/users", authMiddleware, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username dan password diperlukan" });
  const exists = await db.collection("users").findOne({ username });
  if (exists)
    return res.status(400).json({ error: "Username sudah digunakan" });
  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await db.collection("users").insertOne({
    username,
    passwordHash,
    role: role || "editor",
    createdAt: new Date(),
  });
  res.json({ id: inserted.insertedId, username, role: role || "editor" });
});

app.delete("/api/auth/users/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID user tidak valid" });
  }

  if (req.user?.id === id) {
    return res.status(400).json({ error: "Tidak dapat menghapus akun yang sedang login" });
  }

  const target = await db.collection("users").findOne({ _id: new ObjectId(id) });
  if (!target) {
    return res.status(404).json({ error: "User tidak ditemukan" });
  }

  if (target.role === "admin") {
    const adminCount = await db.collection("users").countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return res.status(400).json({ error: "Minimal harus ada satu admin" });
    }
  }

  await db.collection("users").deleteOne({ _id: new ObjectId(id) });
  res.json({ success: true });
});

app.get("/api/site", async (req, res) => {
  const site = await db.collection("siteConfig").findOne({ _id: "site" });
  res.json(site || {});
});

app.post("/api/site", authMiddleware, async (req, res) => {
  try {
    const { _id, updatedAt, ...updateData } = req.body;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "Payload data tidak boleh kosong" });
    }

    const update = { ...updateData, updatedAt: new Date() };
    await db
      .collection("siteConfig")
      .updateOne({ _id: "site" }, { $set: update }, { upsert: true });

    res.json({ success: true });
  } catch (err) {
    console.error("Error saving site config:", err);
    res.status(500).json({ error: "Gagal menyimpan konfigurasi" });
  }
});

app.get("/api/pages", async (req, res) => {
  const pages = await db
    .collection("pages")
    .find()
    .sort({ updatedAt: -1 })
    .toArray();
  res.json(pages);
});

app.get("/api/pages/:slug", async (req, res) => {
  const page = await db.collection("pages").findOne({ slug: req.params.slug });
  res.json(page || {});
});

app.post("/api/pages", authMiddleware, async (req, res) => {
  const page = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
  const inserted = await db.collection("pages").insertOne(page);
  res.json({ ...page, _id: inserted.insertedId });
});

app.put("/api/pages/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;
  const { _id, ...updateData } = req.body;
  if (updateData.isHomepage) {
    await db
      .collection("pages")
      .updateMany({}, { $set: { isHomepage: false } });
  }
  await db
    .collection("pages")
    .updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } },
    );
  res.json({ success: true });
});

app.post("/api/pages/:id/homepage", authMiddleware, async (req, res) => {
  const id = req.params.id;
  await db.collection("pages").updateMany({}, { $set: { isHomepage: false } });
  await db
    .collection("pages")
    .updateOne(
      { _id: new ObjectId(id) },
      { $set: { isHomepage: true, updatedAt: new Date() } },
    );
  res.json({ success: true });
});

app.delete("/api/pages/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;
  await db.collection("pages").deleteOne({ _id: new ObjectId(id) });
  res.json({ success: true });
});

app.get("/api/products", async (req, res) => {
  const products = await db
    .collection("products")
    .find()
    .sort({ createdAt: -1 })
    .toArray();
  res.json(products);
});

app.post("/api/products", authMiddleware, async (req, res) => {
  const product = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
  const inserted = await db.collection("products").insertOne(product);
  res.json({ ...product, _id: inserted.insertedId });
});

app.put("/api/products/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;
  const { _id, ...updateData } = req.body;
  await db
    .collection("products")
    .updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } },
    );
  res.json({ success: true });
});

app.delete("/api/products/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;
  await db.collection("products").deleteOne({ _id: new ObjectId(id) });
  res.json({ success: true });
});

app.get("/api/assets", async (req, res) => {
  const files = await db
    .collection("assets")
    .find()
    .sort({ uploadedAt: -1 })
    .toArray();
  res.json(files);
});

app.get("/api/asset-folders", authMiddleware, async (req, res) => {
  const folders = await db
    .collection("assetFolders")
    .find()
    .sort({ createdAt: -1 })
    .toArray();
  res.json(folders);
});

app.post("/api/asset-folders", authMiddleware, async (req, res) => {
  const rawName = String(req.body?.name || "").trim();
  if (!rawName) {
    return res.status(400).json({ error: "Nama folder wajib diisi" });
  }

  const normalizedName = rawName.replace(/\s+/g, " ");
  const existing = await db.collection("assetFolders").findOne({
    nameLower: normalizedName.toLowerCase(),
  });
  if (existing) {
    return res.status(409).json({ error: "Nama folder sudah digunakan" });
  }

  const folder = {
    name: normalizedName,
    nameLower: normalizedName.toLowerCase(),
    createdAt: new Date(),
  };
  const inserted = await db.collection("assetFolders").insertOne(folder);
  res.json({ ...folder, _id: inserted.insertedId });
});

app.post(
  "/api/assets",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "File tidak dikirim" });
    const folderId =
      typeof req.body?.folderId === "string" ? req.body.folderId.trim() : "";

    if (folderId && !ObjectId.isValid(folderId)) {
      return res.status(400).json({ error: "Folder tidak valid" });
    }
    if (folderId) {
      const folderExists = await db
        .collection("assetFolders")
        .findOne({ _id: new ObjectId(folderId) });
      if (!folderExists) {
        return res.status(404).json({ error: "Folder tidak ditemukan" });
      }
    }

    const fileData = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      mimetype: req.file.mimetype,
      size: req.file.size,
      folderId: folderId || null,
      uploadedAt: new Date(),
    };
    await db.collection("assets").insertOne(fileData);
    res.json(fileData);
  },
);

app.delete("/api/assets/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const asset = await db.collection("assets").findOne({ _id: new ObjectId(id) });
    if (!asset) return res.status(404).json({ error: "Aset tidak ditemukan" });

    // Hapus file fisik
    const filePath = path.join(uploadDir, asset.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Hapus dari database
    await db.collection("assets").deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus aset" });
  }
});

app.get("/robots.txt", (req, res) => {
  const baseUrl = resolveBaseUrl(req);
  res.type("text/plain");
  res.send(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /cms",
      "Disallow: /api",
      "",
      `Sitemap: ${baseUrl}/sitemap.xml`,
      "",
    ].join("\n"),
  );
});

app.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = resolveBaseUrl(req);
    const pages = await db
      .collection("pages")
      .find({}, { projection: { slug: 1, updatedAt: 1, isHomepage: 1 } })
      .toArray();

    const urls = [];
    urls.push({
      loc: `${baseUrl}/`,
      lastmod: new Date().toISOString(),
      changefreq: "weekly",
      priority: "1.0",
    });
    urls.push({
      loc: `${baseUrl}/products`,
      lastmod: new Date().toISOString(),
      changefreq: "weekly",
      priority: "0.8",
    });

    for (const page of pages) {
      const lastmod = page.updatedAt ? new Date(page.updatedAt).toISOString() : new Date().toISOString();
      if (!page.isHomepage && page.slug) {
        urls.push({
          loc: `${baseUrl}/page/${page.slug}`,
          lastmod,
          changefreq: "weekly",
          priority: "0.7",
        });
      }
    }

    const body = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map(
        (item) =>
          `<url><loc>${xmlEscape(item.loc)}</loc><lastmod>${xmlEscape(
            item.lastmod,
          )}</lastmod><changefreq>${item.changefreq}</changefreq><priority>${item.priority}</priority></url>`,
      ),
      "</urlset>",
    ].join("");

    res.type("application/xml");
    res.send(body);
  } catch (err) {
    res.status(500).json({ error: "Gagal membuat sitemap" });
  }
});

app.get("/api/status", (req, res) => res.json({ status: "ok" }));

async function startServer() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`CMS backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start CMS backend:", err);
    process.exit(1);
  }
}

startServer();
