"use client";

// 사업 플로우 보드 — 가로로 배치된 단계들, 프로젝트별 체크/미체크
// 단계는 추가·이름수정·삭제·좌우이동 가능

import { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { useStages, useStageChecks, api, refresh } from "@/lib/hooks";
import type { Project, Stage, StageCheck } from "@/lib/types";
import { ConfirmDialog, Icon } from "@/components/ui";
import { useToast } from "@/components/Toast";

export function FlowBoard({ projects }: { projects: Project[] }) {
  const { data: stages } = useStages();
  const { data: checks } = useStageChecks();
  const { mutate } = useSWRConfig();
  const toast = useToast();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [deleting, setDeleting] = useState<Stage | null>(null);

  const list = useMemo(
    () => [...(stages ?? [])].sort((a, b) => a.position - b.position || a.id - b.id),
    [stages],
  );

  const checkSet = useMemo(
    () => new Set((checks ?? []).map((c) => `${c.project_id}|${c.stage_id}`)),
    [checks],
  );

  const toggle = async (p: Project, s: Stage) => {
    const done = !checkSet.has(`${p.id}|${s.id}`);
    mutate(
      "/api/stage-checks",
      (curr: StageCheck[] | undefined) =>
        done
          ? [...(curr ?? []), { project_id: p.id, stage_id: s.id }]
          : (curr ?? []).filter(
              (c) => !(c.project_id === p.id && c.stage_id === s.id),
            ),
      { revalidate: false },
    );
    await api("POST", "/api/stage-checks", {
      project_id: p.id,
      stage_id: s.id,
      done,
    });
    refresh("/api/stage-checks");
    if (done) toast(`${p.name} · ${s.name.replace(/^\S+\s/, "")} 통과!`, "🎉");
  };

  const addStage = async () => {
    const created = await api("POST", "/api/stages", { name: "📍 새 단계" });
    refresh("/api/stages");
    setEditingId(created.id);
    setEditText(created.name);
  };

  const rename = async (s: Stage) => {
    const name = editText.trim();
    setEditingId(null);
    if (name && name !== s.name) {
      await api("PATCH", `/api/stages/${s.id}`, { name });
      refresh("/api/stages");
    }
  };

  const move = async (s: Stage, dir: -1 | 1) => {
    const i = list.findIndex((x) => x.id === s.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    const ids = next.map((x) => x.id);
    mutate(
      "/api/stages",
      () => next.map((x, idx) => ({ ...x, position: idx + 1 })),
      { revalidate: false },
    );
    await api("POST", "/api/stages/reorder", { ids });
    refresh("/api/stages");
  };

  const del = async (s: Stage) => {
    await api("DELETE", `/api/stages/${s.id}`);
    refresh("/api/stages", "/api/stage-checks");
    toast("단계를 삭제했어요", "🗑️");
  };

  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg">사업 플로우 🛤️</h2>
          <p className="text-xs text-muted">
            프로젝트마다 어느 단계까지 왔는지 체크하세요 · 단계 이름을
            더블클릭하면 수정돼요
          </p>
        </div>
        <button className="btn btn-ghost" onClick={addStage}>
          ＋ 단계 추가
        </button>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-stretch gap-0">
          {list.map((s, idx) => {
            const doneCount = projects.filter((p) =>
              checkSet.has(`${p.id}|${s.id}`),
            ).length;
            const allDone = projects.length > 0 && doneCount === projects.length;
            return (
              <div key={s.id} className="flex items-stretch">
                {idx > 0 && (
                  <div className="flex w-7 shrink-0 items-center justify-center text-lg text-muted/60">
                    →
                  </div>
                )}
                <div
                  className={`group/stage flex w-52 shrink-0 flex-col rounded-2xl border p-3 transition-colors ${
                    allDone
                      ? "border-[color-mix(in_oklab,var(--st-good)_45%,var(--line))] bg-[color-mix(in_oklab,var(--st-good)_6%,transparent)]"
                      : "border-line bg-card-2/50"
                  }`}
                >
                  <div className="mb-2 flex items-start gap-1">
                    {editingId === s.id ? (
                      <input
                        className="input px-2 py-1 text-[13px] font-bold"
                        value={editText}
                        autoFocus
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={() => rename(s)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") rename(s);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    ) : (
                      <h3
                        className="min-w-0 flex-1 cursor-text text-[13px] font-bold leading-snug"
                        onDoubleClick={() => {
                          setEditingId(s.id);
                          setEditText(s.name);
                        }}
                        title="더블클릭해서 이름 수정"
                      >
                        {s.name}
                      </h3>
                    )}
                    <div className="flex shrink-0 gap-0 opacity-0 transition-opacity group-hover/stage:opacity-100">
                      <button
                        onClick={() => move(s, -1)}
                        aria-label="왼쪽으로"
                        className="pressable grid h-5 w-5 place-items-center rounded text-[10px] text-muted hover:bg-card"
                      >
                        ◀
                      </button>
                      <button
                        onClick={() => move(s, 1)}
                        aria-label="오른쪽으로"
                        className="pressable grid h-5 w-5 place-items-center rounded text-[10px] text-muted hover:bg-card"
                      >
                        ▶
                      </button>
                      <button
                        onClick={() => setDeleting(s)}
                        aria-label="단계 삭제"
                        className="pressable grid h-5 w-5 place-items-center rounded text-[10px] hover:bg-card"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="mb-2 flex items-center gap-1.5">
                    <div className="progress-track h-1.5 flex-1">
                      <div
                        className="progress-fill"
                        style={{
                          width: projects.length
                            ? `${(doneCount / projects.length) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums text-muted">
                      {doneCount}/{projects.length}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-0.5">
                    {projects.map((p) => {
                      const done = checkSet.has(`${p.id}|${s.id}`);
                      return (
                        <li key={p.id}>
                          <button
                            onClick={() => toggle(p, s)}
                            className={`pressable flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1 text-left text-xs font-medium transition-colors ${
                              done ? "" : "hover:bg-card"
                            }`}
                          >
                            <span
                              className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 text-[8px] transition-colors ${
                                done
                                  ? "border-[var(--st-good)] bg-[var(--st-good)] text-white"
                                  : "border-line text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                            <span className="shrink-0">
                              <Icon emoji={p.emoji} icon={p.icon} />
                            </span>
                            <span
                              className={`truncate ${done ? "text-muted" : "text-ink-2"}`}
                            >
                              {p.name}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                    {projects.length === 0 && (
                      <li className="py-1 text-center text-[11px] text-muted">
                        프로젝트 없음
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
          {list.length === 0 && (
            <p className="py-6 text-sm text-muted">
              「＋ 단계 추가」 로 플로우를 만들어 보세요!
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && del(deleting)}
        message={`「${deleting?.name}」 단계와 모든 프로젝트의 체크 기록이 삭제돼요.`}
      />
    </section>
  );
}
