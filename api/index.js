import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId, Binary } from "mongodb";
import formidable from "formidable";
import { readFile, unlink } from "node:fs/promises";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://snmgroup:Manchester%402025@cluster0.30nluvr.mongodb.net/?appName=Cluster0";
const JWT_SECRET = process.env.JWT_SECRET || "snm-group-secret";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Manchester@2025";

const client = new MongoClient(MONGO_URI);
let dbPromise = null;

function json(res, code, payload) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function withCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = client.connect().then(async () => {
      const db = client.db("snmgroup");
      await ensureSeedData(db);
      return db;
    });
  }
  return dbPromise;
}

async function ensureSeedData(db) {
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
  }
}

async function parseJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
}

function requireAuth(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const token = header.split(" ")[1];
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function parsePath(req) {
  const url = new URL(req.url, "http://localhost");
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  return { url, parts };
}

async function handleAssetsUpload(req, res, db) {
  const user = requireAuth(req);
  if (!user) return json(res, 401, { error: "Unauthorized" });

  const form = formidable({ multiples: false });
  const [fields, files] = await form.parse(req);
  const file = files.file;
  const uploaded = Array.isArray(file) ? file[0] : file;
  if (!uploaded) return json(res, 400, { error: "File tidak dikirim" });

  const data = await readFile(uploaded.filepath);
  await unlink(uploaded.filepath).catch(() => {});

  const doc = {
    originalName: uploaded.originalFilename || "file",
    filename: `${Date.now()}-${(uploaded.originalFilename || "file").replace(/[^a-zA-Z0-9_.-]/g, "_")}`,
    mimetype: uploaded.mimetype || "application/octet-stream",
    size: uploaded.size || data.length,
    file: new Binary(data),
    uploadedAt: new Date(),
  };
  const inserted = await db.collection("assets").insertOne(doc);
  const _id = inserted.insertedId.toString();
  const payload = {
    _id,
    originalName: doc.originalName,
    mimetype: doc.mimetype,
    size: doc.size,
    uploadedAt: doc.uploadedAt,
    url: `/api/assets/file/${_id}`,
  };
  await db.collection("assets").updateOne(
    { _id: inserted.insertedId },
    { $set: { url: payload.url } },
  );
  return json(res, 200, payload);
}

export default async function handler(req, res) {
  try {
    if (withCors(req, res)) return;
    const db = await getDb();
    const { parts } = parsePath(req);

    if (!parts.length) return json(res, 200, { status: "ok" });

    // Auth
    if (parts[0] === "auth" && req.method === "POST" && parts[1] === "login") {
      const { username, password } = await parseJson(req);
      if (!username || !password) return json(res, 400, { error: "Username dan password diperlukan" });
      const user = await db.collection("users").findOne({ username });
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return json(res, 401, { error: "Username atau password salah" });
      }
      const token = jwt.sign(
        { id: user._id.toString(), username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "8h" },
      );
      return json(res, 200, { token, user: { username: user.username, role: user.role } });
    }
    if (parts[0] === "auth" && req.method === "GET" && parts[1] === "me") {
      const auth = requireAuth(req);
      if (!auth) return json(res, 401, { error: "Unauthorized" });
      const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
      if (!user) return json(res, 404, { error: "User tidak ditemukan" });
      return json(res, 200, { username: user.username, role: user.role });
    }
    if (parts[0] === "auth" && req.method === "GET" && parts[1] === "users") {
      if (!requireAuth(req)) return json(res, 401, { error: "Unauthorized" });
      const users = await db.collection("users").find({}, { projection: { username: 1, role: 1, createdAt: 1 } }).toArray();
      return json(res, 200, users);
    }
    if (parts[0] === "auth" && req.method === "POST" && parts[1] === "users") {
      if (!requireAuth(req)) return json(res, 401, { error: "Unauthorized" });
      const { username, password, role } = await parseJson(req);
      if (!username || !password) return json(res, 400, { error: "Username dan password diperlukan" });
      const exists = await db.collection("users").findOne({ username });
      if (exists) return json(res, 400, { error: "Username sudah digunakan" });
      const passwordHash = await bcrypt.hash(password, 10);
      const inserted = await db.collection("users").insertOne({ username, passwordHash, role: role || "editor", createdAt: new Date() });
      return json(res, 200, { id: inserted.insertedId, username, role: role || "editor" });
    }

    // Site
    if (parts[0] === "site" && req.method === "GET") {
      const site = await db.collection("siteConfig").findOne({ _id: "site" });
      return json(res, 200, site || {});
    }
    if (parts[0] === "site" && req.method === "POST") {
      if (!requireAuth(req)) return json(res, 401, { error: "Unauthorized" });
      const body = await parseJson(req);
      const { _id, updatedAt, ...updateData } = body || {};
      if (!updateData || Object.keys(updateData).length === 0) return json(res, 400, { error: "Payload data tidak boleh kosong" });
      await db.collection("siteConfig").updateOne({ _id: "site" }, { $set: { ...updateData, updatedAt: new Date() } }, { upsert: true });
      return json(res, 200, { success: true });
    }

    // Pages
    if (parts[0] === "pages" && parts.length === 1 && req.method === "GET") {
      const pages = await db.collection("pages").find().sort({ updatedAt: -1 }).toArray();
      return json(res, 200, pages);
    }
    if (parts[0] === "pages" && parts.length === 1 && req.method === "POST") {
      if (!requireAuth(req)) return json(res, 401, { error: "Unauthorized" });
      const body = await parseJson(req);
      const page = { ...body, createdAt: new Date(), updatedAt: new Date() };
      const inserted = await db.collection("pages").insertOne(page);
      return json(res, 200, { ...page, _id: inserted.insertedId });
    }
    if (parts[0] === "pages" && parts.length === 2 && req.method === "GET") {
      const page = await db.collection("pages").findOne({ slug: parts[1] });
      return json(res, 200, page || {});
    }
    if (parts[0] === "pages" && parts.length === 2 && req.method === "PUT") {
      if (!requireAuth(req)) return json(res, 401, { error: "Unauthorized" });
      const body = await parseJson(req);
      const { _id, ...updateData } = body || {};
      if (updateData?.isHomepage) await db.collection("pages").updateMany({}, { $set: { isHomepage: false } });
      await db.collection("pages").updateOne({ _id: new ObjectId(parts[1]) }, { $set: { ...updateData, updatedAt: new Date() } });
      return json(res, 200, { success: true });
    }
    if (parts[0] === "pages" && parts.length === 3 && parts[2] === "homepage" && req.method === "POST") {
      if (!requireAuth(req)) return json(res, 401, { error: "Unauthorized" });
      await db.collection("pages").updateMany({}, { $set: { isHomepage: false } });
      await db.collection("pages").updateOne({ _id: new ObjectId(parts[1]) }, { $set: { isHomepage: true, updatedAt: new Date() } });
      return json(res, 200, { success: true });
    }
    if (parts[0] === "pages" && parts.length === 2 && req.method === "DELETE") {
      if (!requireAuth(req)) return json(res, 401, { error: "Unauthorized" });
      await db.collection("pages").deleteOne({ _id: new ObjectId(parts[1]) });
      return json(res, 200, { success: true });
    }

    // Products
    if (parts[0] === "products" && parts.length === 1 && req.method === "GET") {
      const products = await db.collection("products").find().sort({ createdAt: -1 }).toArray();
      return json(res, 200, products);
    }
    if (parts[0] === "products" && parts.length === 1 && req.method === "POST") {
      if (!requireAuth(req)) return json(res, 401, { error: "Unauthorized" });
      const body = await parseJson(req);
      const product = { ...body, createdAt: new Date(), updatedAt: new Date() };
      const inserted = await db.collection("products").insertOne(product);
      return json(res, 200, { ...product, _id: inserted.insertedId });
    }
    if (parts[0] === "products" && parts.length === 2 && req.method === "PUT") {
      if (!requireAuth(req)) return json(res, 401, { error: "Unauthorized" });
      const body = await parseJson(req);
      const { _id, ...updateData } = body || {};
      await db.collection("products").updateOne({ _id: new ObjectId(parts[1]) }, { $set: { ...updateData, updatedAt: new Date() } });
      return json(res, 200, { success: true });
    }
    if (parts[0] === "products" && parts.length === 2 && req.method === "DELETE") {
      if (!requireAuth(req)) return json(res, 401, { error: "Unauthorized" });
      await db.collection("products").deleteOne({ _id: new ObjectId(parts[1]) });
      return json(res, 200, { success: true });
    }

    // Assets
    if (parts[0] === "assets" && parts.length === 1 && req.method === "GET") {
      const files = await db.collection("assets").find({}, { projection: { file: 0 } }).sort({ uploadedAt: -1 }).toArray();
      const normalized = files.map((f) => ({ ...f, url: f.url || `/api/assets/file/${f._id.toString()}` }));
      return json(res, 200, normalized);
    }
    if (parts[0] === "assets" && parts.length === 1 && req.method === "POST") {
      return handleAssetsUpload(req, res, db);
    }
    if (parts[0] === "assets" && parts[1] === "file" && parts[2] && req.method === "GET") {
      const asset = await db.collection("assets").findOne({ _id: new ObjectId(parts[2]) });
      if (!asset?.file?.buffer) return json(res, 404, { error: "Aset tidak ditemukan" });
      res.statusCode = 200;
      res.setHeader("Content-Type", asset.mimetype || "application/octet-stream");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.end(Buffer.from(asset.file.buffer));
    }
    if (parts[0] === "assets" && parts.length === 2 && req.method === "DELETE") {
      if (!requireAuth(req)) return json(res, 401, { error: "Unauthorized" });
      await db.collection("assets").deleteOne({ _id: new ObjectId(parts[1]) });
      return json(res, 200, { success: true });
    }

    if (parts[0] === "status" && req.method === "GET") return json(res, 200, { status: "ok" });

    return json(res, 404, { error: "Not found" });
  } catch (err) {
    return json(res, 500, { error: "Server error", detail: String(err?.message || err) });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

