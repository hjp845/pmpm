// Adds manual position for project cards (한눈에 grid reordering).
// Usage: node scripts/migrate-003-position.mjs
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

await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0`;
await sql`
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
    FROM projects
  )
  UPDATE projects SET position = ranked.rn
  FROM ranked WHERE projects.id = ranked.id
`;

console.log("Migration done: projects.position added and initialized.");
