import { app, initServer } from "../server/index.js";

export default async function handler(req, res) {
  try {
    await initServer();
    return app(req, res);
  } catch (err) {
    console.error("Vercel API bootstrap error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({
        error: "Server error",
        detail: String(err?.message || err),
      }),
    );
  }
}

