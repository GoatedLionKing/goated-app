import { Hono } from "hono";
import type { Env } from "../lib/env.js";
import { query } from "../lib/db.js";
import { requireOwner } from "../lib/auth.js";

export const ownerRoutes = new Hono<Env>();

ownerRoutes.get("/api/owner/games", requireOwner, async (c) => {
  try {
    const result = await query(
      c.env.DB,
      `SELECT *
       FROM games
       ORDER BY created_at DESC`,
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
