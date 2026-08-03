"use client";

import { useMemo, useState } from "react";
import { useProjects, useTasks, todayStr } from "@/lib/hooks";
import { PRIORITY_META } from "@/lib/types";
import { Spinner } from "@/components/ui";

const DAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const { data: tasks, isLoading: tl } = useTasks();
  const { data: projects, isLoading: pl } = useProjects();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [selected, setSelected] = useState<string>(todayStr());

  const move = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    const out: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(d);
    }
    return out;
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<
      string,
      { kind: "task" | "project"; label: string; emoji: string; color: string; done?: boolean; priority?: string }[]
    >();
    for (const t of tasks ?? []) {
      if (!t.due_date) continue;
      const key = t.due_date.slice(0, 10);
      const proj = (projects ?? []).find((p) => p.id === t.project_id);
      const arr = map.get(key) ?? [];
      arr.push({
        kind: "task",
        label: t.title,
        emoji: proj?.emoji ?? "📥",
        color: proj?.color ?? "#a78bfa",
        done: t.status === "done",
        priority: t.priority,
      });
      map.set(key, arr);
    }
    for (const p of projects ?? []) {
      if (!p.deadline) continue;
      const key = p.deadline.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push({
        kind: "project",
        label: `${p.name} 마감`,
        emoji: p.emoji,
        color: p.color,
      });
      map.set(key, arr);
    }
    return map;
  }, [tasks, projects]);

  const today = todayStr();
  const selectedEvents = eventsByDate.get(selected) ?? [];

  if (tl || pl) return <Spinner />;

  return (
    <div className="rise flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">캘린더 🗓️</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => move(-1)} className="btn btn-ghost px-3" aria-label="이전 달">
            ←
          </button>
          <span className="font-display min-w-32 text-center text-xl">
            {year}년 {month + 1}월
          </span>
          <button onClick={() => move(1)} className="btn btn-ghost px-3" aria-label="다음 달">
            →
          </button>
          <button
            onClick={() => {
              setYear(now.getFullYear());
              setMonth(now.getMonth());
              setSelected(today);
            }}
            className="btn btn-ghost"
          >
            오늘
          </button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_290px]">
        <div className="card p-4">
          <div className="mb-2 grid grid-cols-7 text-center text-xs font-bold text-muted">
            {DAY_HEADERS.map((d, i) => (
              <span key={d} className={i === 0 ? "text-[var(--st-critical)]" : i === 6 ? "text-[var(--series-1)]" : ""}>
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d) => {
              const key = ymd(d);
              const inMonth = d.getMonth() === month;
              const isToday = key === today;
              const isSelected = key === selected;
              const events = eventsByDate.get(key) ?? [];
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`pressable flex min-h-[68px] flex-col items-stretch gap-1 rounded-xl border p-1.5 text-left transition-colors ${
                    isSelected
                      ? "border-[var(--accent)] bg-accent-soft"
                      : "border-transparent hover:bg-card-2"
                  } ${inMonth ? "" : "opacity-35"}`}
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                      isToday
                        ? "bg-gradient-to-br from-accent to-accent-2 text-white"
                        : d.getDay() === 0
                          ? "text-[var(--st-critical)]"
                          : "text-ink-2"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    {events.slice(0, 2).map((e, i) => (
                      <span
                        key={i}
                        className={`truncate rounded-md px-1 py-px text-[10px] font-semibold leading-tight ${e.done ? "line-through opacity-50" : ""}`}
                        style={{
                          background: `color-mix(in oklab, ${e.color} 22%, transparent)`,
                        }}
                      >
                        {e.emoji} {e.label}
                      </span>
                    ))}
                    {events.length > 2 && (
                      <span className="px-1 text-[10px] font-bold text-muted">
                        +{events.length - 2}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* day detail */}
        <aside className="card h-fit p-5">
          <h2 className="font-display mb-3 text-lg">
            {new Date(selected + "T00:00:00").toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
              weekday: "short",
            })}{" "}
            {selected === today && "· 오늘 💜"}
          </h2>
          {selectedEvents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              이 날은 일정이 없어요 🍃
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedEvents.map((e, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2.5 rounded-2xl border border-line px-3 py-2.5"
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-base"
                    style={{
                      background: `color-mix(in oklab, ${e.color} 22%, transparent)`,
                    }}
                  >
                    {e.emoji}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm font-semibold ${e.done ? "text-muted line-through" : ""}`}
                    >
                      {e.label}
                    </p>
                    <p className="text-[11px] text-muted">
                      {e.kind === "project"
                        ? "🚩 프로젝트 마감"
                        : e.done
                          ? "✅ 완료됨"
                          : `${PRIORITY_META[(e.priority ?? "mid") as keyof typeof PRIORITY_META].emoji} 우선순위 ${PRIORITY_META[(e.priority ?? "mid") as keyof typeof PRIORITY_META].label}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
