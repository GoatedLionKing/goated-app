import { Hono } from "hono";
import type { Env } from "./lib/env.js";
import { gamesRoutes } from "./routes/games.js";
import { authRoutes } from "./routes/auth.js";
import { ownerRoutes } from "./routes/owner.js";


const app = new Hono<Env>();

app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    service: "goated-api",
    database: "d1",
  });
});

app.route("/", gamesRoutes);
app.route("/", authRoutes);
app.route("/", ownerRoutes);

export default app;
