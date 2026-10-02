import { neon } from "@neondatabase/serverless";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  return url;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  values: unknown[] = [],
) {
  const sql = neon(getDatabaseUrl());
  const rows = await sql.query(text, values);
  return { rows } as { rows: T[] };
}

export const pool = {
  async end() {},
};
