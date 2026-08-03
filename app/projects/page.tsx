"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProjects, api, refresh, ddayLabel, daysUntil } from "@/lib/hooks";
import { STATUS_META, type Project, type ProjectStatus } from "@/lib/types";
import { ConfirmDialog, EmptyState, Spinner, Icon } from "@/components/ui";
import { ProjectModal } from "@/components/ProjectModal";
import { useToast } from "@/components/Toast";

const STATUS_FILTERS: { key: ProjectStatus | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "active", label: "🔥 진행중" },
  { key: "planning", label: "🌱 계획중" },
  { key: "paused", label: "💤 보류" },
  { key: "done", label: "🎉 완료" },
];

type SortKey = "recent" | "deadline" | "progress" | "name";


function ProjectCard({
  p,
  onEdit,
  onDelete,
}: {
  p: Project;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const toast = useToast();
  const pct = p.task_total ? Math.round((p.task_done / p.task_total) * 100) : 0;
  const dday = p.deadline ? ddayLabel(p.deadline) : null;
  const dleft = daysUntil(p.deadline);

  const togglePin = async () => {
    await api("PATCH", `/api/projects/${p.id}`, { pinned: !p.pinned });
    refresh("/api/projects");
    toast(p.pinned ? "고정을 해제했어요" : "프로젝트를 고정했어요!", "📌");
  };

  return (
    <div className="card card-hover group relative flex flex-col gap-3 p-5">
      <div className="flex items-start gap-3">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl"
          style={{ background: `color-mix(in oklab, ${p.color} 22%, transparent)` }}
        >
          <Icon emoji={p.emoji} icon={p.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-bold">{p.name}</h3>
            {p.pinned && <span className="shrink-0 text-xs">📌</span>}
          </div>
          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-card-2 px-2 py-0.5 text-[11px] font-bold text-ink-2">
            {STATUS_META[p.status].emoji} {STATUS_META[p.status].label}
          </span>
        </div>
        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={togglePin}
            aria-label="고정"
            className="pressable grid h-8 w-8 place-items-center rounded-full hover:bg-card-2"
          >
            📌
          </button>
          <button
            onClick={onEdit}
            aria-label="수정"
            className="pressable grid h-8 w-8 place-items-center rounded-full hover:bg-card-2"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            aria-label="삭제"
            className="pressable grid h-8 w-8 place-items-center rounded-full hover:bg-card-2"
          >
            🗑️
          </button>
        </div>
      </div>

      {p.description && (
        <p className="line-clamp-2 text-sm text-ink-2">{p.description}</p>
      )}

      {(p.tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {p.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-semibold text-ink-2">
            할 일 {p.task_done}/{p.task_total}
          </span>
          <span className="font-bold text-accent">{pct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        {dday && (
          <p
            className={`mt-2 text-xs font-bold ${
              dleft !== null && dleft < 0
                ? "text-[var(--st-critical)]"
                : dleft !== null && dleft <= 7
                  ? "text-[var(--st-serious)]"
                  : "text-muted"
            }`}
          >
            🗓️ 마감 {dday}
          </p>
        )}
      </div>
    </div>
  );
}

function ProjectsInner() {
  const { data: projects, isLoading } = useProjects();
  const params = useSearchParams();
  const toast = useToast();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [modalOpen, setModalOpen] = useState(params.get("new") === "1");
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const list = useMemo(() => {
    let l = [...(projects ?? [])];
    const q = query.trim().toLowerCase();
    if (q)
      l = l.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(q)),
      );
    if (filter !== "all") l = l.filter((p) => p.status === filter);
    const pct = (p: Project) => (p.task_total ? p.task_done / p.task_total : 0);
    switch (sort) {
      case "deadline":
        l.sort((a, b) =>
          (a.deadline ?? "9999") < (b.deadline ?? "9999") ? -1 : 1,
        );
        break;
      case "progress":
        l.sort((a, b) => pct(b) - pct(a));
        break;
      case "name":
        l.sort((a, b) => a.name.localeCompare(b.name, "ko"));
        break;
      default:
        l.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    }
    l.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    return l;
  }, [projects, query, filter, sort]);

  const doDelete = async (p: Project) => {
    await api("DELETE", `/api/projects/${p.id}`);
    refresh();
    toast(`「${p.name}」 을(를) 보내주었어요`, "👋");
  };

  return (
    <div className="rise flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">프로젝트 📁</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          ＋ 새 프로젝트
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm">
            🔍
          </span>
          <input
            className="input pl-10"
            placeholder="이름이나 태그로 검색…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="input w-auto cursor-pointer"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="정렬"
        >
          <option value="recent">✨ 최신순</option>
          <option value="deadline">⏰ 마감 임박순</option>
          <option value="progress">📈 진행률순</option>
          <option value="name">🔤 이름순</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            className="chip"
            data-on={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key !== "all" && (
              <span className="opacity-70">
                {(projects ?? []).filter((p) => p.status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : list.length === 0 ? (
        <EmptyState
          emoji="🗂️"
          title={query || filter !== "all" ? "조건에 맞는 프로젝트가 없어요" : "아직 프로젝트가 없어요"}
          subtitle="오른쪽 위 「새 프로젝트」 버튼으로 시작해 보세요!"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <ProjectCard
              key={p.id}
              p={p}
              onEdit={() => {
                setEditing(p);
                setModalOpen(true);
              }}
              onDelete={() => setDeleting(p)}
            />
          ))}
        </div>
      )}

      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
      />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && doDelete(deleting)}
        message={`「${deleting?.name}」 프로젝트와 관련 할 일·메모가 모두 삭제돼요. 되돌릴 수 없어요!`}
      />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProjectsInner />
    </Suspense>
  );
}
