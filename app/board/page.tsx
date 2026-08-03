"use client";

import { useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { useProjects, useTasks, api, refresh, ddayLabel, daysUntil } from "@/lib/hooks";
import {
  PRIORITY_META,
  type Priority,
  type Task,
  type TaskStatus,
} from "@/lib/types";
import { Modal, ConfirmDialog, Spinner, Icon } from "@/components/ui";
import { useToast } from "@/components/Toast";

const COLUMNS: { key: TaskStatus; label: string; emoji: string }[] = [
  { key: "todo", label: "할 일", emoji: "📮" },
  { key: "doing", label: "진행 중", emoji: "🏃" },
  { key: "done", label: "완료", emoji: "🎀" },
];

interface TaskForm {
  title: string;
  project_id: string;
  priority: Priority;
  due_date: string;
  status: TaskStatus;
}

const emptyTask: TaskForm = {
  title: "",
  project_id: "",
  priority: "mid",
  due_date: "",
  status: "todo",
};

function TaskModal({
  open,
  onClose,
  editing,
  defaultStatus,
}: {
  open: boolean;
  onClose: () => void;
  editing: Task | null;
  defaultStatus: TaskStatus;
}) {
  const { data: projects } = useProjects();
  const [form, setForm] = useState<TaskForm>(emptyTask);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            title: editing.title,
            project_id: editing.project_id ? String(editing.project_id) : "",
            priority: editing.priority,
            due_date: editing.due_date?.slice(0, 10) ?? "",
            status: editing.status,
          }
        : { ...emptyTask, status: defaultStatus },
    );
  }, [open, editing, defaultStatus]);

  const set = <K extends keyof TaskForm>(k: K, v: TaskForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) {
      toast("할 일 내용을 입력해 주세요!", "🙏");
      return;
    }
    const body = {
      title: form.title.trim(),
      project_id: form.project_id ? Number(form.project_id) : null,
      priority: form.priority,
      due_date: form.due_date || null,
      status: form.status,
    };
    if (editing) {
      await api("PATCH", `/api/tasks/${editing.id}`, body);
      toast("할 일을 수정했어요!", "✏️");
    } else {
      await api("POST", "/api/tasks", body);
      toast("새 할 일을 추가했어요!", "📝");
    }
    refresh("/api/tasks", "/api/projects", "/api/activities");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "할 일 수정" : "새 할 일"}
      emoji={editing ? "✏️" : "📝"}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="label">무엇을 해야 하나요?</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="예: 로고 시안 3개 만들기"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
        </div>
        <div>
          <label className="label">프로젝트</label>
          <select
            className="input cursor-pointer"
            value={form.project_id}
            onChange={(e) => set("project_id", e.target.value)}
          >
            <option value="">📥 프로젝트 없음 (인박스)</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">우선순위</label>
            <div className="flex gap-1.5">
              {(Object.keys(PRIORITY_META) as Priority[]).map((pr) => (
                <button
                  key={pr}
                  className="chip"
                  data-on={form.priority === pr}
                  onClick={() => set("priority", pr)}
                >
                  {PRIORITY_META[pr].emoji} {PRIORITY_META[pr].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">마감일 (선택)</label>
            <input
              type="date"
              className="input"
              value={form.due_date}
              onChange={(e) => set("due_date", e.target.value)}
            />
          </div>
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose}>
            취소
          </button>
          <button className="btn btn-primary" onClick={save}>
            {editing ? "저장하기" : "추가하기 🎀"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function BoardPage() {
  const { data: tasks, isLoading } = useTasks();
  const { data: projects } = useProjects();
  const { mutate } = useSWRConfig();
  const toast = useToast();

  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);

  const filtered = useMemo(() => {
    let l = tasks ?? [];
    if (projectFilter === "inbox") l = l.filter((t) => !t.project_id);
    else if (projectFilter !== "all")
      l = l.filter((t) => t.project_id === Number(projectFilter));
    return l;
  }, [tasks, projectFilter]);

  const drop = async (status: TaskStatus) => {
    setOverCol(null);
    if (dragId === null) return;
    const task = (tasks ?? []).find((t) => t.id === dragId);
    setDragId(null);
    if (!task || task.status === status) return;

    // optimistic move
    mutate(
      "/api/tasks",
      (curr: Task[] | undefined) =>
        (curr ?? []).map((t) =>
          t.id === task.id
            ? {
                ...t,
                status,
                done_at: status === "done" ? new Date().toISOString() : null,
              }
            : t,
        ),
      { revalidate: false },
    );
    await api("PATCH", `/api/tasks/${task.id}`, { status });
    refresh("/api/tasks", "/api/projects", "/api/activities");
    if (status === "done") toast(`「${task.title}」 완료! 짝짝짝`, "🎉");
  };

  const doDelete = async (t: Task) => {
    await api("DELETE", `/api/tasks/${t.id}`);
    refresh("/api/tasks", "/api/projects");
    toast("할 일을 삭제했어요", "🗑️");
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="rise flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">칸반보드 📋</h1>
        <div className="flex items-center gap-2">
          <select
            className="input w-auto cursor-pointer"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            aria-label="프로젝트 필터"
          >
            <option value="all">🗂️ 모든 프로젝트</option>
            <option value="inbox">📥 인박스</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditing(null);
              setDefaultStatus("todo");
              setModalOpen(true);
            }}
          >
            ＋ 할 일
          </button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = filtered.filter((t) => t.status === col.key);
          return (
            <section
              key={col.key}
              className={`flex min-h-64 flex-col gap-2.5 rounded-3xl bg-card-2/60 p-3 transition-colors ${
                overCol === col.key ? "drag-over" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(col.key);
              }}
              onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
              onDrop={() => drop(col.key)}
            >
              <div className="flex items-center justify-between px-2 pt-1">
                <h2 className="font-display flex items-center gap-1.5 text-base">
                  <span>{col.emoji}</span> {col.label}
                  <span className="ml-1 rounded-full bg-card px-2 py-0.5 text-xs font-bold text-ink-2">
                    {items.length}
                  </span>
                </h2>
                <button
                  onClick={() => {
                    setEditing(null);
                    setDefaultStatus(col.key);
                    setModalOpen(true);
                  }}
                  aria-label={`${col.label}에 추가`}
                  className="pressable grid h-7 w-7 place-items-center rounded-full text-ink-2 hover:bg-card"
                >
                  ＋
                </button>
              </div>

              {items.length === 0 && (
                <p className="py-8 text-center text-xs text-muted">
                  {col.key === "done" ? "완료한 일이 여기 모여요 ✨" : "카드를 끌어다 놓아 보세요"}
                </p>
              )}

              {items.map((t) => {
                const proj = (projects ?? []).find((p) => p.id === t.project_id);
                const d = daysUntil(t.due_date);
                return (
                  <article
                    key={t.id}
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    onDoubleClick={() => {
                      setEditing(t);
                      setModalOpen(true);
                    }}
                    className={`card group cursor-grab p-3.5 active:cursor-grabbing ${
                      dragId === t.id ? "dragging" : "card-hover"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <p
                        className={`flex-1 text-sm font-semibold leading-snug ${
                          t.status === "done" ? "text-muted line-through" : ""
                        }`}
                      >
                        {t.title}
                      </p>
                      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => {
                            setEditing(t);
                            setModalOpen(true);
                          }}
                          aria-label="수정"
                          className="pressable grid h-6 w-6 place-items-center rounded-full text-xs hover:bg-card-2"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeleting(t)}
                          aria-label="삭제"
                          className="pressable grid h-6 w-6 place-items-center rounded-full text-xs hover:bg-card-2"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-card-2 px-2 py-0.5 text-[11px] font-bold text-ink-2">
                        {PRIORITY_META[t.priority].emoji}{" "}
                        {PRIORITY_META[t.priority].label}
                      </span>
                      {proj && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                          style={{
                            background: `color-mix(in oklab, ${proj.color} 20%, transparent)`,
                            color: "var(--ink)",
                          }}
                        >
                          <Icon emoji={proj.emoji} icon={proj.icon} />{" "}
                          {proj.name}
                        </span>
                      )}
                      {t.due_date && t.status !== "done" && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            d !== null && d < 0
                              ? "bg-[color-mix(in_oklab,var(--st-critical)_14%,transparent)] text-[var(--st-critical)]"
                              : d !== null && d <= 3
                                ? "bg-[color-mix(in_oklab,var(--st-serious)_16%,transparent)] text-[var(--st-serious)]"
                                : "bg-card-2 text-ink-2"
                          }`}
                        >
                          ⏰ {ddayLabel(t.due_date)}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted">
        💡 카드를 드래그해서 옮기고, 더블클릭하면 수정할 수 있어요
      </p>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        defaultStatus={defaultStatus}
      />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && doDelete(deleting)}
        message={`「${deleting?.title}」 할 일을 삭제할까요?`}
      />
    </div>
  );
}
