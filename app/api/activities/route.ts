import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = db();
  const rows = await sql`SELECT * FROM activities ORDER BY created_at DESC LIMIT 12`;
  return NextResponse.json(rows);
}
