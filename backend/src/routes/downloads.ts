import type { FastifyInstance } from "fastify";
import { query } from "../lib/db.js";

export async function downloadsRoutes(app: FastifyInstance) {
  app.get<{
    Params: { id: string };
  }>("/api/files/:id/download", async (request, reply) => {
    const result = await query<{ id: string; external_url: string }>(
      `select
        id,
        name,
        external_url
       from game_files
       where id = $1
       limit 1`,
      [request.params.id],
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({
        error: "File not found",
      });
    }

    const file = result.rows[0];

    await query(
      `update game_files
       set download_count = download_count + 1
       where id = $1`,
      [file.id],
    );

    if (file.external_url) {
      return reply.redirect(file.external_url);
    }



    return reply.code(404).send({
      error: "Download source not configured",
    });
  });
}
