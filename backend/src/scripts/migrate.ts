import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { query, pool } from "../lib/db.js";

const sqlPath = resolve(
  process.cwd(),
  "database/001_initial.sql",
);

const sql = await readFile(sqlPath, "utf8");

await query(sql);

console.log("Database migration completed.");

await pool.end();
