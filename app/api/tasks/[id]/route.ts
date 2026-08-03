import { NextResponse } from "next/server";
import { db, logActivity } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = db();
  const b = await req.json();
  const rows = await sql`
    UPDATE tasks SET
      title = COALESCE(${b.title ?? null}, title),
      status = COALESCE(${b.status ?? null}, status),
      priority = COALESCE(${b.priority ?? null}, priority),
      project_id = CASE WHEN ${b.project_id !== undefined} THEN ${b.project_id ?? null}::int ELSE project_id END,
      due_date = CASE WHEN ${b.due_date !== undefined} THEN ${b.due_date ?? null}::date ELSE due_date END,
      done_at = CASE
        WHEN ${b.status === "done"} THEN NOW()
        WHEN ${b.status !== undefined && b.status !== "done"} THEN NULL
        ELSE done_at END
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (rows.length === 0)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (b.status === "done")
    await logActivity("task", `할 일 「${rows[0].title}」 을(를) 완료했어요 ✅`);
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = db();
  await sql`DELETE FROM tasks WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
