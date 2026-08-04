"use client";

// 한눈에 👀 — 메인 허브: 프로젝트 CRUD + 할 일 추가·순서변경·이동·삭제·완료
// + 드래그형 긴급×중요 매트릭스 (큰 화면 최적화)

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useSWRConfig } from "swr";
import { useProjects, useTasks, api, refresh, ddayLabel, daysUntil } from "@/lib/hooks";
import { STATUS_META, pickProjectLook, type Project, type Task } from "@/lib/types";
import { Spinner, ConfirmDialog, Icon, firstLetter } from "@/components/ui";
import { ProjectModal } from "@/components/ProjectModal";
import { FlowBoard } from "@/components/FlowBoard";
import { useToast } from "@/components/Toast";

const INBOX_COLOR = "#a78bfa";

type Pos = { u: number; i: number };

function score(u: number, i: number) {
  return Math.round((u + i) / 2);
}

function quadrant(u: number, i: number) {
  if (u >= 50 && i >= 50)
    return { label: "지금 당장", emoji: "🔥", varName: "--st-critical" };
  if (i >= 50) return { label: "계획하기", emoji: "🌱", varName: "--st-good" };
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
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    setShowLabels(localStorage.getItem("moamoa-matrix-labels") !== "off");
  }, []);

  const toggleLabels = () => {
    setShowLabels((v) => {
      localStorage.setItem("moamoa-matrix-labels", v ? "off" : "on");
      return !v;
    });
  };

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
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg">긴급 × 중요 매트릭스 🎯</h2>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted sm:inline">
            네모를 끌어서 우선순위를 정해요
          </span>
          <button
            className="chip"
            data-on={showLabels}
            onClick={toggleLabels}
            title="할 일 이름 라벨 표시/숨김"
          >
            🏷️ 라벨 {showLabels ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <p className="mb-1 select-none text-[11px] font-bold tracking-widest text-muted">
        ↑ 중요함
      </p>

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

        {/* dots + small title labels */}
        {tasks.map((t) => {
          const { u, i } = posOf(t);
          const proj = projectOf(t.project_id);
          const color = proj?.color ?? INBOX_COLOR;
          const isActive = active === t.id;
          const moveTransition =
            draggingId === t.id
              ? "none"
              : "left .15s ease, top .15s ease";
          return (
            <div key={t.id}>
              <button
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
                  transition: `width .12s, height .12s, ${moveTransition}`,
                }}
              >
                {proj?.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={proj.icon}
                    alt=""
                    draggable={false}
                    className="pointer-events-none h-full w-full rounded-md object-cover"
                  />
                ) : (
                  <Icon emoji={proj?.emoji ?? "📥"} />
                )}
              </button>
              {showLabels && (
                <span
                  className="pointer-events-none absolute block w-max max-w-36 whitespace-normal break-words rounded-md px-1 py-px text-center text-[10px] font-semibold leading-tight text-ink-2"
                  style={{
                    left: `${u}%`,
                    top: `calc(${100 - i}% + ${isActive ? 21 : 17}px)`,
                    transform: "translateX(-50%)",
                    background:
                      "color-mix(in oklab, var(--card) 78%, transparent)",
                    zIndex: isActive ? 29 : 9,
                    transition: moveTransition,
                  }}
                >
                  {t.title}
                </span>
              )}
            </div>
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
                  <b style={{ color: `var(${q.varName})` }}>{score(u, i)}점</b>
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

      <p className="mt-1.5 select-none text-right text-[11px] font-bold tracking-widest text-muted">
        긴급함 →
      </p>
    </div>
  );
}

/* ---------------- project card with task list ---------------- */

interface CardProps {
  project: Project | null; // null = inbox
  tasks: Task[];
  posOverride: Record<number, Pos>;
  hovered: number | null;
  setHovered: (id: number | null) => void;
  dragTask: number | null;
  setDragTask: (id: number | null) => void;
  onDropTask: (projectId: number | null, orderedIds: number[]) => void;
  onQuickAdd: (projectId: number | null, title: string) => Promise<void>;
  onToggleDone: (t: Task) => void;
  onDeleteTask: (t: Task) => void;
  onRestoreTask: (t: Task) => void;
  onEditProject?: () => void;
  onDeleteProject?: () => void;
  onTogglePin?: () => void;
  headerDrag?: { onDragStart: () => void; onDragEnd: () => void };
}

function ProjectTaskCard({
  project,
  tasks,
  posOverride,
  hovered,
  setHovered,
  dragTask,
  setDragTask,
  onDropTask,
  onQuickAdd,
  onToggleDone,
  onDeleteTask,
  onRestoreTask,
  onEditProject,
  onDeleteProject,
  onTogglePin,
  headerDrag,
}: CardProps) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    if (dragTask === null) setOverIdx(null);
  }, [dragTask]);

  const open = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  const doneTasks = tasks
    .filter((t) => t.status === "done")
    .sort((a, b) => ((a.done_at ?? "") < (b.done_at ?? "") ? 1 : -1));
  const doneCount = doneTasks.length;
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

  const rowDragOver = (e: ReactDragEvent, idx: number) => {
    if (dragTask === null) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    setOverIdx(before ? idx : idx + 1);
  };

  const drop = (e: ReactDragEvent) => {
    e.preventDefault();
    if (dragTask === null) return;
    const ids = open.map((t) => t.id).filter((id) => id !== dragTask);
    const at = Math.min(overIdx ?? ids.length, ids.length);
    ids.splice(at, 0, dragTask);
    onDropTask(project?.id ?? null, ids);
    setOverIdx(null);
    setDragTask(null);
  };

  return (
    <section
      className={`card group/card flex flex-col p-4 transition-shadow ${
        dragTask !== null && overIdx !== null ? "ring-2 ring-[var(--accent)]" : ""
      }`}
      onDragOver={(e) => {
        if (dragTask === null) return;
        e.preventDefault();
        if (overIdx === null) setOverIdx(open.length);
      }}
      onDragLeave={(e) => {
        if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node))
          setOverIdx(null);
      }}
      onDrop={drop}
    >
      <header
        className={`mb-2.5 flex items-center gap-2.5 ${headerDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
        draggable={!!headerDrag}
        title={headerDrag ? "잡고 끌어서 카드 순서를 바꿔요" : undefined}
        onDragStart={(e) => {
          if (!headerDrag) return;
          e.dataTransfer.setData("text/plain", "project");
          e.dataTransfer.effectAllowed = "move";
          headerDrag.onDragStart();
        }}
        onDragEnd={headerDrag?.onDragEnd}
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg"
          style={{ background: `color-mix(in oklab, ${color} 22%, transparent)` }}
        >
          {project ? <Icon emoji={project.emoji} icon={project.icon} /> : "📥"}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1 truncate text-sm font-bold">
            <span className="truncate">{project?.name ?? "인박스"}</span>
            {project?.pinned && <span className="shrink-0 text-[10px]">📌</span>}
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
        {project && (
          <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover/card:opacity-100">
            <button
              onClick={onTogglePin}
              aria-label="고정"
              title="고정"
              className="pressable grid h-7 w-7 place-items-center rounded-full text-xs hover:bg-card-2"
            >
              📌
            </button>
            <button
              onClick={onEditProject}
              aria-label="프로젝트 수정"
              title="수정"
              className="pressable grid h-7 w-7 place-items-center rounded-full text-xs hover:bg-card-2"
            >
              ✏️
            </button>
            <button
              onClick={onDeleteProject}
              aria-label="프로젝트 삭제"
              title="삭제"
              className="pressable grid h-7 w-7 place-items-center rounded-full text-xs hover:bg-card-2"
            >
              🗑️
            </button>
          </div>
        )}
      </header>

      <ul className="flex flex-col">
        {open.map((t, idx) => {
          const p = posOverride[t.id] ?? { u: t.urgency, i: t.importance };
          const q = quadrant(p.u, p.i);
          const d = daysUntil(t.due_date);
          return (
            <li key={t.id} onDragOver={(e) => rowDragOver(e, idx)}>
              {overIdx === idx && dragTask !== null && (
                <div className="mx-1 h-0.5 rounded-full bg-accent" />
              )}
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", String(t.id));
                  e.dataTransfer.effectAllowed = "move";
                  setDragTask(t.id);
                }}
                onDragEnd={() => setDragTask(null)}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered(null)}
                className={`group/row flex cursor-grab items-center gap-1.5 rounded-xl px-1.5 py-1.5 transition-colors active:cursor-grabbing ${
                  hovered === t.id ? "bg-accent-soft" : "hover:bg-card-2"
                } ${dragTask === t.id ? "opacity-40" : ""}`}
              >
                <span className="shrink-0 cursor-grab text-[10px] text-muted/70">
                  ⠿
                </span>
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
                      d !== null && d <= 3
                        ? "text-[var(--st-serious)]"
                        : "text-muted"
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
                <button
                  onClick={() => onDeleteTask(t)}
                  aria-label="할 일 삭제"
                  title="삭제"
                  className="pressable grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] opacity-0 transition-opacity hover:bg-card group-hover/row:opacity-100"
                >
                  🗑️
                </button>
              </div>
            </li>
          );
        })}
        {overIdx === open.length && dragTask !== null && (
          <li>
            <div className="mx-1 h-0.5 rounded-full bg-accent" />
          </li>
        )}
        {open.length === 0 && dragTask === null && (
          <li className="px-2 py-2 text-center text-xs text-muted">
            할 일을 모두 끝냈어요! 🎉
          </li>
        )}
      </ul>

      {doneCount > 0 && (
        <div className="mt-1.5">
          <button
            onClick={() => setShowDone((v) => !v)}
            className="pressable flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-bold text-muted hover:bg-card-2"
          >
            <span>{showDone ? "▾" : "▸"}</span>✅ 완료 {doneCount}개
          </button>
          {showDone && (
            <ul className="mt-0.5 flex flex-col">
              {doneTasks.map((t) => (
                <li
                  key={t.id}
                  className="group/done flex items-center gap-1.5 rounded-lg px-1.5 py-1"
                >
                  <span className="grid h-[16px] w-[16px] shrink-0 place-items-center rounded-full bg-[var(--st-good)] text-[8px] text-white">
                    ✓
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-muted line-through">
                    {t.title}
                  </span>
                  <button
                    onClick={() => onRestoreTask(t)}
                    aria-label="복구"
                    title="다시 할 일로"
                    className="pressable grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] opacity-0 transition-opacity hover:bg-card-2 group-hover/done:opacity-100"
                  >
                    ↩️
                  </button>
                  <button
                    onClick={() => onDeleteTask(t)}
                    aria-label="삭제"
                    className="pressable grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] opacity-0 transition-opacity hover:bg-card-2 group-hover/done:opacity-100"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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

/* ---------------- inline new-project card ---------------- */

function NewProjectCard({
  projects,
  open,
  setOpen,
  dragProject,
  onDropProjectEnd,
}: {
  projects: Project[];
  open: boolean;
  setOpen: (v: boolean) => void;
  dragProject: number | null;
  onDropProjectEnd: () => void;
}) {
  const [name, setName] = useState("");
  const [look, setLook] = useState<{ emoji: string; color: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open && !look) setLook(pickProjectLook(projects));
    if (!open) {
      setLook(null);
      setName("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const cancel = () => setOpen(false);

  const create = async () => {
    if (!name.trim() || busy || !look) return;
    setBusy(true);
    try {
      await api("POST", "/api/projects", {
        name: name.trim(),
        emoji: firstLetter(name),
        color: look.color,
        status: "planning",
      });
      refresh("/api/projects", "/api/activities");
      toast("새 프로젝트가 태어났어요!", "🎊");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        onDragOver={(e) => {
          if (dragProject !== null) e.preventDefault();
        }}
        onDrop={(e) => {
          if (dragProject !== null) {
            e.preventDefault();
            onDropProjectEnd();
          }
        }}
        className="pressable grid min-h-32 place-items-center rounded-[1.25rem] border-2 border-dashed border-line text-muted transition-colors hover:border-[var(--accent)] hover:bg-accent-soft/40 hover:text-accent"
      >
        <span className="flex flex-col items-center gap-1 text-sm font-bold">
          <span className="text-2xl">＋</span>
          새 프로젝트
        </span>
      </button>
    );

  return (
    <section className="card flex flex-col gap-3 p-4 ring-2 ring-[var(--accent)]">
      <div className="flex items-center gap-2.5">
        <span
          className="font-display grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg"
          style={{
            background: `color-mix(in oklab, ${look?.color ?? "#ccc"} 22%, transparent)`,
          }}
        >
          {name.trim() ? firstLetter(name) : "✨"}
        </span>
        <input
          className="input py-2 text-sm"
          placeholder="프로젝트 이름을 입력하고 Enter"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") create();
            if (e.key === "Escape") cancel();
          }}
          onBlur={() => {
            if (!name.trim()) cancel();
          }}
        />
      </div>
      <p className="text-[11px] text-muted">
        아이콘은 이름 첫 글자, 색은 자동 배정 · Enter 생성 · Esc 취소 ·
        이모지/이미지는 생성 후 ✏️ 에서
      </p>
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
  const [dragTask, setDragTask] = useState<number | null>(null);
  const [dragProject, setDragProject] = useState<number | null>(null);
  const [projOver, setProjOver] = useState<number | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const [projModalOpen, setProjModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

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

  /* ----- task actions ----- */

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

  const restoreTask = async (t: Task) => {
    mutate(
      "/api/tasks",
      (curr: Task[] | undefined) =>
        (curr ?? []).map((x) =>
          x.id === t.id ? { ...x, status: "todo" as const, done_at: null } : x,
        ),
      { revalidate: false },
    );
    await api("PATCH", `/api/tasks/${t.id}`, { status: "todo" });
    refresh("/api/tasks", "/api/projects");
    toast(`「${t.title}」 을(를) 다시 할 일로 옮겼어요`, "↩️");
  };

  const deleteTask = async (t: Task) => {
    mutate(
      "/api/tasks",
      (curr: Task[] | undefined) => (curr ?? []).filter((x) => x.id !== t.id),
      { revalidate: false },
    );
    await api("DELETE", `/api/tasks/${t.id}`);
    refresh("/api/tasks", "/api/projects");
    toast(`「${t.title}」 을(를) 지웠어요`, "🗑️");
  };

  const dropTask = async (projectId: number | null, orderedIds: number[]) => {
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]));
    mutate(
      "/api/tasks",
      (curr: Task[] | undefined) =>
        (curr ?? []).map((t) =>
          orderMap.has(t.id)
            ? { ...t, project_id: projectId, sort_order: orderMap.get(t.id)! }
            : t,
        ),
      { revalidate: false },
    );
    await api("POST", "/api/tasks/reorder", {
      project_id: projectId,
      ids: orderedIds,
    });
    refresh("/api/tasks", "/api/projects");
  };

  /* ----- project actions ----- */

  const togglePin = async (p: Project) => {
    await api("PATCH", `/api/projects/${p.id}`, { pinned: !p.pinned });
    refresh("/api/projects");
    toast(p.pinned ? "고정을 해제했어요" : "프로젝트를 고정했어요!", "📌");
  };

  const deleteProject = async (p: Project) => {
    await api("DELETE", `/api/projects/${p.id}`);
    refresh();
    toast(`「${p.name}」 을(를) 보내주었어요`, "👋");
  };

  // beforeId 앞에 끼워넣기 (null이면 맨 뒤로)
  const dropProject = async (beforeId: number | null) => {
    if (dragProject === null) return;
    const dragged = dragProject;
    setDragProject(null);
    setProjOver(null);
    if (dragged === beforeId) return;
    const ids = (projects ?? []).map((p) => p.id).filter((id) => id !== dragged);
    const at = beforeId === null ? ids.length : ids.indexOf(beforeId);
    ids.splice(at === -1 ? ids.length : at, 0, dragged);
    const orderMap = new Map(ids.map((id, idx) => [id, idx]));
    mutate(
      "/api/projects",
      (curr: Project[] | undefined) =>
        [...(curr ?? [])]
          .map((p) => ({ ...p, position: orderMap.get(p.id) ?? p.position }))
          .sort((a, b) => a.position - b.position),
      { revalidate: false },
    );
    await api("POST", "/api/projects/reorder", { ids });
    refresh("/api/projects");
  };

  /* ----- matrix drag ----- */

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

  const cardCommon = {
    posOverride,
    hovered,
    setHovered,
    dragTask,
    setDragTask,
    onDropTask: dropTask,
    onQuickAdd: quickAdd,
    onToggleDone: toggleDone,
    onDeleteTask: deleteTask,
    onRestoreTask: restoreTask,
  };

  return (
    <div className="rise flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">한눈에 👀</h1>
          <p className="mt-1 text-sm text-muted">
            모든 프로젝트와 할 일을 여기서 전부 처리하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="chip" data-on={hideDoneProjects}>
            <input
              type="checkbox"
              className="hidden"
              checked={hideDoneProjects}
              onChange={(e) => setHideDoneProjects(e.target.checked)}
            />
            🎉 완료된 프로젝트 숨기기
          </label>
          <button className="btn btn-primary" onClick={() => setDraftOpen(true)}>
            ＋ 새 프로젝트
          </button>
        </div>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_minmax(440px,44%)]">
        {/* left: all projects + tasks */}
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visibleProjects.map((p) => (
            <div
              key={p.id}
              onDragOver={(e) => {
                if (dragProject !== null && dragProject !== p.id) {
                  e.preventDefault();
                  setProjOver(p.id);
                }
              }}
              onDragLeave={(e) => {
                if (
                  !(e.currentTarget as HTMLElement).contains(
                    e.relatedTarget as Node,
                  )
                )
                  setProjOver((o) => (o === p.id ? null : o));
              }}
              onDrop={(e) => {
                if (dragProject !== null) {
                  e.preventDefault();
                  dropProject(p.id);
                }
              }}
              className={`rounded-[1.25rem] transition-opacity ${
                dragProject !== null && projOver === p.id
                  ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]"
                  : ""
              } ${dragProject === p.id ? "opacity-40" : ""}`}
            >
              <ProjectTaskCard
                project={p}
                tasks={(tasks ?? []).filter((t) => t.project_id === p.id)}
                onEditProject={() => {
                  setEditingProject(p);
                  setProjModalOpen(true);
                }}
                onDeleteProject={() => setDeletingProject(p)}
                onTogglePin={() => togglePin(p)}
                headerDrag={{
                  onDragStart: () => setDragProject(p.id),
                  onDragEnd: () => {
                    setDragProject(null);
                    setProjOver(null);
                  },
                }}
                {...cardCommon}
              />
            </div>
          ))}
          <NewProjectCard
            projects={projects ?? []}
            open={draftOpen}
            setOpen={setDraftOpen}
            dragProject={dragProject}
            onDropProjectEnd={() => dropProject(null)}
          />
          <ProjectTaskCard project={null} tasks={inboxTasks} {...cardCommon} />
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
                <Icon emoji={p.emoji} icon={p.icon} /> {p.name}
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
          <p className="mt-3 text-center text-xs text-muted">
            💡 할 일은 ⠿ 로 순서 변경·프로젝트 이동, 카드는 머리글을 잡고 끌면
            순서가 바뀌어요
          </p>
        </div>
      </div>

      {/* business flow board */}
      <FlowBoard projects={visibleProjects} />

      <ProjectModal
        open={projModalOpen}
        onClose={() => setProjModalOpen(false)}
        editing={editingProject}
      />
      <ConfirmDialog
        open={deletingProject !== null}
        onClose={() => setDeletingProject(null)}
        onConfirm={() => deletingProject && deleteProject(deletingProject)}
        message={`「${deletingProject?.name}」 프로젝트와 관련 할 일·메모가 모두 삭제돼요. 되돌릴 수 없어요!`}
      />
    </div>
  );
}
