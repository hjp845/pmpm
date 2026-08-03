// Adds custom uploaded icon (data URL) for projects.
// Usage: node scripts/migrate-004-icon.mjs
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
await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS icon TEXT`;
console.log("Migration done: projects.icon added.");
