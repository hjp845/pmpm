import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = db();
  const rows = await sql`SELECT key, value FROM settings`;
  return NextResponse.json(
    Object.fromEntries(rows.map((r) => [r.key, r.value])),
  );
}

// body: { key, value } — value가 null이면 삭제
export async function PATCH(req: Request) {
  const sql = db();
  const b = await req.json();
  if (b.value === null || b.value === undefined) {
    await sql`DELETE FROM settings WHERE key = ${b.key}`;
  } else {
    await sql`
      INSERT INTO settings (key, value) VALUES (${b.key}, ${b.value})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  }
  return NextResponse.json({ ok: true });
}
