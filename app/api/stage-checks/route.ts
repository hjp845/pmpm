import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = db();
  const rows = await sql`SELECT project_id, stage_id FROM project_stage_checks`;
  return NextResponse.json(rows);
}

// body: { project_id, stage_id, done } — done=true 체크, false 해제
export async function POST(req: Request) {
  const sql = db();
  const b = await req.json();
  if (b.done) {
    await sql`
      INSERT INTO project_stage_checks (project_id, stage_id)
      VALUES (${b.project_id}, ${b.stage_id})
      ON CONFLICT DO NOTHING
    `;
  } else {
    await sql`
      DELETE FROM project_stage_checks
      WHERE project_id = ${b.project_id} AND stage_id = ${b.stage_id}
    `;
  }
  return NextResponse.json({ ok: true });
}
