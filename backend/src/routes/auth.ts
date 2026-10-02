import { Hono } from "hono";
import { query } from "../lib/db.js";

export const authRoutes = new Hono();

authRoutes.post("/api/auth/login", async (c) => {
  try {
    const body = await c.req.json<{
      email?: string;
      password?: string;
    }>();

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const result = await query(
      c.env.DB,
      `SELECT id, email, password_hash
       FROM owners
       WHERE email = ?
       LIMIT 1`,
      [email],
    );

    if (result.rows.length === 0) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const owner = result.rows[0] as {
      id: string;
      email: string;
      password_hash: string;
    };

    if (password !== owner.password_hash) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    return c.json({
      ok: true,
      owner: {
        id: owner.id,
        email: owner.email,
      },
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
