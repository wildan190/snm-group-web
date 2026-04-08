import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

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

function normalizeHex(color, fallback) {
  const value = String(color || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function normalizeEcommerceConfig(input = {}) {
  const payment = input.payment || {};
  const carouselBanners = Array.isArray(input.carouselBanners)
    ? input.carouselBanners
        .map((item) => ({
          imageAssetId: String(item?.imageAssetId || "").trim(),
          title: String(item?.title || "").trim(),
          subtitle: String(item?.subtitle || "").trim(),
          productIds: Array.isArray(item?.productIds)
            ? item.productIds.map((id) => String(id || "").trim()).filter(Boolean)
            : [],
          filterType: ["featured", "discount", "inStock", "latest"].includes(String(item?.filterType || ""))
            ? String(item.filterType)
            : "featured",
        }))
        .filter((item) => item.imageAssetId)
    : [];
  return {
    enabled: Boolean(input.enabled),
    shopTitle: String(input.shopTitle || "Shop").trim(),
    shopDescription: String(input.shopDescription || "").trim(),
    carouselBanners,
    payment: {
      merchantId: String(payment.merchantId || "").trim(),
      clientKey: String(payment.clientKey || "").trim(),
      serverKey: String(payment.serverKey || "").trim(),
      isProduction: Boolean(payment.isProduction),
    },
  };
}

function mapProductForEcommerce(product) {
  const ecommerce = product.ecommerce || {};
  return {
    ...product,
    ecommerce: {
      sellingEnabled: Boolean(ecommerce.sellingEnabled),
      stock: Number(ecommerce.stock || 0),
      featured: Boolean(ecommerce.featured),
      highlightText: String(ecommerce.highlightText || ""),
      variants: Array.isArray(ecommerce.variants) ? ecommerce.variants : [],
      discount: ecommerce.discount || {
        enabled: false,
        type: "percent",
        value: 0,
        startAt: null,
        endAt: null,
      },
    },
  };
}

function calculateDiscountedPrice(price, discount, now = new Date()) {
  const base = Number(price || 0);
  if (!discount?.enabled) return base;
  const start = discount.startAt ? new Date(discount.startAt) : null;
  const end = discount.endAt ? new Date(discount.endAt) : null;
  if (start && now < start) return base;
  if (end && now > end) return base;
  const value = Number(discount.value || 0);
  if (discount.type === "fixed") {
    return Math.max(0, base - value);
  }
  return Math.max(0, Math.round(base - (base * value) / 100));
}

function getMidtransPaymentConfig(siteConfig) {
  return normalizeEcommerceConfig(siteConfig?.ecommerce || {}).payment;
}

function buildMidtransSignature(orderId, statusCode, grossAmount, serverKey) {
  const payload = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  return crypto.createHash("sha512").update(payload).digest("hex");
}

function mapMidtransToPaymentStatus(transactionStatus, fraudStatus) {
  if (transactionStatus === "settlement") return "paid";
  if (transactionStatus === "capture") {
    return fraudStatus === "accept" ? "paid" : "pending";
  }
  if (transactionStatus === "pending") return "pending";
  if (transactionStatus === "deny") return "failed";
  if (transactionStatus === "expire") return "expired";
  if (transactionStatus === "cancel") return "cancelled";
  return "pending";
}

const client = new MongoClient(MONGO_URI);
let db;
const ORDER_PENDING_EXPIRE_HOURS = Number(process.env.ORDER_PENDING_EXPIRE_HOURS || 24);

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

function getRequestUserOptional(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const token = header.split(" ")[1];
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Akses hanya untuk admin" });
  }
  next();
}

async function logEcommerceAudit(action, actor, payload = {}) {
  if (!db) return;
  await db.collection("ecommerceAuditLogs").insertOne({
    action,
    actorId: actor?.id || null,
    actorUsername: actor?.username || "system",
    actorRole: actor?.role || "system",
    payload,
    createdAt: new Date(),
  });
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
      ecommerce: {
        enabled: false,
        shopTitle: "SNM Shop",
        shopDescription: "Katalog produk SNM Group",
        carouselBanners: [],
        payment: {
          merchantId: "",
          clientKey: "",
          serverKey: "",
          isProduction: false,
        },
      },
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

    const update = {
      ...updateData,
      themePrimary: normalizeHex(updateData.themePrimary, "#7E57FF"),
      themePrimaryHover: normalizeHex(updateData.themePrimaryHover, "#6a3fff"),
      themeDark: normalizeHex(updateData.themeDark, "#081828"),
      themeBackground: normalizeHex(updateData.themeBackground, "#ffffff"),
      ecommerce: normalizeEcommerceConfig(updateData.ecommerce || {}),
      updatedAt: new Date(),
    };
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
  const user = getRequestUserOptional(req);
  const query = user
    ? {}
    : { $or: [{ pageStatus: "published" }, { pageStatus: { $exists: false } }] };
  const pages = await db
    .collection("pages")
    .find(query)
    .sort({ updatedAt: -1 })
    .toArray();
  res.json(pages);
});

app.get("/api/pages/:slug", async (req, res) => {
  const user = getRequestUserOptional(req);
  const query = user
    ? { slug: req.params.slug }
    : {
        slug: req.params.slug,
        $or: [{ pageStatus: "published" }, { pageStatus: { $exists: false } }],
      };
  const page = await db.collection("pages").findOne(query);
  res.json(page || {});
});

app.post("/api/pages", authMiddleware, async (req, res) => {
  const pageStatus = req.body?.pageStatus === "published" ? "published" : "draft";
  const page = { ...req.body, pageStatus, createdAt: new Date(), updatedAt: new Date() };
  const inserted = await db.collection("pages").insertOne(page);
  res.json({ ...page, _id: inserted.insertedId });
});

app.put("/api/pages/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;
  const { _id, ...updateData } = req.body;
  updateData.pageStatus = updateData.pageStatus === "published" ? "published" : "draft";
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
      { $set: { isHomepage: true, pageStatus: "published", updatedAt: new Date() } },
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

app.get("/api/ecommerce/config", async (req, res) => {
  const site = await db.collection("siteConfig").findOne({ _id: "site" });
  res.json(normalizeEcommerceConfig(site?.ecommerce || {}));
});

app.post("/api/ecommerce/config", authMiddleware, requireAdmin, async (req, res) => {
  const ecommerce = normalizeEcommerceConfig(req.body || {});
  await db
    .collection("siteConfig")
    .updateOne({ _id: "site" }, { $set: { ecommerce, updatedAt: new Date() } }, { upsert: true });
  await logEcommerceAudit("config.update", req.user, {
    enabled: ecommerce.enabled,
    isProduction: ecommerce.payment?.isProduction,
  });
  res.json({ success: true, ecommerce });
});

app.get("/api/ecommerce/products", async (req, res) => {
  const products = await db.collection("products").find().sort({ updatedAt: -1 }).toArray();
  const now = new Date();
  const mapped = products
    .map(mapProductForEcommerce)
    .filter((p) => p.ecommerce.sellingEnabled)
    .map((p) => ({
      ...p,
      finalPrice: calculateDiscountedPrice(p.price, p.ecommerce.discount, now),
    }));
  res.json(mapped);
});

app.get("/api/ecommerce/products-admin", authMiddleware, async (req, res) => {
  const products = await db.collection("products").find().sort({ updatedAt: -1 }).toArray();
  res.json(products.map(mapProductForEcommerce));
});

app.get("/api/ecommerce/products/:id/stats", async (req, res) => {
  const id = String(req.params.id || "");
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "ID produk tidak valid" });

  const result = await db.collection("ecommerceOrders").aggregate([
    {
      $match: {
        orderStatus: { $nin: ["cancelled", "expired"] },
      },
    },
    { $unwind: "$items" },
    { $match: { "items.productId": id } },
    {
      $group: {
        _id: null,
        soldCount: { $sum: { $toInt: "$items.qty" } },
      },
    },
  ]).toArray();

  res.json({
    soldCount: Number(result?.[0]?.soldCount || 0),
  });
});

app.put("/api/ecommerce/products/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "ID produk tidak valid" });
  const payload = req.body || {};
  const ecommerce = {
    sellingEnabled: Boolean(payload.sellingEnabled),
    stock: Math.max(0, Number(payload.stock || 0)),
    featured: Boolean(payload.featured),
    highlightText: String(payload.highlightText || "").trim(),
    variants: Array.isArray(payload.variants) ? payload.variants : [],
    discount: {
      enabled: Boolean(payload.discount?.enabled),
      type: payload.discount?.type === "fixed" ? "fixed" : "percent",
      value: Math.max(0, Number(payload.discount?.value || 0)),
      startAt: payload.discount?.startAt || null,
      endAt: payload.discount?.endAt || null,
    },
  };
  await db
    .collection("products")
    .updateOne({ _id: new ObjectId(id) }, { $set: { ecommerce, updatedAt: new Date() } });
  await logEcommerceAudit("product.ecommerce.update", req.user, {
    productId: id,
    sellingEnabled: ecommerce.sellingEnabled,
    stock: ecommerce.stock,
  });
  res.json({ success: true });
});

app.post("/api/ecommerce/orders", async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const customer = req.body?.customer || {};
  if (!items.length) return res.status(400).json({ error: "Item order kosong" });

  const session = client.startSession();
  try {
    let createdOrder = null;
    await session.withTransaction(async () => {
      const orderItems = [];
      let totalAmount = 0;

      for (const item of items) {
        if (!ObjectId.isValid(item.productId)) throw new Error("Produk tidak valid");
        const qty = Math.max(1, Number(item.qty || 1));
        const product = await db
          .collection("products")
          .findOne({ _id: new ObjectId(item.productId) }, { session });
        if (!product) throw new Error("Produk tidak ditemukan");
        const mapped = mapProductForEcommerce(product);
        if (!mapped.ecommerce.sellingEnabled) throw new Error(`Produk ${product.name} tidak dijual`);
        const unitPrice = calculateDiscountedPrice(product.price, mapped.ecommerce.discount, new Date());

        // Atomic stock decrement to prevent race condition oversell
        const updated = await db.collection("products").updateOne(
          {
            _id: new ObjectId(item.productId),
            "ecommerce.stock": { $gte: qty },
            "ecommerce.sellingEnabled": true,
          },
          { $inc: { "ecommerce.stock": -qty }, $set: { updatedAt: new Date() } },
          { session },
        );
        if (!updated.modifiedCount) throw new Error(`Stok produk ${product.name} tidak mencukupi`);

        const subTotal = unitPrice * qty;
        totalAmount += subTotal;
        orderItems.push({
          productId: product._id.toString(),
          name: product.name,
          qty,
          unitPrice,
          subTotal,
          variant: item.variant || {},
        });
      }

      const orderId = `SNM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const orderDoc = {
        orderId,
        customer: {
          name: String(customer.name || "Guest"),
          email: String(customer.email || ""),
          phone: String(customer.phone || ""),
          address: String(customer.address || ""),
        },
        items: orderItems,
        totalAmount,
        paymentStatus: "pending",
        orderStatus: "pending_confirmation",
        payment: { gateway: "midtrans", transactionToken: "", redirectUrl: "" },
        statusHistory: [
          {
            at: new Date(),
            orderStatus: "pending_confirmation",
            paymentStatus: "pending",
            note: "Order dibuat",
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const inserted = await db.collection("ecommerceOrders").insertOne(orderDoc, { session });
      createdOrder = { ...orderDoc, _id: inserted.insertedId };
    });

    const site = await db.collection("siteConfig").findOne({ _id: "site" });
    const paymentCfg = normalizeEcommerceConfig(site?.ecommerce || {}).payment;
    if (createdOrder && paymentCfg.serverKey) {
      try {
        const midtransBase = paymentCfg.isProduction
          ? "https://app.midtrans.com"
          : "https://app.sandbox.midtrans.com";
        const apiBase = paymentCfg.isProduction
          ? "https://api.midtrans.com"
          : "https://api.sandbox.midtrans.com";
        const authToken = Buffer.from(`${paymentCfg.serverKey}:`).toString("base64");
        const resp = await fetch(`${apiBase}/snap/v1/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Basic ${authToken}`,
          },
          body: JSON.stringify({
            transaction_details: {
              order_id: createdOrder.orderId,
              gross_amount: createdOrder.totalAmount,
            },
            customer_details: {
              first_name: createdOrder.customer.name,
              email: createdOrder.customer.email,
              phone: createdOrder.customer.phone,
            },
          }),
        });
        if (resp.ok) {
          const snap = await resp.json();
          await db.collection("ecommerceOrders").updateOne(
            { _id: createdOrder._id },
            {
              $set: {
                payment: {
                  gateway: "midtrans",
                  transactionToken: snap.token || "",
                  redirectUrl: snap.redirect_url || `${midtransBase}/snap/v2/vtweb/${snap.token || ""}`,
                },
                updatedAt: new Date(),
              },
            },
          );
          createdOrder.payment = {
            gateway: "midtrans",
            transactionToken: snap.token || "",
            redirectUrl: snap.redirect_url || "",
          };
        }
      } catch (err) {
        // keep order created even if gateway call fails
      }
    }

    res.json({
      success: true,
      orderId: createdOrder.orderId,
      payment: createdOrder.payment,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Gagal membuat order" });
  } finally {
    await session.endSession();
  }
});

app.get("/api/ecommerce/orders", authMiddleware, async (req, res) => {
  const orders = await db.collection("ecommerceOrders").find().sort({ createdAt: -1 }).toArray();
  res.json(orders);
});

app.get("/api/ecommerce/orders/:id/detail", authMiddleware, async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "ID order tidak valid" });
  const order = await db.collection("ecommerceOrders").findOne({ _id: new ObjectId(id) });
  if (!order) return res.status(404).json({ error: "Order tidak ditemukan" });
  res.json(order);
});

app.get("/api/ecommerce/orders/:orderId", async (req, res) => {
  const order = await db.collection("ecommerceOrders").findOne({ orderId: req.params.orderId });
  if (!order) return res.status(404).json({ error: "Order tidak ditemukan" });
  res.json(order);
});

app.patch("/api/ecommerce/orders/:id/confirm", authMiddleware, async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "ID order tidak valid" });
  await db.collection("ecommerceOrders").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: { orderStatus: "confirmed", paymentStatus: "paid", updatedAt: new Date() },
      $push: {
        statusHistory: {
          at: new Date(),
          orderStatus: "confirmed",
          paymentStatus: "paid",
          note: "Order dikonfirmasi manual dari CMS",
        },
      },
    },
  );
  await logEcommerceAudit("order.confirm.manual", req.user, { orderId: id });
  res.json({ success: true });
});

app.post("/api/ecommerce/orders/:id/sync-midtrans", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "ID order tidak valid" });

    const order = await db.collection("ecommerceOrders").findOne({ _id: new ObjectId(id) });
    if (!order) return res.status(404).json({ error: "Order tidak ditemukan" });

    const site = await db.collection("siteConfig").findOne({ _id: "site" });
    const paymentCfg = getMidtransPaymentConfig(site);
    if (!paymentCfg.serverKey) {
      return res.status(400).json({ error: "Server key Midtrans belum dikonfigurasi" });
    }

    const apiBase = paymentCfg.isProduction
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com";
    const authToken = Buffer.from(`${paymentCfg.serverKey}:`).toString("base64");
    const resp = await fetch(`${apiBase}/v2/${encodeURIComponent(order.orderId)}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authToken}`,
      },
    });
    if (!resp.ok) return res.status(400).json({ error: "Gagal mengambil status Midtrans" });
    const data = await resp.json();

    const paymentStatus = mapMidtransToPaymentStatus(data.transaction_status, data.fraud_status);
    const orderStatus = paymentStatus === "paid" ? "confirmed" : order.orderStatus || "pending_confirmation";

    await db.collection("ecommerceOrders").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          paymentStatus,
          orderStatus,
          updatedAt: new Date(),
          "payment.lastTransactionStatus": data.transaction_status || "",
          "payment.lastPaymentType": data.payment_type || "",
          "payment.lastTransactionId": data.transaction_id || "",
        },
        $push: {
          statusHistory: {
            at: new Date(),
            orderStatus,
            paymentStatus,
            note: `Manual sync Midtrans: ${data.transaction_status || "unknown"}`,
          },
        },
      },
    );

    await logEcommerceAudit("order.sync.midtrans.manual", req.user, {
      orderId: id,
      paymentStatus,
      orderStatus,
      transactionStatus: data.transaction_status || "",
    });

    res.json({ success: true, paymentStatus, orderStatus, raw: data });
  } catch (err) {
    res.status(500).json({ error: "Gagal sync status Midtrans" });
  }
});

app.post("/api/ecommerce/midtrans/webhook", async (req, res) => {
  try {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
    } = req.body || {};

    if (!order_id) return res.status(400).json({ error: "order_id wajib ada" });
    const site = await db.collection("siteConfig").findOne({ _id: "site" });
    const paymentCfg = getMidtransPaymentConfig(site);
    if (!paymentCfg.serverKey) return res.status(400).json({ error: "Server key Midtrans belum dikonfigurasi" });

    const expected = buildMidtransSignature(order_id, String(status_code || ""), String(gross_amount || ""), paymentCfg.serverKey);
    if (String(signature_key || "").toLowerCase() !== expected.toLowerCase()) {
      return res.status(401).json({ error: "Signature Midtrans tidak valid" });
    }

    const paymentStatus = mapMidtransToPaymentStatus(transaction_status, fraud_status);
    const orderStatus = paymentStatus === "paid" ? "confirmed" : "pending_confirmation";

    const order = await db.collection("ecommerceOrders").findOne({ orderId: order_id });
    if (!order) return res.status(404).json({ error: "Order tidak ditemukan" });
    const eventKey = `${transaction_id || "no-tx"}|${transaction_status || "unknown"}|${payment_type || "unknown"}`;
    const existingEvents = Array.isArray(order.payment?.events) ? order.payment.events : [];
    if (existingEvents.includes(eventKey)) {
      return res.json({ success: true, duplicated: true });
    }

    await db.collection("ecommerceOrders").updateOne(
      { orderId: order_id },
      {
        $set: {
          paymentStatus,
          orderStatus,
          updatedAt: new Date(),
          "payment.lastTransactionStatus": transaction_status || "",
          "payment.lastPaymentType": payment_type || "",
          "payment.lastTransactionId": transaction_id || "",
        },
        $push: {
          statusHistory: {
            at: new Date(),
            orderStatus,
            paymentStatus,
            note: `Midtrans webhook: ${transaction_status || "unknown"}`,
          },
          "payment.events": eventKey,
        },
      },
    );
    await logEcommerceAudit("order.sync.midtrans.webhook", { username: "midtrans", role: "system" }, {
      orderId: order_id,
      paymentStatus,
      orderStatus,
      transactionStatus: transaction_status || "",
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal memproses webhook Midtrans" });
  }
});

app.get("/api/ecommerce/orders-export.csv", authMiddleware, async (req, res) => {
  const status = String(req.query.status || "").trim();
  const startDate = String(req.query.startDate || "").trim();
  const endDate = String(req.query.endDate || "").trim();
  const query = {};
  if (status) query.orderStatus = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  const orders = await db.collection("ecommerceOrders").find(query).sort({ createdAt: -1 }).toArray();
  const header = [
    "order_id",
    "customer_name",
    "customer_email",
    "customer_phone",
    "total_amount",
    "order_status",
    "payment_status",
    "created_at",
  ];
  const escapeCsv = (val = "") => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
      return `"${str.replace(/"/g, "\"\"")}"`;
    }
    return str;
  };
  const rows = orders.map((o) =>
    [
      o.orderId,
      o.customer?.name || "",
      o.customer?.email || "",
      o.customer?.phone || "",
      o.totalAmount || 0,
      o.orderStatus || "",
      o.paymentStatus || "",
      o.createdAt ? new Date(o.createdAt).toISOString() : "",
    ]
      .map(escapeCsv)
      .join(","),
  );
  const csv = [header.join(","), ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="ecommerce-orders-${Date.now()}.csv"`);
  res.send(csv);
});

app.post("/api/ecommerce/orders/bulk-action", authMiddleware, async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  const action = String(req.body?.action || "").trim();
  const validIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  if (!validIds.length) return res.status(400).json({ error: "Tidak ada order valid dipilih" });

  let setPayload = null;
  let note = "";
  if (action === "confirm") {
    setPayload = { orderStatus: "confirmed", paymentStatus: "paid", updatedAt: new Date() };
    note = "Bulk confirm dari CMS";
  } else if (action === "cancel") {
    setPayload = { orderStatus: "cancelled", paymentStatus: "cancelled", updatedAt: new Date() };
    note = "Bulk cancel dari CMS";
  } else if (action === "ship") {
    setPayload = { orderStatus: "shipped", updatedAt: new Date() };
    note = "Bulk mark shipped dari CMS";
  } else {
    return res.status(400).json({ error: "Action tidak valid" });
  }

  await db.collection("ecommerceOrders").updateMany(
    { _id: { $in: validIds } },
    {
      $set: setPayload,
      $push: {
        statusHistory: {
          at: new Date(),
          orderStatus: setPayload.orderStatus,
          paymentStatus: setPayload.paymentStatus || "pending",
          note,
        },
      },
    },
  );
  await logEcommerceAudit("order.bulk-action", req.user, {
    action,
    affected: validIds.length,
  });
  res.json({ success: true, affected: validIds.length });
});

app.get("/api/ecommerce/audit-logs", authMiddleware, requireAdmin, async (req, res) => {
  const logs = await db
    .collection("ecommerceAuditLogs")
    .find()
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  res.json(logs);
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

async function closeExpiredPendingOrders() {
  if (!db) return;
  const expireBefore = new Date(Date.now() - ORDER_PENDING_EXPIRE_HOURS * 60 * 60 * 1000);
  await db.collection("ecommerceOrders").updateMany(
    {
      orderStatus: "pending_confirmation",
      paymentStatus: { $in: ["pending", null] },
      createdAt: { $lt: expireBefore },
    },
    {
      $set: {
        orderStatus: "expired",
        paymentStatus: "expired",
        updatedAt: new Date(),
      },
      $push: {
        statusHistory: {
          at: new Date(),
          orderStatus: "expired",
          paymentStatus: "expired",
          note: `Auto-close expired setelah ${ORDER_PENDING_EXPIRE_HOURS} jam`,
        },
      },
    },
  );
}

let bootPromise = null;
let schedulerStarted = false;

export async function initServer(options = {}) {
  const enableScheduler = Boolean(options.enableScheduler);
  if (!bootPromise) {
    bootPromise = connectDb();
  }
  await bootPromise;

  if (enableScheduler && !schedulerStarted) {
    schedulerStarted = true;
    setInterval(() => {
      closeExpiredPendingOrders().catch((err) => console.error("Failed running order expiry scheduler:", err));
    }, 5 * 60 * 1000);
  }
}

async function startServer() {
  try {
    await initServer({ enableScheduler: true });
    app.listen(PORT, () => {
      console.log(`CMS backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start CMS backend:", err);
    process.exit(1);
  }
}

if (process.env.VERCEL !== "1") {
  startServer();
}

export { app };
