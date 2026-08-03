import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = db();
  const b = await req.json();
  const rows = await sql`
    UPDATE stages SET name = COALESCE(${b.name ?? null}, name)
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (rows.length === 0)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = db();
  await sql`DELETE FROM stages WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
