"use client";

import useSWR, { mutate as globalMutate } from "swr";
import type { Project, Task, Note, Activity, Stage, StageCheck } from "./types";

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
export function useStages() {
  return useSWR<Stage[]>("/api/stages", fetcher);
}
export function useStageChecks() {
  return useSWR<StageCheck[]>("/api/stage-checks", fetcher);
}
export function useSettings() {
  return useSWR<Record<string, string>>("/api/settings", fetcher);
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
    : [
        "/api/projects",
        "/api/tasks",
        "/api/notes",
        "/api/activities",
        "/api/stages",
        "/api/stage-checks",
      ];
  all.forEach((k) => globalMutate(k));
}

// 업로드 이미지를 정사각형 데이터 URL로 리사이즈 (아이콘용)
export async function fileToIconDataUrl(file: File, size = 128): Promise<string> {
  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const s = Math.min(img.width, img.height);
  ctx.drawImage(
    img,
    (img.width - s) / 2,
    (img.height - s) / 2,
    s,
    s,
    0,
    0,
    size,
    size,
  );
  img.close();
  return canvas.toDataURL("image/webp", 0.85);
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
