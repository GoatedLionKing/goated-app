import { Hono } from "hono";
import { gamesRoutes } from "./routes/games.js";
import { authRoutes } from "./routes/auth.js";

const app = new Hono();

app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    service: "goated-api",
    database: "d1",
  });
});

app.route("/", gamesRoutes);
app.route("/", authRoutes);

export default app;
