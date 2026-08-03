"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  useProjects,
  useTasks,
  useActivities,
  daysUntil,
  ddayLabel,
  api,
  refresh,
} from "@/lib/hooks";
import { STATUS_META, type Task } from "@/lib/types";
import { DonutChart, WeekBars } from "@/components/charts";
import { Spinner, EmptyState } from "@/components/ui";
import { useToast } from "@/components/Toast";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return { text: "고요한 새벽이에요", emoji: "🌙" };
  if (h < 12) return { text: "좋은 아침이에요", emoji: "☀️" };
  if (h < 18) return { text: "활기찬 오후예요", emoji: "🌤️" };
  return { text: "포근한 저녁이에요", emoji: "🌆" };
}

export default function DashboardPage() {
  const { data: projects, isLoading: pl } = useProjects();
  const { data: tasks, isLoading: tl } = useTasks();
  const { data: activities } = useActivities();
  const toast = useToast();

  const stats = useMemo(() => {
    const p = projects ?? [];
    const t = tasks ?? [];
    const doneTasks = t.filter((x) => x.status === "done").length;
    const urgent = t.filter((x) => {
      if (x.status === "done") return false;
      const d = daysUntil(x.due_date);
      return d !== null && d <= 3;
    }).length;
    return {
      total: p.length,
      active: p.filter((x) => x.status === "active").length,
      doneRate: t.length ? Math.round((doneTasks / t.length) * 100) : 0,
      urgent,
    };
  }, [projects, tasks]);

  const donut = useMemo(() => {
    const p = projects ?? [];
    const count = (s: string) => p.filter((x) => x.status === s).length;
    return [
      { label: "진행중", value: count("active"), colorVar: "--series-1" },
      { label: "계획중", value: count("planning"), colorVar: "--series-2" },
      { label: "완료", value: count("done"), colorVar: "--series-3" },
      { label: "보류", value: count("paused"), colorVar: "--series-4" },
    ];
  }, [projects]);

  const week = useMemo(() => {
    const t = tasks ?? [];
    const days: { day: string; value: number; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const value = t.filter((x) => {
        if (!x.done_at) return false;
        const dt = new Date(x.done_at);
        return dt >= d && dt < next;
      }).length;
      days.push({ day: DAY_NAMES[d.getDay()], value, isToday: i === 0 });
    }
    return days;
  }, [tasks]);

  const upcoming = useMemo(() => {
    return (tasks ?? [])
      .filter((t) => t.status !== "done" && t.due_date)
      .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))
      .slice(0, 6);
  }, [tasks]);

  const pinned = (projects ?? []).filter((p) => p.pinned).slice(0, 4);
  const g = greeting();

  const completeTask = async (t: Task) => {
    await api("PATCH", `/api/tasks/${t.id}`, { status: "done" });
    refresh();
    toast(`「${t.title}」 완료! 수고했어요`, "🎉");
  };

  if (pl || tl) return <Spinner />;

  return (
    <div className="rise flex flex-col gap-6">
      {/* greeting */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">
            {new Date().toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </p>
          <h1 className="font-display mt-1 text-3xl">
            {g.text} {g.emoji}
          </h1>
        </div>
        <Link href="/projects?new=1" className="btn btn-primary">
          ＋ 새 프로젝트
        </Link>
      </header>

      {/* KPI tiles */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "전체 프로젝트", value: stats.total, emoji: "📦", suffix: "개" },
          { label: "진행중", value: stats.active, emoji: "🔥", suffix: "개" },
          { label: "할 일 완료율", value: stats.doneRate, emoji: "✅", suffix: "%" },
          { label: "마감 임박 (3일)", value: stats.urgent, emoji: "⏰", suffix: "건" },
        ].map((s) => (
          <div key={s.label} className="card card-hover p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink-2">{s.label}</span>
              <span className="text-xl">{s.emoji}</span>
            </div>
            <p className="mt-2 text-3xl font-bold">
              {s.value}
              <span className="ml-0.5 text-base font-semibold text-muted">
                {s.suffix}
              </span>
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* status donut */}
        <section className="card p-6">
          <h2 className="font-display mb-4 text-lg">프로젝트 상태 분포 🎨</h2>
          {stats.total === 0 ? (
            <EmptyState
              emoji="🌱"
              title="아직 프로젝트가 없어요"
              subtitle="첫 프로젝트를 심어볼까요?"
            />
          ) : (
            <DonutChart slices={donut} centerLabel="전체" />
          )}
        </section>

        {/* weekly bars */}
        <section className="card p-6">
          <h2 className="font-display mb-4 text-lg">최근 7일 완료한 할 일 💪</h2>
          <WeekBars data={week} />
        </section>
      </div>

      {/* pinned projects */}
      {pinned.length > 0 && (
        <section>
          <h2 className="font-display mb-3 text-lg">📌 고정한 프로젝트</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {pinned.map((p) => {
              const pct = p.task_total
                ? Math.round((p.task_done / p.task_total) * 100)
                : 0;
              return (
                <Link
                  key={p.id}
                  href={`/projects?q=${encodeURIComponent(p.name)}`}
                  className="card card-hover pressable p-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-xl"
                      style={{
                        background: `color-mix(in oklab, ${p.color} 22%, transparent)`,
                      }}
                    >
                      {p.emoji}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{p.name}</p>
                      <p className="text-xs text-muted">
                        {STATUS_META[p.status].emoji}{" "}
                        {STATUS_META[p.status].label}
                      </p>
                    </div>
                  </div>
                  <div className="progress-track mt-3">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* upcoming deadlines */}
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg">다가오는 마감 ⏳</h2>
            <Link href="/board" className="text-xs font-bold text-accent">
              칸반보드 →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState emoji="🏖️" title="마감이 없어요, 여유~" />
          ) : (
            <ul className="flex flex-col gap-2">
              {upcoming.map((t) => {
                const d = daysUntil(t.due_date)!;
                const proj = (projects ?? []).find((p) => p.id === t.project_id);
                return (
                  <li
                    key={t.id}
                    className="group flex items-center gap-3 rounded-2xl border border-line px-4 py-2.5"
                  >
                    <button
                      onClick={() => completeTask(t)}
                      aria-label="완료로 표시"
                      className="pressable grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-line text-[10px] text-transparent transition-colors hover:border-accent hover:text-accent"
                    >
                      ✓
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.title}</p>
                      {proj && (
                        <p className="text-xs text-muted">
                          {proj.emoji} {proj.name}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        d < 0
                          ? "bg-[color-mix(in_oklab,var(--st-critical)_14%,transparent)] text-[var(--st-critical)]"
                          : d <= 3
                            ? "bg-[color-mix(in_oklab,var(--st-serious)_16%,transparent)] text-[var(--st-serious)]"
                            : "bg-card-2 text-ink-2"
                      }`}
                    >
                      {d < 0 ? "⚠️ " : d <= 3 ? "🔥 " : "📅 "}
                      {ddayLabel(t.due_date)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* activity feed */}
        <section className="card p-6">
          <h2 className="font-display mb-4 text-lg">최근 활동 🐾</h2>
          {(activities ?? []).length === 0 ? (
            <EmptyState emoji="🍃" title="아직 활동이 없어요" />
          ) : (
            <ul className="flex flex-col gap-3">
              {(activities ?? []).map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-sm">
                    {a.type === "project" ? "📁" : a.type === "task" ? "✅" : "📝"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-ink">{a.message}</p>
                    <p className="text-xs text-muted">
                      {new Date(a.created_at).toLocaleString("ko-KR", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
