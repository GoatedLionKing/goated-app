import type { FastifyInstance } from "fastify";
import { query } from "../lib/db.js";
import { requireOwner } from "../lib/auth.js";

export async function ownerCatalogRoutes(app: FastifyInstance) {
  app.get(
    "/api/owner/games",
    { preHandler: requireOwner },
    async () => {
      const result = await query(
        `select
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
          published,
          created_at,
          updated_at
         from games
         order by created_at desc`,
      );

      return {
        games: result.rows,
      };
    },
  );
}
