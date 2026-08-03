import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// body: { project_id: number | null, ids: number[] } — full ordered id list
// of that project's (or inbox's) open tasks; assigns sort_order and, for a
// task dragged in from another project, the new project_id.
export async function POST(req: Request) {
  const sql = db();
  const b = await req.json();
  const ids: number[] = (b.ids ?? []).map(Number);
  if (ids.length === 0) return NextResponse.json({ ok: true });
  await sql`
    UPDATE tasks
    SET sort_order = x.ord::int,
        project_id = ${b.project_id ?? null}::int
    FROM unnest(${ids}::int[]) WITH ORDINALITY AS x(id, ord)
    WHERE tasks.id = x.id
  `;
  return NextResponse.json({ ok: true });
}
