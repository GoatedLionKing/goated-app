import type { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto from "node:crypto";
import { query } from "../lib/db.js";
import { requireOwner } from "../lib/auth.js";

const fileSchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().default(""),
    external_url: z.string().url().optional(),
    file_size: z.number().int().nonnegative().optional(),
  })
  .refine(
    (data) => Boolean(data.external_url),
    {
      message: "external_url is required",
    },
  );

export async function ownerFilesRoutes(app: FastifyInstance) {
  app.post<{
    Params: { versionId: string };
  }>(
    "/api/owner/versions/:versionId/files",
    { preHandler: requireOwner },
    async (request, reply) => {
      const parsed = fileSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: "Invalid file data",
          details: parsed.error.flatten(),
        });
      }

      const version = await query(
        `select id
         from game_versions
         where id = $1
         limit 1`,
        [request.params.versionId],
      );

      if (version.rows.length === 0) {
        return reply.code(404).send({
          error: "Version not found",
        });
      }

      const file = parsed.data;

      const result = await query(
        `insert into game_files (
          id,
          version_id,
          name,
          description,
          external_url,
          file_size
        )
        values ($1,$2,$3,$4,$5,$6,$7)
        returning *`,
        [
          crypto.randomUUID(),
          request.params.versionId,
          file.name,
          file.description,
          file.external_url ?? null,
          file.file_size ?? null,
        ],
      );

      return reply.code(201).send({
        file: result.rows[0],
      });
    },
  );

  app.get<{
    Params: { versionId: string };
  }>(
    "/api/owner/versions/:versionId/files",
    { preHandler: requireOwner },
    async (request) => {
      const result = await query(
        `select *
         from game_files
         where version_id = $1
         order by created_at desc`,
        [request.params.versionId],
      );

      return { files: result.rows };
    },
  );
  app.delete<{
    Params: { id: string };
  }>(
    "/api/owner/files/:id",
    { preHandler: requireOwner },
    async (request, reply) => {
      const result = await query(
        `delete from game_files
         where id = $1
         returning id`,
        [request.params.id],
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({
          error: "File not found",
        });
      }

      return {
        deleted: true,
        id: result.rows[0].id,
      };
    },
  );

}
