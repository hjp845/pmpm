import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// body: { ids: number[] } — full ordered stage id list
export async function POST(req: Request) {
  const sql = db();
  const b = await req.json();
  const ids: number[] = (b.ids ?? []).map(Number);
  if (ids.length === 0) return NextResponse.json({ ok: true });
  await sql`
    UPDATE stages
    SET position = x.ord::int
    FROM unnest(${ids}::int[]) WITH ORDINALITY AS x(id, ord)
    WHERE stages.id = x.id
  `;
  return NextResponse.json({ ok: true });
}
