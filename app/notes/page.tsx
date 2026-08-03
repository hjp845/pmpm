"use client";

import { useMemo, useState } from "react";
import { useNotes, useProjects, api, refresh, timeAgo } from "@/lib/hooks";
import { NOTE_COLORS, type Note } from "@/lib/types";
import { ConfirmDialog, EmptyState, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function NotesPage() {
  const { data: notes, isLoading } = useNotes();
  const { data: projects } = useProjects();
  const toast = useToast();

  const [content, setContent] = useState("");
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [projectId, setProjectId] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleting, setDeleting] = useState<Note | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const list = useMemo(() => {
    let l = notes ?? [];
    if (filter === "inbox") l = l.filter((n) => !n.project_id);
    else if (filter !== "all")
      l = l.filter((n) => n.project_id === Number(filter));
    return l;
  }, [notes, filter]);

  const add = async () => {
    if (!content.trim()) {
      toast("메모 내용을 적어 주세요!", "🙏");
      return;
    }
    await api("POST", "/api/notes", {
      content: content.trim(),
      color,
      project_id: projectId ? Number(projectId) : null,
    });
    setContent("");
    refresh("/api/notes", "/api/activities");
    toast("메모를 붙였어요!", "📌");
  };

  const saveEdit = async (n: Note) => {
    if (editText.trim() && editText !== n.content) {
      await api("PATCH", `/api/notes/${n.id}`, { content: editText.trim() });
      refresh("/api/notes");
      toast("메모를 수정했어요", "✏️");
    }
    setEditingId(null);
  };

  const doDelete = async (n: Note) => {
    await api("DELETE", `/api/notes/${n.id}`);
    refresh("/api/notes");
    toast("메모를 떼어냈어요", "🗑️");
  };

  return (
    <div className="rise flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">메모 📝</h1>
        <select
          className="input w-auto cursor-pointer"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="프로젝트 필터"
        >
          <option value="all">🗂️ 전체 메모</option>
          <option value="inbox">📥 인박스</option>
          {(projects ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.emoji} {p.name}
            </option>
          ))}
        </select>
      </header>

      {/* composer */}
      <div className="card p-5" style={{ background: `color-mix(in oklab, ${color} 30%, var(--card))` }}>
        <textarea
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-ink-2/50"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="번뜩이는 아이디어, 잊으면 안 되는 것들을 여기에… ✨"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add();
          }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`색상 ${c}`}
                className={`pressable h-6 w-6 rounded-full border border-black/10 ${
                  color === c ? "scale-110 ring-2 ring-[var(--accent)]" : ""
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
          <select
            className="input w-auto cursor-pointer py-1.5 text-xs"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            aria-label="프로젝트 연결"
          >
            <option value="">📥 인박스</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary ml-auto" onClick={add}>
            붙이기 📌
          </button>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : list.length === 0 ? (
        <EmptyState
          emoji="🗒️"
          title="아직 메모가 없어요"
          subtitle="위에 첫 메모를 남겨 보세요!"
        />
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {list.map((n, i) => {
            const proj = (projects ?? []).find((p) => p.id === n.project_id);
            return (
              <div
                key={n.id}
                className="card card-hover group break-inside-avoid p-4"
                style={{
                  background: `color-mix(in oklab, ${n.color} 35%, var(--card))`,
                  transform: `rotate(${((n.id + i) % 3) - 1}deg)`,
                }}
              >
                {editingId === n.id ? (
                  <textarea
                    className="w-full resize-none rounded-xl bg-white/50 p-2 text-sm outline-none dark:bg-black/20"
                    rows={3}
                    value={editText}
                    autoFocus
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => saveEdit(n)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                        saveEdit(n);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                ) : (
                  <p
                    className="cursor-text whitespace-pre-wrap text-sm leading-relaxed text-[#3b3630] dark:text-ink"
                    onDoubleClick={() => {
                      setEditingId(n.id);
                      setEditText(n.content);
                    }}
                  >
                    {n.content}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  {proj && (
                    <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-bold text-[#3b3630] dark:bg-black/25 dark:text-ink">
                      {proj.emoji} {proj.name}
                    </span>
                  )}
                  <span className="text-[11px] font-medium text-[#3b3630]/60 dark:text-ink-2">
                    {timeAgo(n.created_at)}
                  </span>
                  <button
                    onClick={() => setDeleting(n)}
                    aria-label="삭제"
                    className="pressable ml-auto grid h-7 w-7 place-items-center rounded-full text-xs opacity-0 transition-opacity hover:bg-white/50 group-hover:opacity-100 dark:hover:bg-black/25"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-muted">
        💡 메모를 더블클릭하면 바로 수정할 수 있어요 (Ctrl+Enter로 저장)
      </p>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && doDelete(deleting)}
        message="이 메모를 떼어낼까요?"
      />
    </div>
  );
}
