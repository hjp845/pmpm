import { NextResponse } from "next/server";
import { db, logActivity } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = db();
  const rows = await sql`
    SELECT * FROM tasks
    ORDER BY sort_order ASC, created_at ASC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const sql = db();
  const b = await req.json();
  const rows = await sql`
    INSERT INTO tasks (project_id, title, status, priority, urgency, importance, due_date, sort_order)
    VALUES (${b.project_id ?? null}, ${b.title}, ${b.status ?? "todo"},
            ${b.priority ?? "mid"}, ${b.urgency ?? 50}, ${b.importance ?? 50},
            ${b.due_date ?? null},
            (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tasks
             WHERE project_id IS NOT DISTINCT FROM ${b.project_id ?? null}::int))
    RETURNING *
  `;
  await logActivity("task", `할 일 「${b.title}」 을(를) 추가했어요`);
  return NextResponse.json(rows[0], { status: 201 });
}
