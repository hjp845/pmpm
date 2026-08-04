"use client";

import { useEffect, useRef, useState } from "react";
import { api, refresh, useProjects, fileToIconDataUrl } from "@/lib/hooks";
import {
  STATUS_META,
  PROJECT_COLORS,
  PROJECT_EMOJIS,
  pickProjectLook,
  type Project,
  type ProjectStatus,
} from "@/lib/types";
import { Modal, firstLetter } from "@/components/ui";
import { useToast } from "@/components/Toast";

const isLetterIcon = (s: string) =>
  !!s && !/\p{Extended_Pictographic}/u.test(s);

interface FormState {
  name: string;
  emoji: string;
  color: string;
  status: ProjectStatus;
  description: string;
  deadline: string;
  tags: string;
  icon: string | null;
}

const emptyForm: FormState = {
  name: "",
  emoji: "🌱",
  color: PROJECT_COLORS[8],
  status: "planning",
  description: "",
  deadline: "",
  tags: "",
  icon: null,
};

export function ProjectModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Project | null;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [autoLetter, setAutoLetter] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { data: projects } = useProjects();

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
            icon: editing.icon ?? null,
          }
        : { ...emptyForm, color: pickProjectLook(projects ?? []).color },
    );
    setAutoLetter(
      editing ? isLetterIcon(editing.emoji) && !editing.icon : true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        emoji: autoLetter && !form.icon ? firstLetter(form.name) : form.emoji,
        color: form.color,
        status: form.status,
        description: form.description,
        deadline: form.deadline || null,
        icon: form.icon,
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
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-3xl text-4xl"
            style={{ background: `color-mix(in oklab, ${form.color} 25%, transparent)` }}
          >
            {form.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.icon} alt="" className="h-full w-full object-cover" />
            ) : autoLetter ? (
              <span className="font-display">
                {form.name.trim() ? firstLetter(form.name) : "✨"}
              </span>
            ) : (
              form.emoji
            )}
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
          <div className="mb-1 flex items-center justify-between">
            <label className="label mb-0">아이콘 고르기</label>
            <div className="flex gap-1.5">
              <button
                className="chip"
                data-on={autoLetter && !form.icon}
                onClick={() => {
                  setAutoLetter(true);
                  set("icon", null);
                }}
              >
                Aa 이름 첫 글자
              </button>
              <button
                className="chip"
                onClick={() => fileRef.current?.click()}
              >
                🖼️ 이미지 업로드
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                try {
                  set("icon", await fileToIconDataUrl(f));
                } catch {
                  toast("이미지를 읽을 수 없어요 🥲", "⚠️");
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {PROJECT_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => {
                  set("emoji", e);
                  set("icon", null);
                  setAutoLetter(false);
                }}
                className={`pressable grid h-9 w-9 place-items-center rounded-xl text-lg ${
                  form.emoji === e && !form.icon && !autoLetter
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
