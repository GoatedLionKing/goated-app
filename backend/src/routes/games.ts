import { Hono } from "hono";
import { query } from "../lib/db.js";

export const gamesRoutes = new Hono();

gamesRoutes.get("/api/games", async (c) => {
  const search = c.req.query("search");
  const featured = c.req.query("featured");

  const conditions = ["published = 1"];
  const values: unknown[] = [];

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    values.push(term, term, term);
    conditions.push(`
      (
        title LIKE ?
        OR description LIKE ?
        OR platform_name LIKE ?
      )
    `);
  }

  if (featured === "true") {
    conditions.push("featured = 1");
  }

  try {
    const result = await query(
      c.env.DB,
      `SELECT *
       FROM games
       WHERE ${conditions.join(" AND ")}
       ORDER BY featured DESC, created_at DESC`,
      values,
    );

    return c.json({ games: result.rows });
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

gamesRoutes.get("/api/games/:slug", async (c) => {
  const slug = c.req.param("slug");

  try {
    const gameResult = await query(
      c.env.DB,
      `SELECT *
       FROM games
       WHERE slug = ? AND published = 1
       LIMIT 1`,
      [slug],
    );

    if (gameResult.rows.length === 0) {
      return c.json({ error: "Game not found" }, 404);
    }

    const game = gameResult.rows[0];

    const versionsResult = await query(
      c.env.DB,
      `SELECT *
       FROM game_versions
       WHERE game_id = ?
       ORDER BY created_at DESC`,
      [game.id],
    );

    const files: unknown[] = [];

    for (const version of versionsResult.rows) {
      const filesResult = await query(
        c.env.DB,
        `SELECT *
         FROM game_files
         WHERE version_id = ?
         ORDER BY created_at DESC`,
        [version.id],
      );

      files.push(...filesResult.rows);
    }

    return c.json({
      game,
      versions: versionsResult.rows,
      files,
    });
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
