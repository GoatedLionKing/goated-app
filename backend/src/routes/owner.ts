import type { FastifyInstance } from "fastify";
import { requireOwner } from "../lib/auth.js";

export async function ownerRoutes(app: FastifyInstance) {
  app.get(
    "/api/owner/me",
    { preHandler: requireOwner },
    async (request) => {
      return {
        authenticated: true,
        owner: request.user,
      };
    },
  );
}
