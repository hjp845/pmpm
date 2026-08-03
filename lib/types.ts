export type ProjectStatus = "planning" | "active" | "paused" | "done";
export type TaskStatus = "todo" | "doing" | "done";
export type Priority = "low" | "mid" | "high";

export interface Project {
  id: number;
  name: string;
  emoji: string;
  color: string;
  status: ProjectStatus;
  description: string;
  deadline: string | null;
  pinned: boolean;
  tags: string[];
  icon: string | null;
  position: number;
  created_at: string;
  task_total: number;
  task_done: number;
}

export interface Task {
  id: number;
  project_id: number | null;
  title: string;
  status: TaskStatus;
  priority: Priority;
  urgency: number;
  importance: number;
  sort_order: number;
  due_date: string | null;
  created_at: string;
  done_at: string | null;
}

export interface Note {
  id: number;
  project_id: number | null;
  content: string;
  color: string;
  created_at: string;
}

export interface Activity {
  id: number;
  type: string;
  message: string;
  created_at: string;
}

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; emoji: string; className: string }
> = {
  planning: { label: "계획중", emoji: "🌱", className: "st-planning" },
  active: { label: "진행중", emoji: "🔥", className: "st-active" },
  paused: { label: "보류", emoji: "💤", className: "st-paused" },
  done: { label: "완료", emoji: "🎉", className: "st-done" },
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; emoji: string }
> = {
  high: { label: "높음", emoji: "🚨" },
  mid: { label: "보통", emoji: "⚡" },
  low: { label: "낮음", emoji: "🍃" },
};

export const PROJECT_COLORS = [
  "#f472b6",
  "#fb7185",
  "#fb923c",
  "#facc15",
  "#4ade80",
  "#2dd4bf",
  "#38bdf8",
  "#818cf8",
  "#a78bfa",
  "#e879f9",
];

export const PROJECT_EMOJIS = [
  "🦄", "🐙", "🦕", "🐢", "🐳", "🦩", "🍄", "🌵", "🪴", "🌻",
  "🍕", "🥐", "🍙", "🧋", "🍯", "🥝", "🍒", "🫐", "🍦", "🧃",
  "🎪", "🛼", "🧶", "🪩", "🎹", "📻", "🛵", "⛺", "🪁", "🫧",
];

// 가장 적게 쓰인 이모지·색을 골라 랜덤 배정 (겹침 최소화)
export function pickProjectLook(
  existing: { emoji: string; color: string }[],
): { emoji: string; color: string } {
  const leastUsed = (options: string[], used: string[]) => {
    const count = new Map(options.map((o) => [o, 0]));
    for (const u of used) if (count.has(u)) count.set(u, count.get(u)! + 1);
    const min = Math.min(...count.values());
    return options.filter((o) => count.get(o) === min);
  };
  const emojiPool = leastUsed(PROJECT_EMOJIS, existing.map((p) => p.emoji));
  const colorPool = leastUsed(PROJECT_COLORS, existing.map((p) => p.color));
  const emoji = emojiPool[Math.floor(Math.random() * emojiPool.length)];
  // 같은 (이모지, 색) 조합이 이미 있으면 풀 안에서 다른 색을 시도
  const taken = new Set(existing.map((p) => `${p.emoji}|${p.color}`));
  const shuffled = [...colorPool].sort(() => Math.random() - 0.5);
  const color =
    shuffled.find((c) => !taken.has(`${emoji}|${c}`)) ?? shuffled[0];
  return { emoji, color };
}

export const NOTE_COLORS = [
  "#fef3c7",
  "#fce7f3",
  "#dbeafe",
  "#dcfce7",
  "#f3e8ff",
  "#ffedd5",
];
