import { NextResponse } from "next/server";
import { db, logActivity } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = db();
  const rows = await sql`
    SELECT * FROM tasks
    ORDER BY
      CASE priority WHEN 'high' THEN 0 WHEN 'mid' THEN 1 ELSE 2 END,
      due_date ASC NULLS LAST,
      created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const sql = db();
  const b = await req.json();
  const rows = await sql`
    INSERT INTO tasks (project_id, title, status, priority, due_date)
    VALUES (${b.project_id ?? null}, ${b.title}, ${b.status ?? "todo"},
            ${b.priority ?? "mid"}, ${b.due_date ?? null})
    RETURNING *
  `;
  await logActivity("task", `할 일 「${b.title}」 을(를) 추가했어요`);
  return NextResponse.json(rows[0], { status: 201 });
}
