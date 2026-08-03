import { neon } from "@neondatabase/serverless";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SqlTag = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Record<string, any>[]>;

let _sql: SqlTag | null = null;

export function db(): SqlTag {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url) as unknown as SqlTag;
  }
  return _sql;
}

export async function logActivity(type: string, message: string) {
  const sql = db();
  await sql`INSERT INTO activities (type, message) VALUES (${type}, ${message})`;
}
