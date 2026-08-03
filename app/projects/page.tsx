"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProjects, api, refresh, ddayLabel, daysUntil } from "@/lib/hooks";
import {
  STATUS_META,
  PROJECT_COLORS,
  PROJECT_EMOJIS,
  type Project,
  type ProjectStatus,
} from "@/lib/types";
import { Modal, ConfirmDialog, EmptyState, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";

const STATUS_FILTERS: { key: ProjectStatus | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "active", label: "🔥 진행중" },
  { key: "planning", label: "🌱 계획중" },
  { key: "paused", label: "💤 보류" },
  { key: "done", label: "🎉 완료" },
];

type SortKey = "recent" | "deadline" | "progress" | "name";

interface FormState {
  name: string;
  emoji: string;
  color: string;
  status: ProjectStatus;
  description: string;
  deadline: string;
  tags: string;
}

const emptyForm: FormState = {
  name: "",
  emoji: "🚀",
  color: PROJECT_COLORS[8],
  status: "planning",
  description: "",
  deadline: "",
  tags: "",
};

function ProjectModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Project | null;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            name: editing.name,
            emoji: editing.emoji,
            color: editing.color,
            status: editing.status,
            description: editing.description ?? "",
            deadline: editing.deadline?.slice(0, 10) ?? "",
            tags: (editing.tags ?? []).join(", "),
          }
        : emptyForm,
    );
  }, [open, editing]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) {
      toast("프로젝트 이름을 입력해 주세요!", "🙏");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        emoji: form.emoji,
        color: form.color,
        status: form.status,
        description: form.description,
        deadline: form.deadline || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      if (editing) {
        await api("PATCH", `/api/projects/${editing.id}`, body);
        toast("프로젝트를 수정했어요!", "✏️");
      } else {
        await api("POST", "/api/projects", body);
        toast("새 프로젝트가 태어났어요!", "🎊");
      }
      refresh("/api/projects", "/api/activities");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "프로젝트 수정" : "새 프로젝트"}
      emoji={editing ? "✏️" : "🌟"}
      wide
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl text-4xl"
            style={{ background: `color-mix(in oklab, ${form.color} 25%, transparent)` }}
          >
            {form.emoji}
          </div>
          <div className="flex-1">
            <label className="label">이름</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="예: 카페 창업 준비 ☕"
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="label">아이콘 고르기</label>
          <div className="flex flex-wrap gap-1">
            {PROJECT_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => set("emoji", e)}
                className={`pressable grid h-9 w-9 place-items-center rounded-xl text-lg ${
                  form.emoji === e
                    ? "bg-accent-soft ring-2 ring-[var(--accent)]"
                    : "hover:bg-card-2"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">테마 색상</label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => set("color", c)}
                aria-label={`색상 ${c}`}
                className={`pressable h-8 w-8 rounded-full transition-transform ${
                  form.color === c ? "scale-110 ring-2 ring-offset-2 ring-[var(--accent)] ring-offset-[var(--card)]" : ""
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">상태</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(STATUS_META) as ProjectStatus[]).map((s) => (
                <button
                  key={s}
                  className="chip"
                  data-on={form.status === s}
                  onClick={() => set("status", s)}
                >
                  {STATUS_META[s].emoji} {STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">마감일 (선택)</label>
            <input
              type="date"
              className="input"
              value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">설명 (선택)</label>
          <textarea
            className="input resize-none"
            rows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="어떤 프로젝트인가요?"
          />
        </div>

        <div>
          <label className="label">태그 (쉼표로 구분)</label>
          <input
            className="input"
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="예: 사이드잡, 온라인, 수익화"
          />
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose}>
            취소
          </button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "저장 중…" : editing ? "저장하기" : "만들기 🎀"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

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
          {p.emoji}
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
