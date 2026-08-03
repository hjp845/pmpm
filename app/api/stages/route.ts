import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = db();
  const rows = await sql`SELECT * FROM stages ORDER BY position ASC, id ASC`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const sql = db();
  const b = await req.json();
  const rows = await sql`
    INSERT INTO stages (name, position)
    VALUES (${b.name ?? "📍 새 단계"},
            (SELECT COALESCE(MAX(position), 0) + 1 FROM stages))
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
