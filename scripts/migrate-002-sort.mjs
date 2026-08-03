// Adds manual sort order for tasks (한눈에 tab list reordering).
// Usage: node scripts/migrate-002-sort.mjs
import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "node:fs";

if (!process.env.DATABASE_URL) {
  for (const f of [".env.development.local", ".env.local", ".env"]) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^DATABASE_URL=["']?([^"'\r\n]+)/);
      if (m) process.env.DATABASE_URL = m[1];
    }
    if (process.env.DATABASE_URL) break;
  }
}

const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0`;
// keep current display order (score desc) as the initial manual order
await sql`
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY project_id
      ORDER BY (urgency + importance) DESC, id
    ) AS rn
    FROM tasks
  )
  UPDATE tasks SET sort_order = ranked.rn
  FROM ranked WHERE tasks.id = ranked.id
`;

console.log("Migration done: tasks.sort_order added and initialized.");
