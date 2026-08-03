import { NextResponse } from "next/server";
import { db, logActivity } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = db();
  const b = await req.json();
  const rows = await sql`
    UPDATE projects SET
      name = COALESCE(${b.name ?? null}, name),
      emoji = COALESCE(${b.emoji ?? null}, emoji),
      color = COALESCE(${b.color ?? null}, color),
      status = COALESCE(${b.status ?? null}, status),
      description = COALESCE(${b.description ?? null}, description),
      deadline = CASE WHEN ${b.deadline !== undefined} THEN ${b.deadline ?? null}::date ELSE deadline END,
      pinned = COALESCE(${b.pinned ?? null}, pinned),
      tags = COALESCE(${b.tags ?? null}, tags)
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (rows.length === 0)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (b.status === "done")
    await logActivity("project", `프로젝트 「${rows[0].name}」 을(를) 완료했어요 🎉`);
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = db();
  const rows = await sql`DELETE FROM projects WHERE id = ${Number(id)} RETURNING name`;
  if (rows.length > 0)
    await logActivity("project", `프로젝트 「${rows[0].name}」 을(를) 삭제했어요`);
  return NextResponse.json({ ok: true });
}
