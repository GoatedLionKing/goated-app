import type { Context, Next } from "hono";

const encoder = new TextEncoder();

function base64url(value: ArrayBuffer | Uint8Array) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
    + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sign(data: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  return base64url(await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data),
  ));
}

export async function createToken(
  ownerId: string,
  secret: string,
) {
  const header = base64url(
    encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })),
  );

  const payload = base64url(
    encoder.encode(
      JSON.stringify({
        sub: ownerId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      }),
    ),
  );

  const data = `${header}.${payload}`;
  const signature = await sign(data, secret);

  return `${data}.${signature}`;
}

export async function requireOwner(c: Context, next: Next) {
  const authorization = c.req.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authorization.slice(7);
  const parts = token.split(".");

  if (parts.length !== 3) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const secret = c.env.JWT_SECRET;

  if (!secret) {
    return c.json({ error: "JWT secret is not configured" }, 500);
  }

  const expected = await sign(`${parts[0]}.${parts[1]}`, secret);

  if (expected !== parts[2]) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const payload = JSON.parse(
    new TextDecoder().decode(fromBase64url(parts[1])),
  );

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("ownerId", payload.sub);

  await next();
}
