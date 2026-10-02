console.log("GOATED API STARTING");
import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { authRoutes } from "./routes/auth.js";
import { ownerRoutes } from "./routes/owner.js";
import { ownerGamesRoutes } from "./routes/owner-games.js";
import { ownerVersionsRoutes } from "./routes/owner-versions.js";
import { ownerFilesRoutes } from "./routes/owner-files.js";
import { downloadsRoutes } from "./routes/downloads.js";
import { ownerCatalogRoutes } from "./routes/owner-catalog.js";
import { gamesRoutes } from "./routes/games.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});



await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? "development-only-secret",
});

await app.register(authRoutes);
await app.register(ownerRoutes);
await app.register(ownerGamesRoutes);
await app.register(ownerVersionsRoutes);
await app.register(ownerFilesRoutes);
await app.register(downloadsRoutes);
await app.register(ownerCatalogRoutes);

await app.register(gamesRoutes);

app.get("/api/health", async () => ({
  ok: true,
  service: "goated-api",
}));

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
