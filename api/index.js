import { app, initServer } from "../server/index.js";

export default async function handler(req, res) {
  await initServer();
  return app(req, res);
}

