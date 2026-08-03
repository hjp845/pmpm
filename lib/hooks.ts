"use client";

import useSWR, { mutate as globalMutate } from "swr";
import type { Project, Task, Note, Activity } from "./types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useProjects() {
  return useSWR<Project[]>("/api/projects", fetcher);
}
export function useTasks() {
  return useSWR<Task[]>("/api/tasks", fetcher);
}
export function useNotes() {
  return useSWR<Note[]>("/api/notes", fetcher);
}
export function useActivities() {
  return useSWR<Activity[]>("/api/activities", fetcher);
}

export async function api(
  method: "POST" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${url} failed (${res.status})`);
  return res.status === 204 ? null : res.json();
}

export function refresh(...keys: string[]) {
  const all = keys.length
    ? keys
    : ["/api/projects", "/api/tasks", "/api/notes", "/api/activities"];
  all.forEach((k) => globalMutate(k));
}

export const todayStr = () => new Date().toISOString().slice(0, 10);

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function ddayLabel(dateStr: string | null): string {
  const n = daysUntil(dateStr);
  if (n === null) return "";
  if (n === 0) return "D-Day";
  return n > 0 ? `D-${n}` : `D+${-n}`;
}

export function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return fmtDate(dateStr);
}
