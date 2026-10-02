import { Hono } from "hono";
import { query } from "../lib/db.js";

export const gamesRoutes = new Hono();

gamesRoutes.get("/api/games", async (c) => {
  const search = c.req.query(c.env.DATABASE_URL, "search");
  const featured = c.req.query(c.env.DATABASE_URL, "featured");

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

  let result;
  try {
    result = await query(
    `select *
     from games
     where ${conditions.join(" and ")}
     order by featured desc, created_at desc`,
    values,
    );
  } catch (error) {
    return c.json({
      error: error instanceof Error ? error.message : String(error),
      databaseUrlPresent: Boolean(process.env.DATABASE_URL),
    }, 500);
  }

  return c.json({ games: result.rows });
});

gamesRoutes.get("/api/games/:slug", async (c) => {
  const slug = c.req.param("slug");

  const gameResult = await query(
    `select *
     from games
     where slug = $1 and published = true
     limit 1`,
    [slug],
  );

  if (gameResult.rows.length === 0) {
    return c.json({ error: "Game not found" }, 404);
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

  return c.json({
    game,
    versions: versionsResult.rows,
    files,
  });
});
