import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// body: { ids: number[] } — full ordered project id list; assigns position.
export async function POST(req: Request) {
  const sql = db();
  const b = await req.json();
  const ids: number[] = (b.ids ?? []).map(Number);
  if (ids.length === 0) return NextResponse.json({ ok: true });
  await sql`
    UPDATE projects
    SET position = x.ord::int
    FROM unnest(${ids}::int[]) WITH ORDINALITY AS x(id, ord)
    WHERE projects.id = x.id
  `;
  return NextResponse.json({ ok: true });
}
