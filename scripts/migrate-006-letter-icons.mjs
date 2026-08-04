// One-off: switch existing project icons to name-first-letter monograms,
// except the project named '매일11시'.
// Usage: node scripts/migrate-006-letter-icons.mjs
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

const rows = await sql`
  UPDATE projects
  SET emoji = UPPER(LEFT(TRIM(name), 1))
  WHERE TRIM(name) <> '' AND name <> '매일11시'
  RETURNING name, emoji
`;
for (const r of rows) console.log(`${r.name} → ${r.emoji}`);
console.log(`Done: ${rows.length} projects switched to letter icons.`);
