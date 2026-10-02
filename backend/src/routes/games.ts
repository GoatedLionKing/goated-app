import type { FastifyInstance } from "fastify";
import { query } from "../lib/db.js";

export async function gamesRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: {
      search?: string;
      featured?: string;
    };
  }>("/api/games", async (request) => {
    const { search, featured } = request.query;

    const conditions = ["published = true"];
    const values: string[] = [];

    if (search?.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(
        title ilike $${values.length}
        or description ilike $${values.length}
        or platform_name ilike $${values.length}
      )`);
    }

    if (featured === "true") {
      conditions.push("featured = true");
    }

    const result = await query(
      `select *
       from games
       where ${conditions.join(" and ")}
       order by featured desc, created_at desc`,
      values,
    );

    return { games: result.rows };
  });

  app.get<{
    Params: { slug: string };
  }>("/api/games/:slug", async (request, reply) => {
    const gameResult = await query(
      `select *
       from games
       where slug = $1 and published = true
       limit 1`,
      [request.params.slug],
    );

    if (gameResult.rows.length === 0) {
      return reply.code(404).send({ error: "Game not found" });
    }

    const game = gameResult.rows[0];

    const versionsResult = await query(
      `select *
       from game_versions
       where game_id = $1
       order by created_at desc`,
      [game.id],
    );

    const versionIds = versionsResult.rows.map((version) => version.id);

    let files: unknown[] = [];

    if (versionIds.length > 0) {
      const filesResult = await query(
        `select *
         from game_files
         where version_id = any($1::uuid[])
         order by created_at desc`,
        [versionIds],
      );

      files = filesResult.rows;
    }

    return {
      game,
      versions: versionsResult.rows,
      files,
    };
  });
}
