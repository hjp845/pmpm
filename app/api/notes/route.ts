import { NextResponse } from "next/server";
import { db, logActivity } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = db();
  const rows = await sql`SELECT * FROM notes ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const sql = db();
  const b = await req.json();
  const rows = await sql`
    INSERT INTO notes (project_id, content, color)
    VALUES (${b.project_id ?? null}, ${b.content}, ${b.color ?? "#fef3c7"})
    RETURNING *
  `;
  await logActivity("note", "새 메모를 남겼어요 📝");
  return NextResponse.json(rows[0], { status: 201 });
}
