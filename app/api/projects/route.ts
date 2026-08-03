import { NextResponse } from "next/server";
import { db, logActivity } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = db();
  const rows = await sql`
    SELECT p.*,
      COALESCE(t.total, 0)::int AS task_total,
      COALESCE(t.done, 0)::int AS task_done
    FROM projects p
    LEFT JOIN (
      SELECT project_id,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'done') AS done
      FROM tasks GROUP BY project_id
    ) t ON t.project_id = p.id
    ORDER BY p.pinned DESC, p.created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const sql = db();
  const b = await req.json();
  const rows = await sql`
    INSERT INTO projects (name, emoji, color, status, description, deadline, tags)
    VALUES (${b.name}, ${b.emoji ?? "🚀"}, ${b.color ?? "#a78bfa"},
            ${b.status ?? "planning"}, ${b.description ?? ""},
            ${b.deadline ?? null}, ${b.tags ?? []})
    RETURNING *
  `;
  await logActivity("project", `새 프로젝트 「${b.name}」 을(를) 만들었어요`);
  return NextResponse.json(rows[0], { status: 201 });
}
