// Adds urgency/importance columns for the Eisenhower matrix tab.
// Usage: node scripts/migrate-001-matrix.mjs
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

await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS urgency INT NOT NULL DEFAULT 50`;
await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS importance INT NOT NULL DEFAULT 50`;
// spread out existing tasks so the chart doesn't start as one pile
await sql`
  UPDATE tasks
  SET urgency = 10 + floor(random() * 81)::int,
      importance = 10 + floor(random() * 81)::int
  WHERE urgency = 50 AND importance = 50
`;

console.log("Migration done: tasks.urgency / tasks.importance added.");
