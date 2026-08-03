// Adds business-flow stages, per-project stage checks, and app settings.
// Usage: node scripts/migrate-005-flow.mjs
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

await sql`
  CREATE TABLE IF NOT EXISTS stages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    position INT NOT NULL DEFAULT 0
  )
`;
await sql`
  CREATE TABLE IF NOT EXISTS project_stage_checks (
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage_id INT NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, stage_id)
  )
`;
await sql`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`;

const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM stages`;
if (count === 0) {
  const names = [
    "🔍 시장조사·아이템 검증",
    "✍️ 네이밍·브랜딩",
    "🌐 도메인·채널 개설",
    "🛠️ MVP 제작",
    "💳 결제·정산 연결",
    "📣 광고·트래킹 연결",
    "🚀 출시",
    "🤝 레퍼럴 시스템 도입",
    "📈 지표 분석·수익화",
  ];
  for (let i = 0; i < names.length; i++) {
    await sql`INSERT INTO stages (name, position) VALUES (${names[i]}, ${i + 1})`;
  }
  console.log(`Seeded ${names.length} default stages.`);
}

console.log("Migration done: stages / project_stage_checks / settings.");
