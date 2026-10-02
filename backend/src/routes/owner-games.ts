import type { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto from "node:crypto";
import { query } from "../lib/db.js";
import { requireOwner } from "../lib/auth.js";

const createGameSchema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  description: z.string().default(""),
  cover_url: z.string().url().optional(),
  platform_name: z.string().max(100).optional(),
  project_type_name: z.string().max(100).optional(),
  status_name: z.string().max(100).optional(),
  version: z.string().max(100).optional(),
  developer: z.string().max(200).optional(),
  original_release: z.string().optional(),
  localization_release: z.string().optional(),
  youtube_video_url: z.string().url().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
});

export async function ownerGamesRoutes(app: FastifyInstance) {
  app.post("/api/owner/games", { preHandler: requireOwner }, async (request, reply) => {
    const parsed = createGameSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid game data",
        details: parsed.error.flatten(),
      });
    }

    const game = parsed.data;

    const result = await query(
      `insert into games (
        id,
        slug,
        title,
        description,
        cover_url,
        platform_name,
        project_type_name,
        status_name,
        version,
        developer,
        original_release,
        localization_release,
        youtube_video_url,
        featured,
        published
      )
      values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
      )
      returning *`,
      [
        crypto.randomUUID(),
        game.slug,
        game.title,
        game.description,
        game.cover_url ?? null,
        game.platform_name ?? null,
        game.project_type_name ?? null,
        game.status_name ?? null,
        game.version ?? null,
        game.developer ?? null,
        game.original_release ?? null,
        game.localization_release ?? null,
        game.youtube_video_url ?? null,
        game.featured,
        game.published,
      ],
    );

    return reply.code(201).send({
      game: result.rows[0],
    });
  });

  app.put<{
    Params: { id: string };
  }>("/api/owner/games/:id", { preHandler: requireOwner }, async (request, reply) => {
    const parsed = createGameSchema.partial().safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid game data",
        details: parsed.error.flatten(),
      });
    }

    const data = parsed.data;
    const fields = Object.entries(data);

    if (fields.length === 0) {
      return reply.code(400).send({
        error: "No fields to update",
      });
    }

    const setParts = fields.map(([key], index) => `${key} = $${index + 1}`);
    const values = fields.map(([, value]) => value);

    values.push(request.params.id);

    const result = await query(
      `update games
       set ${setParts.join(", ")}, updated_at = now()
       where id = $${values.length}
       returning *`,
      values,
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({
        error: "Game not found",
      });
    }

    return {
      game: result.rows[0],
    };
  });

  app.delete<{
    Params: { id: string };
  }>("/api/owner/games/:id", { preHandler: requireOwner }, async (request, reply) => {
    const result = await query(
      `delete from games
       where id = $1
       returning id`,
      [request.params.id],
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({
        error: "Game not found",
      });
    }

    return {
      deleted: true,
      id: result.rows[0].id,
    };
  });
}

