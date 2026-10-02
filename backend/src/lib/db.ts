export async function query<T = Record<string, unknown>>(
  db: D1Database,
  sql: string,
  values: unknown[] = [],
) {
  const result = await db.prepare(sql).bind(...values).all<T>();

  return {
    rows: result.results,
  };
}

export const pool = {
  async end() {},
};
