// One-time DB setup: creates tables and seeds sample data.
// Usage: node scripts/init-db.mjs  (requires DATABASE_URL in env or .env.development.local)
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

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

console.log("Creating tables…");

await sql`
  CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🚀',
    color TEXT NOT NULL DEFAULT '#a78bfa',
    status TEXT NOT NULL DEFAULT 'planning',
    description TEXT NOT NULL DEFAULT '',
    deadline DATE,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'mid',
    urgency INT NOT NULL DEFAULT 50,
    importance INT NOT NULL DEFAULT 50,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    done_at TIMESTAMPTZ
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#fef3c7',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM projects`;
if (count > 0) {
  console.log(`Tables ready. ${count} project(s) already exist — skipping seed.`);
  process.exit(0);
}

console.log("Seeding sample data…");

const day = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const [p1] = await sql`
  INSERT INTO projects (name, emoji, color, status, description, deadline, pinned, tags)
  VALUES ('스마트스토어 운영', '🛍️', '#f472b6', 'active',
          '핸드메이드 소품 온라인 판매. 주간 신상품 업로드와 CS 관리.',
          ${day(20)}, TRUE, ARRAY['이커머스','부업'])
  RETURNING id
`;
const [p2] = await sql`
  INSERT INTO projects (name, emoji, color, status, description, deadline, pinned, tags)
  VALUES ('카페 창업 준비', '☕', '#fb923c', 'planning',
          '동네 감성 카페 오픈 준비. 상권 분석부터 인테리어까지.',
          ${day(90)}, TRUE, ARRAY['오프라인','창업'])
  RETURNING id
`;
const [p3] = await sql`
  INSERT INTO projects (name, emoji, color, status, description, deadline, pinned, tags)
  VALUES ('유튜브 채널', '🎬', '#818cf8', 'active',
          '주 1회 브이로그 업로드. 구독자 1만 명 목표!',
          NULL, FALSE, ARRAY['콘텐츠','수익화'])
  RETURNING id
`;
const [p4] = await sql`
  INSERT INTO projects (name, emoji, color, status, description, deadline, pinned, tags)
  VALUES ('블로그 리브랜딩', '✍️', '#4ade80', 'done',
          '티스토리에서 자체 블로그로 이전 완료.',
          NULL, FALSE, ARRAY['콘텐츠'])
  RETURNING id
`;
await sql`
  INSERT INTO projects (name, emoji, color, status, description, tags)
  VALUES ('앱 사이드프로젝트', '📱', '#38bdf8', 'paused',
          '가계부 앱 아이디어. 카페 오픈 후 재개 예정.', ARRAY['개발'])
`;

await sql`
  INSERT INTO tasks (project_id, title, status, priority, due_date, done_at) VALUES
  (${p1.id}, '신상품 10종 사진 촬영', 'doing', 'high', ${day(2)}, NULL),
  (${p1.id}, '가을 시즌 기획전 배너 만들기', 'todo', 'mid', ${day(5)}, NULL),
  (${p1.id}, '리뷰 이벤트 당첨자 발표', 'todo', 'high', ${day(1)}, NULL),
  (${p1.id}, '재고 정리 및 발주', 'done', 'mid', ${day(-1)}, NOW() - INTERVAL '1 day'),
  (${p2.id}, '후보 상가 3곳 임장', 'doing', 'high', ${day(7)}, NULL),
  (${p2.id}, '원두 납품 업체 미팅', 'todo', 'mid', ${day(10)}, NULL),
  (${p2.id}, '사업자 등록 서류 준비', 'todo', 'low', ${day(14)}, NULL),
  (${p3.id}, '이번 주 브이로그 편집', 'doing', 'high', ${day(3)}, NULL),
  (${p3.id}, '썸네일 A/B 테스트', 'todo', 'low', NULL, NULL),
  (${p3.id}, '지난 주 영상 업로드', 'done', 'high', ${day(-3)}, NOW() - INTERVAL '3 days'),
  (${p4.id}, '도메인 연결', 'done', 'mid', NULL, NOW() - INTERVAL '5 days'),
  (${p4.id}, '옛 글 50개 이전', 'done', 'low', NULL, NOW() - INTERVAL '2 days'),
  (NULL, '세금계산서 발행 잊지 말기', 'todo', 'high', ${day(4)}, NULL)
`;

await sql`
  INSERT INTO notes (project_id, content, color) VALUES
  (${p1.id}, '포장재 바꾸니 리뷰 평점 0.3 올랐다! 🎉 크라프트지 + 스티커 조합 유지하기', '#fef3c7'),
  (${p2.id}, '2번 후보 상가: 역세권이지만 권리금 높음.\n3번: 골목이지만 감성 있음. 유동인구 다시 체크', '#dbeafe'),
  (${p3.id}, '다음 영상 아이디어: 카페 창업 준비 브이로그와 크로스오버?! 🤔', '#f3e8ff'),
  (NULL, '10월부터 부가세 신고 방식 바뀜. 세무사님께 문의하기', '#fce7f3')
`;

await sql`
  INSERT INTO activities (type, message, created_at) VALUES
  ('project', '새 프로젝트 「스마트스토어 운영」 을(를) 만들었어요', NOW() - INTERVAL '6 days'),
  ('task', '할 일 「재고 정리 및 발주」 을(를) 완료했어요 ✅', NOW() - INTERVAL '1 day'),
  ('task', '할 일 「지난 주 영상 업로드」 을(를) 완료했어요 ✅', NOW() - INTERVAL '3 days'),
  ('note', '새 메모를 남겼어요 📝', NOW() - INTERVAL '2 hours')
`;

console.log("Done! 🎉 Tables created and sample data seeded.");
