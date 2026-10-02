import { Hono } from "hono";
import { gamesRoutes } from "./routes/games.js";

const app = new Hono();

app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    service: "goated-api",
    database: "d1",
  });
});

app.route("/", gamesRoutes);

export default app;
