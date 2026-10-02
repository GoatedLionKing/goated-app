import { neon } from "@neondatabase/serverless";

export async function query<T = Record<string, unknown>>(
  databaseUrl: string,
  text: string,
  values: unknown[] = [],
) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = neon(databaseUrl);
  const rows = await sql.query(text, values);

  return { rows } as { rows: T[] };
}

export const pool = {
  async end() {},
};
