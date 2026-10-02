import { Hono } from "hono";
import type { Env } from "../lib/env.js";
import { query } from "../lib/db.js";
import { createToken } from "../lib/auth.js";

const encoder = new TextEncoder();

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function verifyPassword(password: string, stored: string) {
  const parts = stored.split("$");

  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") {
    return false;
  }

  const iterations = Number(parts[2]);
  if (!Number.isFinite(iterations) || iterations < 1) {
    return false;
  }

  const salt = base64ToBytes(parts[3]);
  const expected = base64ToBytes(parts[4]);

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    key,
    expected.length * 8,
  );

  const actual = new Uint8Array(bits);

  if (actual.length !== expected.length) {
    return false;
  }

  let difference = 0;
  for (let i = 0; i < actual.length; i++) {
    difference |= actual[i] ^ expected[i];
  }

  return difference === 0;
}

export const authRoutes = new Hono<Env>();

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

    const valid = await verifyPassword(password, owner.password_hash);

    if (!valid) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const secret = c.env.JWT_SECRET;
    if (!secret) {
      return c.json({ error: "JWT secret is not configured" }, 500);
    }

    const token = await createToken(owner.id, secret);

    return c.json({
      ok: true,
      token,
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
