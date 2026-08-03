"use client";

// 한눈에 👀 — 모든 프로젝트·할 일 + 긴급×중요 매트릭스 (큰 화면 최적화)

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useSWRConfig } from "swr";
import { useProjects, useTasks, api, refresh, ddayLabel, daysUntil } from "@/lib/hooks";
import { STATUS_META, type Project, type Task } from "@/lib/types";
import { Spinner, EmptyState } from "@/components/ui";
import { useToast } from "@/components/Toast";

const INBOX_COLOR = "#a78bfa";

type Pos = { u: number; i: number };

function score(u: number, i: number) {
  return Math.round((u + i) / 2);
}

function quadrant(u: number, i: number) {
  if (u >= 50 && i >= 50)
    return { label: "지금 당장", emoji: "🔥", varName: "--st-critical" };
  if (i >= 50)
    return { label: "계획하기", emoji: "🌱", varName: "--st-good" };
  if (u >= 50)
    return { label: "빨리 쳐내기", emoji: "⚡", varName: "--st-serious" };
  return { label: "나중에", emoji: "🐢", varName: "--muted" };
}

/* ---------------- matrix chart ---------------- */

function Matrix({
  tasks,
  projectOf,
  posOverride,
  hovered,
  setHovered,
  onDragMove,
  onDragEnd,
}: {
  tasks: Task[];
  projectOf: (id: number | null) => Project | undefined;
  posOverride: Record<number, Pos>;
  hovered: number | null;
  setHovered: (id: number | null) => void;
  onDragMove: (id: number, pos: Pos) => void;
  onDragEnd: (id: number, pos: Pos) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; last: Pos } | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const posOf = (t: Task): Pos =>
    posOverride[t.id] ?? { u: t.urgency, i: t.importance };

  const toPos = useCallback((e: { clientX: number; clientY: number }): Pos => {
    const rect = boxRef.current!.getBoundingClientRect();
    const u = ((e.clientX - rect.left) / rect.width) * 100;
    const i = (1 - (e.clientY - rect.top) / rect.height) * 100;
    const clamp = (n: number) => Math.max(2, Math.min(98, Math.round(n)));
    return { u: clamp(u), i: clamp(i) };
  }, []);

  const startDrag = (e: ReactPointerEvent, id: number) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const pos = toPos(e);
    dragRef.current = { id, last: pos };
    setDraggingId(id);
  };

  const moveDrag = (e: ReactPointerEvent) => {
    if (!dragRef.current) return;
    const pos = toPos(e);
    dragRef.current.last = pos;
    onDragMove(dragRef.current.id, pos);
  };

  const endDrag = () => {
    if (!dragRef.current) return;
    const { id, last } = dragRef.current;
    dragRef.current = null;
    setDraggingId(null);
    onDragEnd(id, last);
  };

  const active = hovered ?? draggingId;
  const activeTask = tasks.find((t) => t.id === active);

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-lg">긴급 × 중요 매트릭스 🎯</h2>
        <span className="text-xs text-muted">네모를 끌어서 우선순위를 정해요</span>
      </div>

      <div className="flex gap-2">
        {/* y-axis label */}
        <div className="flex select-none items-center">
          <span
            className="text-[11px] font-bold tracking-widest text-muted"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            중요함 →
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div
            ref={boxRef}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="relative aspect-square w-full touch-none select-none overflow-hidden rounded-2xl border border-line"
            style={{ background: "var(--card)" }}
          >
            {/* quadrant tints */}
            <div
              className="absolute left-1/2 top-0 h-1/2 w-1/2"
              style={{ background: "color-mix(in oklab, var(--st-critical) 7%, transparent)" }}
            />
            <div
              className="absolute left-0 top-0 h-1/2 w-1/2"
              style={{ background: "color-mix(in oklab, var(--st-good) 6%, transparent)" }}
            />
            <div
              className="absolute left-1/2 top-1/2 h-1/2 w-1/2"
              style={{ background: "color-mix(in oklab, var(--st-serious) 7%, transparent)" }}
            />
            {/* center gridlines */}
            <div className="absolute left-1/2 top-0 h-full w-px" style={{ background: "var(--grid)" }} />
            <div className="absolute left-0 top-1/2 h-px w-full" style={{ background: "var(--grid)" }} />

            {/* quadrant labels */}
            <span className="font-display pointer-events-none absolute right-3 top-2.5 text-sm text-ink-2">
              지금 당장! 🔥
            </span>
            <span className="font-display pointer-events-none absolute left-3 top-2.5 text-sm text-ink-2">
              계획해서 차근차근 🌱
            </span>
            <span className="font-display pointer-events-none absolute bottom-2.5 right-3 text-sm text-ink-2">
              빨리 쳐내기 ⚡
            </span>
            <span className="font-display pointer-events-none absolute bottom-2.5 left-3 text-sm text-ink-2">
              나중에 해도 OK 🐢
            </span>

            {/* dots */}
            {tasks.map((t) => {
              const { u, i } = posOf(t);
              const proj = projectOf(t.project_id);
              const color = proj?.color ?? INBOX_COLOR;
              const isActive = active === t.id;
              return (
                <button
                  key={t.id}
                  onPointerDown={(e) => startDrag(e, t.id)}
                  onMouseEnter={() => setHovered(t.id)}
                  onMouseLeave={() => setHovered(null)}
                  aria-label={`${t.title} — 긴급 ${u}, 중요 ${i}`}
                  className="absolute grid cursor-grab place-items-center rounded-lg text-sm shadow-md active:cursor-grabbing"
                  style={{
                    left: `${u}%`,
                    top: `${100 - i}%`,
                    width: isActive ? 38 : 30,
                    height: isActive ? 38 : 30,
                    transform: "translate(-50%, -50%)",
                    background: color,
                    border: "2px solid var(--card)",
                    zIndex: isActive ? 30 : 10,
                    transition:
                      draggingId === t.id
                        ? "width .12s, height .12s"
                        : "width .12s, height .12s, left .15s ease, top .15s ease",
                  }}
                >
                  {proj?.emoji ?? "📥"}
                </button>
              );
            })}

            {/* tooltip for active dot */}
            {activeTask &&
              (() => {
                const { u, i } = posOf(activeTask);
                const q = quadrant(u, i);
                return (
                  <div
                    className="card pointer-events-none absolute z-40 px-3 py-2 text-xs shadow-lg"
                    style={{
                      left: `${Math.min(Math.max(u, 18), 82)}%`,
                      top: `${100 - i}%`,
                      transform: `translate(-50%, ${i > 80 ? "28px" : "calc(-100% - 28px)"})`,
                      maxWidth: "70%",
                    }}
                  >
                    <p className="truncate font-bold">{activeTask.title}</p>
                    <p className="mt-0.5 text-muted">
                      {q.emoji} {q.label} · 긴급 {u} · 중요 {i} ·{" "}
                      <b style={{ color: `var(${q.varName})` }}>
                        {score(u, i)}점
                      </b>
                    </p>
                  </div>
                );
              })()}

            {tasks.length === 0 && (
              <div className="absolute inset-0 grid place-items-center">
                <p className="text-sm text-muted">
                  할 일을 추가하면 여기에 네모가 생겨요 ✨
                </p>
              </div>
            )}
          </div>

          {/* x-axis label */}
          <p className="mt-1.5 select-none text-right text-[11px] font-bold tracking-widest text-muted">
            긴급함 →
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- project card with task list ---------------- */

function ProjectTaskCard({
  project,
  tasks,
  posOverride,
  hovered,
  setHovered,
  onQuickAdd,
  onToggleDone,
}: {
  project: Project | null; // null = inbox
  tasks: Task[];
  posOverride: Record<number, Pos>;
  hovered: number | null;
  setHovered: (id: number | null) => void;
  onQuickAdd: (projectId: number | null, title: string) => Promise<void>;
  onToggleDone: (t: Task) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const open = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      const pa = posOverride[a.id] ?? { u: a.urgency, i: a.importance };
      const pb = posOverride[b.id] ?? { u: b.urgency, i: b.importance };
      return score(pb.u, pb.i) - score(pa.u, pa.i);
    });
  const doneCount = tasks.length - open.length;
  const color = project?.color ?? INBOX_COLOR;

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await onQuickAdd(project?.id ?? null, text.trim());
      setText("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card flex flex-col p-4">
      <header className="mb-2.5 flex items-center gap-2.5">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg"
          style={{ background: `color-mix(in oklab, ${color} 22%, transparent)` }}
        >
          {project?.emoji ?? "📥"}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold">
            {project?.name ?? "인박스"}
          </h3>
          <p className="text-[11px] text-muted">
            {project
              ? `${STATUS_META[project.status].emoji} ${STATUS_META[project.status].label} · `
              : ""}
            남은 할 일 {open.length}개
            {doneCount > 0 && ` · 완료 ${doneCount}`}
          </p>
        </div>
        {project?.deadline && (
          <span
            className={`shrink-0 rounded-full bg-card-2 px-2 py-0.5 text-[11px] font-bold ${
              (daysUntil(project.deadline) ?? 99) <= 7
                ? "text-[var(--st-serious)]"
                : "text-ink-2"
            }`}
          >
            🚩 {ddayLabel(project.deadline)}
          </span>
        )}
      </header>

      <ul className="flex flex-col gap-1">
        {open.map((t) => {
          const p = posOverride[t.id] ?? { u: t.urgency, i: t.importance };
          const q = quadrant(p.u, p.i);
          const d = daysUntil(t.due_date);
          return (
            <li
              key={t.id}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors ${
                hovered === t.id ? "bg-accent-soft" : "hover:bg-card-2"
              }`}
            >
              <button
                onClick={() => onToggleDone(t)}
                aria-label="완료로 표시"
                className="pressable grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 border-line text-[9px] text-transparent transition-colors hover:border-accent hover:text-accent"
              >
                ✓
              </button>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                {t.title}
              </span>
              {t.due_date && (
                <span
                  className={`shrink-0 text-[11px] font-bold ${
                    d !== null && d <= 3 ? "text-[var(--st-serious)]" : "text-muted"
                  }`}
                >
                  {ddayLabel(t.due_date)}
                </span>
              )}
              <span
                className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
                style={{
                  color: `var(${q.varName})`,
                  background: `color-mix(in oklab, var(${q.varName}) 12%, transparent)`,
                }}
                title={`${q.emoji} ${q.label}`}
              >
                {score(p.u, p.i)}
              </span>
            </li>
          );
        })}
        {open.length === 0 && (
          <li className="px-2 py-2 text-center text-xs text-muted">
            할 일을 모두 끝냈어요! 🎉
          </li>
        )}
      </ul>

      <div className="mt-2 flex items-center gap-1.5">
        <input
          className="input py-2 text-[13px]"
          placeholder="＋ 할 일 추가하고 Enter"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {text.trim() && (
          <button className="btn btn-primary px-3.5 py-2 text-xs" onClick={submit}>
            추가
          </button>
        )}
      </div>
    </section>
  );
}

/* ---------------- page ---------------- */

export default function OverviewPage() {
  const { data: projects, isLoading: pl } = useProjects();
  const { data: tasks, isLoading: tl } = useTasks();
  const { mutate } = useSWRConfig();
  const toast = useToast();

  const [hovered, setHovered] = useState<number | null>(null);
  const [posOverride, setPosOverride] = useState<Record<number, Pos>>({});
  const [hideDoneProjects, setHideDoneProjects] = useState(true);

  const projectOf = useCallback(
    (id: number | null) => (projects ?? []).find((p) => p.id === id),
    [projects],
  );

  const openTasks = useMemo(
    () => (tasks ?? []).filter((t) => t.status !== "done"),
    [tasks],
  );

  const visibleProjects = useMemo(() => {
    let l = projects ?? [];
    if (hideDoneProjects) l = l.filter((p) => p.status !== "done");
    return l;
  }, [projects, hideDoneProjects]);

  const inboxTasks = (tasks ?? []).filter((t) => !t.project_id);

  const quickAdd = async (projectId: number | null, title: string) => {
    await api("POST", "/api/tasks", {
      title,
      project_id: projectId,
      urgency: 50,
      importance: 50,
    });
    refresh("/api/tasks", "/api/projects", "/api/activities");
    toast("할 일 추가! 차트 가운데 네모를 끌어 보세요", "🎯");
  };

  const toggleDone = async (t: Task) => {
    mutate(
      "/api/tasks",
      (curr: Task[] | undefined) =>
        (curr ?? []).map((x) =>
          x.id === t.id
            ? { ...x, status: "done" as const, done_at: new Date().toISOString() }
            : x,
        ),
      { revalidate: false },
    );
    await api("PATCH", `/api/tasks/${t.id}`, { status: "done" });
    refresh("/api/tasks", "/api/projects", "/api/activities");
    toast(`「${t.title}」 완료!`, "🎉");
  };

  const onDragMove = useCallback((id: number, pos: Pos) => {
    setPosOverride((m) => ({ ...m, [id]: pos }));
  }, []);

  const onDragEnd = useCallback(
    async (id: number, pos: Pos) => {
      await api("PATCH", `/api/tasks/${id}`, {
        urgency: pos.u,
        importance: pos.i,
      });
      mutate(
        "/api/tasks",
        (curr: Task[] | undefined) =>
          (curr ?? []).map((x) =>
            x.id === id ? { ...x, urgency: pos.u, importance: pos.i } : x,
          ),
        { revalidate: false },
      );
      setPosOverride((m) => {
        const { [id]: _drop, ...rest } = m;
        return rest;
      });
    },
    [mutate],
  );

  if (pl || tl) return <Spinner />;

  return (
    <div className="rise flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">한눈에 👀</h1>
          <p className="mt-1 text-sm text-muted">
            모든 프로젝트와 할 일, 그리고 우선순위까지 한 화면에서
          </p>
        </div>
        <label className="chip" data-on={hideDoneProjects}>
          <input
            type="checkbox"
            className="hidden"
            checked={hideDoneProjects}
            onChange={(e) => setHideDoneProjects(e.target.checked)}
          />
          🎉 완료된 프로젝트 숨기기
        </label>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_minmax(440px,44%)]">
        {/* left: all projects + tasks */}
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visibleProjects.map((p) => (
            <ProjectTaskCard
              key={p.id}
              project={p}
              tasks={(tasks ?? []).filter((t) => t.project_id === p.id)}
              posOverride={posOverride}
              hovered={hovered}
              setHovered={setHovered}
              onQuickAdd={quickAdd}
              onToggleDone={toggleDone}
            />
          ))}
          <ProjectTaskCard
            project={null}
            tasks={inboxTasks}
            posOverride={posOverride}
            hovered={hovered}
            setHovered={setHovered}
            onQuickAdd={quickAdd}
            onToggleDone={toggleDone}
          />
          {visibleProjects.length === 0 && inboxTasks.length === 0 && (
            <div className="md:col-span-2 2xl:col-span-3">
              <EmptyState
                emoji="🌱"
                title="프로젝트가 없어요"
                subtitle="프로젝트 탭에서 먼저 하나 만들어 보세요!"
              />
            </div>
          )}
        </div>

        {/* right: sticky matrix */}
        <div className="xl:sticky xl:top-6">
          <Matrix
            tasks={openTasks}
            projectOf={projectOf}
            posOverride={posOverride}
            hovered={hovered}
            setHovered={setHovered}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
          />
          {/* legend: project colors */}
          <div className="card mt-4 flex flex-wrap gap-x-4 gap-y-1.5 p-4">
            {visibleProjects.map((p) => (
              <span key={p.id} className="flex items-center gap-1.5 text-xs text-ink-2">
                <span
                  className="h-3 w-3 rounded-[4px]"
                  style={{ background: p.color }}
                />
                {p.emoji} {p.name}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-xs text-ink-2">
              <span
                className="h-3 w-3 rounded-[4px]"
                style={{ background: INBOX_COLOR }}
              />
              📥 인박스
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
