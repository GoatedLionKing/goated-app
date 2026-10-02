import type { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto from "node:crypto";
import { query } from "../lib/db.js";
import { requireOwner } from "../lib/auth.js";

const versionSchema = z.object({
  name: z.string().min(1).max(200),
  version_number: z.string().min(1).max(100),
  description: z.string().default(""),
  release_date: z.string().optional(),
});

export async function ownerVersionsRoutes(app: FastifyInstance) {
  app.post<{
    Params: { gameId: string };
  }>(
    "/api/owner/games/:gameId/versions",
    { preHandler: requireOwner },
    async (request, reply) => {
      const parsed = versionSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: "Invalid version data",
          details: parsed.error.flatten(),
        });
      }

      const game = await query(
        `select id from games where id = $1 limit 1`,
        [request.params.gameId],
      );

      if (game.rows.length === 0) {
        return reply.code(404).send({
          error: "Game not found",
        });
      }

      const version = parsed.data;

      const result = await query(
        `insert into game_versions (
          id,
          game_id,
          name,
          version_number,
          description,
          release_date
        )
        values ($1,$2,$3,$4,$5,$6)
        returning *`,
        [
          crypto.randomUUID(),
          request.params.gameId,
          version.name,
          version.version_number,
          version.description,
          version.release_date ?? null,
        ],
      );

      return reply.code(201).send({
        version: result.rows[0],
      });
    },
  );

  app.put<{
    Params: { id: string };
    Body: {
      name?: string;
      version_number?: string;
      description?: string;
      release_date?: string;
    };
  }>(
    "/api/owner/versions/:id",
    { preHandler: requireOwner },
    async (request, reply) => {
      const fields = request.body;
      const keys = Object.keys(fields).filter(
        (key) => fields[key as keyof typeof fields] !== undefined,
      );

      if (keys.length === 0) {
        return reply.code(400).send({
          error: "No fields to update",
        });
      }

      const values = keys.map(
        (key) => fields[key as keyof typeof fields],
      );

      const setClause = keys
        .map((key, index) => `${key} = $${index + 1}`)
        .join(", ");

      const result = await query(
        `update game_versions
         set ${setClause}
         where id = $${values.length + 1}
         returning *`,
        [...values, request.params.id],
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({
          error: "Version not found",
        });
      }

      return { version: result.rows[0] };
    },
  );

  app.delete<{
    Params: { id: string };
  }>(
    "/api/owner/versions/:id",
    { preHandler: requireOwner },
    async (request, reply) => {
      const result = await query(
        `delete from game_versions
         where id = $1
         returning id`,
        [request.params.id],
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({
          error: "Version not found",
        });
      }

      return {
        deleted: true,
        id: result.rows[0].id,
      };
    },
  );

}
