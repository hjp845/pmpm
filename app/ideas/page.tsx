"use client";

// 아이디어 랩 💡 — 프로젝트 관리 UI 콘셉트 20선
// 전부 살아있는 미니 목업. 마음에 드는 번호를 고르면 진짜 기능으로 승격!

import { useEffect, useState, type ReactNode } from "react";

/* ---------- 공용 샘플 데이터 (실제 프로젝트 이름 차용) ---------- */

const SP = [
  { name: "화이트티글", letter: "화", color: "#f472b6", pct: 72 },
  { name: "숏츠자동생성기", letter: "숏", color: "#38bdf8", pct: 45 },
  { name: "팔도별미", letter: "팔", color: "#4ade80", pct: 88 },
  { name: "매일11시", letter: "🐙", color: "#a78bfa", pct: 30 },
];

const seq = (pct: number) =>
  `color-mix(in oklab, var(--series-1) ${pct}%, var(--card))`;

/* ---------- 카드 프레임 ---------- */

function Frame({
  n,
  title,
  desc,
  tags,
  children,
}: {
  n: number;
  title: string;
  desc: string;
  tags: string[];
  children: ReactNode;
}) {
  return (
    <section className="card card-hover flex flex-col overflow-hidden">
      <div className="relative h-56 shrink-0 overflow-hidden border-b border-line bg-card-2/40 p-4">
        {children}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-sm text-accent">
            {String(n).padStart(2, "0")}
          </span>
          <h3 className="font-display text-base">{title}</h3>
        </div>
        <p className="text-xs leading-relaxed text-ink-2">{desc}</p>
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent"
            >
              #{t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 01 간트 타임라인 ---------- */

function GanttMock() {
  const bars = [
    { p: SP[0], l: 0, w: 45 },
    { p: SP[1], l: 20, w: 55 },
    { p: SP[2], l: 35, w: 62 },
    { p: SP[3], l: 60, w: 38 },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex justify-between text-[10px] font-bold text-muted">
        <span>9월</span>
        <span>10월</span>
        <span>11월</span>
      </div>
      <div className="relative flex flex-col gap-2.5">
        {[25, 50, 75].map((x) => (
          <div
            key={x}
            className="absolute inset-y-0 w-px"
            style={{ left: `${x}%`, background: "var(--grid)" }}
          />
        ))}
        <div
          className="absolute inset-y-[-8px] w-0.5 rounded"
          style={{ left: "42%", background: "var(--accent)" }}
          title="오늘"
        />
        {bars.map(({ p, l, w }) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="w-8 shrink-0 truncate text-[10px] font-bold text-ink-2">
              {p.letter}
            </span>
            <div className="relative h-4 flex-1">
              <div
                className="absolute inset-y-0 rounded-full"
                style={{
                  left: `${l}%`,
                  width: `${w}%`,
                  background: `color-mix(in oklab, ${p.color} 75%, transparent)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-[10px] text-muted">
        보라선이 오늘 — 겹침이 한눈에
      </p>
    </div>
  );
}

/* ---------- 02 잔디 히트맵 ---------- */

function HeatmapMock() {
  const level = (c: number, r: number) => ((c * 7 + r) * 13 + c * 5) % 6;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <div className="flex gap-1">
        {Array.from({ length: 16 }, (_, c) => (
          <div key={c} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, r) => {
              const lv = level(c, r);
              return (
                <div
                  key={r}
                  className="h-2.5 w-2.5 rounded-[3px]"
                  style={{
                    background: lv === 0 ? "var(--card-2)" : seq(lv * 20),
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted">
        적음
        {[20, 40, 60, 80, 100].map((v) => (
          <span
            key={v}
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{ background: seq(v) }}
          />
        ))}
        많음 · 완료한 할 일 밀도
      </div>
    </div>
  );
}

/* ---------- 03 지하철 노선도 ---------- */

function MetroMock() {
  const stations1 = [20, 85, 150, 215];
  const names = ["기획", "제작", "출시", "성장"];
  return (
    <div className="grid h-full place-items-center">
      <svg viewBox="0 0 240 130" className="w-full max-w-64">
        <polyline
          points="20,35 215,35"
          fill="none"
          stroke={SP[0].color}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <polyline
          points="20,95 85,95 150,35"
          fill="none"
          stroke={SP[1].color}
          strokeWidth="6"
          strokeLinecap="round"
        />
        {stations1.map((x, i) => (
          <g key={x}>
            <circle
              cx={x}
              cy="35"
              r={i === 2 ? 8 : 6}
              fill="var(--card)"
              stroke="var(--ink)"
              strokeWidth="2.5"
            />
            <text
              x={x}
              y="18"
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="var(--ink-2)"
            >
              {names[i]}
            </text>
          </g>
        ))}
        {[20, 85].map((x) => (
          <circle
            key={x}
            cx={x}
            cy="95"
            r="6"
            fill="var(--card)"
            stroke="var(--ink)"
            strokeWidth="2.5"
          />
        ))}
        <text x="20" y="118" textAnchor="middle" fontSize="10" fill="var(--ink-2)">
          화이트티글
        </text>
        <text x="118" y="118" textAnchor="middle" fontSize="10" fill="var(--ink-2)">
          숏츠자동생성기 (출시역 환승!)
        </text>
      </svg>
    </div>
  );
}

/* ---------- 04 정원 대시보드 ---------- */

function GardenMock() {
  const plant = (pct: number) => (pct < 30 ? "🌱" : pct < 60 ? "🌿" : pct < 85 ? "🪴" : "🌳");
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="flex items-end gap-5">
        {SP.map((p) => (
          <div key={p.name} className="flex flex-col items-center gap-1">
            <span
              className="transition-transform hover:scale-110"
              style={{ fontSize: 16 + p.pct * 0.22 }}
            >
              {plant(p.pct)}
            </span>
            <span className="text-[10px] font-bold text-ink-2">{p.letter}</span>
            <span className="text-[9px] tabular-nums text-muted">{p.pct}%</span>
          </div>
        ))}
      </div>
      <p className="text-center text-[10px] text-muted">
        할 일을 끝낼수록 무럭무럭 — 방치하면 시들어요 🥀
      </p>
    </div>
  );
}

/* ---------- 05 버블 맵 ---------- */

function BubbleMock() {
  const bubbles = [
    { p: SP[0], x: 22, y: 28, s: 68, v: "--series-1" },
    { p: SP[1], x: 60, y: 18, s: 52, v: "--series-2" },
    { p: SP[2], x: 45, y: 58, s: 44, v: "--series-3" },
  ];
  return (
    <div className="relative h-full">
      {bubbles.map(({ p, x, y, s, v }) => (
        <div
          key={p.name}
          className="absolute grid place-items-center rounded-full font-display text-white transition-transform hover:scale-105"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: s,
            height: s,
            background: `var(${v})`,
            border: "2px solid var(--card)",
            fontSize: s * 0.32,
          }}
          title={p.name}
        >
          {p.letter}
        </div>
      ))}
      <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center gap-0.5 text-[10px] text-muted">
        <span>원 크기 = 남은 할 일 수</span>
        <span>큰 원부터 터뜨리러 가기 🎈</span>
      </div>
    </div>
  );
}

/* ---------- 06 레이더 건강도 ---------- */

const radarPt = (i: number, v: number, cx = 70, cy = 62, r = 46) => {
  const a = ((-90 + i * 72) * Math.PI) / 180;
  return `${cx + Math.cos(a) * r * v},${cy + Math.sin(a) * r * v}`;
};

function RadarMock() {
  const axes = ["진행", "긴급", "활동", "수익", "재미"];
  const vals = [0.82, 0.55, 0.9, 0.4, 0.75];
  return (
    <div className="grid h-full place-items-center">
      <svg viewBox="0 0 140 132" className="w-full max-w-52">
        {[0.33, 0.66, 1].map((g) => (
          <polygon
            key={g}
            points={axes.map((_, i) => radarPt(i, g)).join(" ")}
            fill="none"
            stroke="var(--grid)"
            strokeWidth="1"
          />
        ))}
        <polygon
          points={vals.map((v, i) => radarPt(i, v)).join(" ")}
          fill="color-mix(in oklab, var(--series-1) 25%, transparent)"
          stroke="var(--series-1)"
          strokeWidth="2"
        />
        {vals.map((v, i) => (
          <circle
            key={i}
            cx={radarPt(i, v).split(",")[0]}
            cy={radarPt(i, v).split(",")[1]}
            r="3"
            fill="var(--series-1)"
            stroke="var(--card)"
            strokeWidth="1.5"
          />
        ))}
        {axes.map((a, i) => {
          const [x, y] = radarPt(i, 1.28).split(",").map(Number);
          return (
            <text
              key={a}
              x={x}
              y={y + 3}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="var(--ink-2)"
            >
              {a}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- 07 포커스 모드 ---------- */

function FocusMock() {
  const [tasks, setTasks] = useState([
    { t: "리뷰 이벤트 당첨자 발표", done: false },
    { t: "썸네일 3안 뽑기", done: false },
    { t: "원두 납품 업체 회신", done: true },
  ]);
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      <p className="font-display text-center text-sm">
        오늘은 딱 이 <span className="text-accent">3개</span>만! 🎯
      </p>
      {tasks.map((task, i) => (
        <button
          key={task.t}
          onClick={() =>
            setTasks((ts) =>
              ts.map((x, j) => (j === i ? { ...x, done: !x.done } : x)),
            )
          }
          className="pressable flex items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2 text-left"
        >
          <span
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[10px] transition-colors ${
              task.done
                ? "border-[var(--st-good)] bg-[var(--st-good)] text-white"
                : "border-line text-transparent"
            }`}
          >
            ✓
          </span>
          <span
            className={`text-xs font-semibold ${task.done ? "text-muted line-through" : ""}`}
          >
            {task.t}
          </span>
          {task.done && <span className="ml-auto text-sm">🎉</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- 08 스탠드업 카드 ---------- */

function StandupMock() {
  const rows = [
    { k: "어제", e: "✅", v: "숏츠 템플릿 2종 완성", c: "--st-good" },
    { k: "오늘", e: "🎯", v: "자막 자동화 파이프라인 연결", c: "--series-1" },
    { k: "블로커", e: "🚧", v: "TTS API 요금제 승인 대기", c: "--st-serious" },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <p className="text-center text-[10px] font-bold text-muted">
        🐙 매일11시 · 오늘의 스탠드업
      </p>
      {rows.map((r) => (
        <div
          key={r.k}
          className="rounded-xl border-l-4 bg-card px-3 py-2"
          style={{ borderColor: `var(${r.c})` }}
        >
          <p className="text-[10px] font-bold text-muted">
            {r.e} {r.k}
          </p>
          <p className="text-xs font-semibold">{r.v}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------- 09 배터리 진행률 ---------- */

function BatteryMock() {
  const items = [
    { p: SP[2], v: "--st-good" },
    { p: SP[0], v: "--st-warn" },
    { p: SP[3], v: "--st-critical" },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      {items.map(({ p, v }) => (
        <div key={p.name} className="flex items-center gap-3">
          <span className="w-20 truncate text-right text-[11px] font-bold text-ink-2">
            {p.name}
          </span>
          <div className="relative h-7 flex-1 rounded-md border-2 border-[var(--ink-2)] p-0.5">
            <div className="absolute -right-1.5 top-1/2 h-3 w-1.5 -translate-y-1/2 rounded-r bg-[var(--ink-2)]" />
            <div
              className="h-full rounded-[3px] transition-all"
              style={{ width: `${p.pct}%`, background: `var(${v})` }}
            />
          </div>
          <span className="w-9 text-xs font-bold tabular-nums">{p.pct}%</span>
        </div>
      ))}
      <p className="text-center text-[10px] text-muted">
        방전 직전 프로젝트부터 충전(=일)하러 가기 🔌
      </p>
    </div>
  );
}

/* ---------- 10 OKR 트리 ---------- */

function OkrMock() {
  const krs = [
    { t: "스토어 월매출 300만", pct: 64 },
    { t: "숏츠 구독 1만", pct: 38 },
    { t: "신규 채널 2개 출시", pct: 50 },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <div className="rounded-xl bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] px-3 py-2">
        <p className="text-[10px] font-bold text-accent">OBJECTIVE</p>
        <p className="font-display text-sm">Q4 부업 월수익 500만 만들기 💰</p>
      </div>
      <div className="ml-3 flex flex-col gap-1.5 border-l-2 border-line pl-3">
        {krs.map((kr) => (
          <div key={kr.t} className="rounded-lg bg-card px-2.5 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-semibold">
                KR · {kr.t}
              </span>
              <span className="text-[10px] font-bold tabular-nums text-accent">
                {kr.pct}%
              </span>
            </div>
            <div className="progress-track mt-1 h-1">
              <div className="progress-fill" style={{ width: `${kr.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 11 퍼널 파이프라인 ---------- */

function FunnelMock() {
  const steps = [
    { t: "아이디어", n: 24, w: 100, c: 25 },
    { t: "검증", n: 18, w: 80, c: 45 },
    { t: "제작", n: 12, w: 60, c: 65 },
    { t: "출시", n: 7, w: 42, c: 85 },
    { t: "수익화", n: 4, w: 26, c: 100 },
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5">
      {steps.map((s) => (
        <div
          key={s.t}
          className="flex h-7 items-center justify-center gap-2 rounded-lg text-[11px] font-bold transition-transform hover:scale-[1.03]"
          style={{
            width: `${s.w}%`,
            background: seq(s.c),
            color: s.c > 55 ? "#fff" : "var(--ink)",
          }}
        >
          {s.t} <span className="tabular-nums">{s.n}</span>
        </div>
      ))}
      <p className="mt-1 text-[10px] text-muted">
        아이디어 24개 중 4개가 돈이 되는 중 — 전환율 17%
      </p>
    </div>
  );
}

/* ---------- 12 스트릭 트래커 ---------- */

function StreakMock() {
  const days = ["월", "화", "수", "목", "금", "토", "일"];
  const done = [true, true, true, true, true, false, false];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <p className="font-display text-2xl">
        🔥 <span className="text-accent">12일</span> 연속 작업 중
      </p>
      <div className="flex gap-2">
        {days.map((d, i) => (
          <div key={d} className="flex flex-col items-center gap-1">
            <span
              className={`grid h-9 w-9 place-items-center rounded-full text-base ${
                done[i]
                  ? "bg-[color-mix(in_oklab,var(--st-warn)_25%,transparent)]"
                  : i === 5
                    ? "animate-pulse border-2 border-dashed border-[var(--accent)]"
                    : "bg-card-2"
              }`}
            >
              {done[i] ? "🔥" : i === 5 ? "❓" : ""}
            </span>
            <span className="text-[9px] font-bold text-muted">{d}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted">오늘 아무 할 일 1개만 끝내면 불꽃 유지!</p>
    </div>
  );
}

/* ---------- 13 수익 위젯 ---------- */

function RevenueMock() {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="rounded-xl bg-card p-3">
        <p className="text-[10px] font-bold text-muted">이번 달 부업 수익</p>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold">₩1,842,000</span>
          <span className="pb-1 text-[11px] font-bold text-[var(--st-good)]">
            ↑ 23%
          </span>
        </div>
        <svg viewBox="0 0 140 32" className="mt-1 w-full">
          <polyline
            points="0,26 20,24 40,25 60,18 80,20 100,12 120,13 140,6"
            fill="none"
            stroke="var(--series-1)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="140" cy="6" r="3" fill="var(--series-1)" stroke="var(--card)" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-card p-2.5">
          <p className="text-[9px] font-bold text-muted">🛍️ 화이트티글</p>
          <p className="text-sm font-bold">₩1,214,000</p>
        </div>
        <div className="rounded-xl bg-card p-2.5">
          <p className="text-[9px] font-bold text-muted">🎬 숏츠 수익</p>
          <p className="text-sm font-bold">₩628,000</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- 14 세로 타임라인 피드 ---------- */

function TimelineMock() {
  const events = [
    { t: "09:12", txt: "팔도별미 · 도메인 연결 완료", p: SP[2] },
    { t: "11:00", txt: "매일11시 · 정기 업로드 발행", p: SP[3] },
    { t: "14:30", txt: "화이트티글 · 신상 10종 등록", p: SP[0] },
    { t: "18:45", txt: "숏츠 · 대본 5개 자동 생성", p: SP[1] },
  ];
  return (
    <div className="flex h-full items-center">
      <div className="relative ml-14 flex flex-col gap-3 border-l-2 border-line py-1 pl-4">
        {events.map((e) => (
          <div key={e.t} className="relative">
            <span
              className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-[var(--card)]"
              style={{ background: e.p.color }}
            />
            <span className="absolute -left-14 top-0.5 text-[9px] font-bold tabular-nums text-muted">
              {e.t}
            </span>
            <p className="text-[11px] font-semibold leading-tight">{e.txt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 15 포모도로 타이머 ---------- */

function PomodoroMock() {
  const TOTAL = 25 * 60;
  const [left, setLeft] = useState(17 * 60 + 42);
  const [run, setRun] = useState(false);
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => setLeft((l) => (l > 0 ? l - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [run]);
  const C = 2 * Math.PI * 44;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <div className="relative">
        <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--card-2)" strokeWidth="7" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - left / TOTAL)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums">
            {mm}:{ss}
          </span>
          <span className="text-[9px] text-muted">숏츠 편집 집중</span>
        </div>
      </div>
      <button
        onClick={() => setRun((r) => !r)}
        className="btn btn-primary px-4 py-1.5 text-xs"
      >
        {run ? "⏸ 잠깐 쉬기" : "▶ 집중 시작"}
      </button>
    </div>
  );
}

/* ---------- 16 주간 회고 카드 ---------- */

function ReviewMock() {
  const [mood, setMood] = useState(3);
  const moods = ["😫", "😐", "🙂", "😄", "🤩"];
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <p className="font-display text-center text-sm">이번 주, 어땠어요?</p>
      <div className="flex justify-center gap-2">
        {moods.map((m, i) => (
          <button
            key={m}
            onClick={() => setMood(i)}
            className={`pressable grid h-10 w-10 place-items-center rounded-full text-xl transition-transform ${
              mood === i
                ? "scale-110 bg-accent-soft ring-2 ring-[var(--accent)]"
                : "bg-card"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["완료", "12", "--st-good"],
          ["새 할 일", "5", "--series-1"],
          ["미룸", "3", "--st-serious"],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded-xl bg-card py-2">
            <p className="text-lg font-bold" style={{ color: `var(${c})` }}>
              {v}
            </p>
            <p className="text-[9px] font-bold text-muted">{k}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-[10px] text-muted">
        일요일 밤마다 자동으로 물어봐 줘요
      </p>
    </div>
  );
}

/* ---------- 17 레이싱 트랙 ---------- */

function RaceMock() {
  const racers = [SP[2], SP[0], SP[1]];
  return (
    <div className="flex h-full flex-col justify-center gap-1">
      <p className="mb-1 text-center text-[10px] font-bold text-muted">
        🏁 이번 분기 완주 레이스
      </p>
      {racers.map((p, i) => (
        <div key={p.name} className="relative h-11 border-b-2 border-dashed border-line">
          <span className="absolute left-1 top-1 text-[9px] font-bold text-muted">
            {i + 1}위 {p.name}
          </span>
          <div
            className="absolute bottom-1 flex h-6 w-6 items-center justify-center rounded-full font-display text-xs text-white transition-all hover:scale-110"
            style={{
              left: `calc(${p.pct}% - 24px)`,
              background: p.color,
            }}
          >
            {p.letter}
          </div>
          <span className="absolute bottom-1.5 right-0 text-sm">🏁</span>
        </div>
      ))}
      <p className="mt-1.5 text-center text-[10px] text-muted">
        진행률 = 트랙 위치 — 꼴찌가 분발하게 되는 마법
      </p>
    </div>
  );
}

/* ---------- 18 산 등반 지도 ---------- */

function MountainMock() {
  return (
    <div className="grid h-full place-items-center">
      <svg viewBox="0 0 240 130" className="w-full max-w-72">
        <path
          d="M0,120 L70,30 L100,70 L150,15 L190,75 L240,120 Z"
          fill="color-mix(in oklab, var(--series-1) 18%, transparent)"
          stroke="var(--series-1)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <text x="150" y="10" textAnchor="middle" fontSize="11">🏔️</text>
        <text x="150" y="34" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--ink-2)">출시 (정상)</text>
        {[
          { x: 52, y: 55, l: "팔 88%" },
          { x: 96, y: 74, l: "화 72%" },
          { x: 178, y: 88, l: "숏 45%" },
        ].map((f) => (
          <g key={f.l}>
            <text x={f.x} y={f.y} textAnchor="middle" fontSize="12">🚩</text>
            <text x={f.x} y={f.y + 12} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="var(--ink-2)">
              {f.l}
            </text>
          </g>
        ))}
        <text x="120" y="127" textAnchor="middle" fontSize="9" fill="var(--muted)">
          높이 오를수록 출시가 가까워요
        </text>
      </svg>
    </div>
  );
}

/* ---------- 19 별자리 맵 ---------- */

function ConstellationMock() {
  const stars = [
    { x: 20, y: 30, r: 3.5, n: "화이트티글" },
    { x: 45, y: 18, r: 2 },
    { x: 70, y: 35, r: 4, n: "매일11시" },
    { x: 55, y: 62, r: 2.5 },
    { x: 30, y: 75, r: 3, n: "팔도별미" },
    { x: 82, y: 68, r: 2 },
  ];
  return (
    <div
      className="relative h-full overflow-hidden rounded-xl"
      style={{
        background:
          "radial-gradient(circle at 60% 30%, #2a2f4a 0%, #151827 70%)",
      }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
        <polyline
          points="20,30 45,18 70,35 55,62 30,75 82,68"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.6"
          strokeDasharray="2 2"
        />
        {stars.map((s, i) => (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity="0.95">
              <animate
                attributeName="opacity"
                values="0.95;0.4;0.95"
                dur={`${2 + i * 0.7}s`}
                repeatCount="indefinite"
              />
            </circle>
            {s.n && (
              <text x={s.x} y={s.y + 9} textAnchor="middle" fontSize="4.5" fill="rgba(255,255,255,0.75)">
                {s.n}
              </text>
            )}
          </g>
        ))}
      </svg>
      <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/60">
        연관 프로젝트끼리 별자리로 — 밝기 = 최근 활동량 ✨
      </p>
    </div>
  );
}

/* ---------- 20 워크로드 밸런스 ---------- */

function WorkloadMock() {
  const rows = [
    { p: SP[0], seg: [45, 30, 25] },
    { p: SP[1], seg: [20, 65, 15] },
    { p: SP[2], seg: [30, 25, 45] },
  ];
  const legend = ["기획", "제작", "마케팅"];
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex justify-center gap-3">
        {legend.map((l, i) => (
          <span key={l} className="flex items-center gap-1 text-[10px] font-bold text-ink-2">
            <span
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ background: `var(--series-${i + 1})` }}
            />
            {l}
          </span>
        ))}
      </div>
      {rows.map(({ p, seg }) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-8 shrink-0 text-[10px] font-bold text-ink-2">
            {p.letter}
          </span>
          <div className="flex h-5 flex-1 gap-0.5">
            {seg.map((w, i) => (
              <div
                key={i}
                className={`${i === 0 ? "rounded-l-md" : ""} ${i === seg.length - 1 ? "rounded-r-md" : ""}`}
                style={{ width: `${w}%`, background: `var(--series-${i + 1})` }}
                title={`${legend[i]} ${w}%`}
              />
            ))}
          </div>
        </div>
      ))}
      <p className="text-center text-[10px] text-muted">
        어디에 시간이 쏠리는지 — 제작만 하다 마케팅을 놓치지 않게
      </p>
    </div>
  );
}

/* ---------- 페이지 ---------- */

const CONCEPTS: {
  title: string;
  desc: string;
  tags: string[];
  comp: () => ReactNode;
}[] = [
  {
    title: "간트 타임라인",
    desc: "프로젝트 기간을 가로 막대로 겹쳐 보기. 오늘 선을 기준으로 밀린 일정과 겹치는 마감이 즉시 드러나요.",
    tags: ["일정", "큰그림"],
    comp: GanttMock,
  },
  {
    title: "잔디 히트맵",
    desc: "깃허브 잔디처럼 하루하루의 완료량을 초록… 아니 파랑 농도로. 빈칸이 보이면 채우고 싶어지는 심리 자극형.",
    tags: ["습관", "동기부여"],
    comp: HeatmapMock,
  },
  {
    title: "지하철 노선도",
    desc: "각 프로젝트를 노선으로, 단계를 역으로. 환승역(공유 단계)에서 프로젝트끼리 만나는 게 포인트.",
    tags: ["플로우", "재미"],
    comp: MetroMock,
  },
  {
    title: "정원 대시보드",
    desc: "프로젝트가 식물로 자라요. 진행률이 오르면 새싹→나무, 오래 방치하면 시들시들. 죄책감 마케팅의 정수.",
    tags: ["게이미피케이션", "귀여움"],
    comp: GardenMock,
  },
  {
    title: "버블 맵",
    desc: "남은 할 일이 많을수록 큰 풍선. 어떤 프로젝트가 비대해졌는지 면적으로 직감하고, 터뜨리러(=처리하러) 갑니다.",
    tags: ["우선순위", "직관"],
    comp: BubbleMock,
  },
  {
    title: "레이더 건강도",
    desc: "진행·긴급·활동·수익·재미 5축으로 프로젝트 체질 검사. 찌그러진 축이 그 프로젝트의 약점이에요.",
    tags: ["진단", "밸런스"],
    comp: RadarMock,
  },
  {
    title: "포커스 모드",
    desc: "오늘은 딱 3개만. 나머지는 아예 안 보여줘서 결정 피로를 없애는 미니멀 모드. 체크해 보세요, 지금!",
    tags: ["집중", "미니멀"],
    comp: FocusMock,
  },
  {
    title: "스탠드업 카드",
    desc: "어제 한 일 / 오늘 할 일 / 막힌 것. 1인 사업가에게도 데일리 스탠드업은 유효합니다. 아침에 카드 한 장 쓰기.",
    tags: ["루틴", "회고"],
    comp: StandupMock,
  },
  {
    title: "배터리 진행률",
    desc: "프로젝트 잔량을 배터리로. 빨간 방전 직전 프로젝트가 눈에 밟혀서 충전(작업)하러 가게 됩니다.",
    tags: ["직관", "재미"],
    comp: BatteryMock,
  },
  {
    title: "OKR 트리",
    desc: "큰 목표(O) 아래 측정 가능한 결과(KR)를 매달기. 할 일이 '왜' 존재하는지 목표와 연결해 주는 구조.",
    tags: ["목표", "전략"],
    comp: OkrMock,
  },
  {
    title: "퍼널 파이프라인",
    desc: "아이디어→검증→제작→출시→수익화. 단계별 생존 개수로 내 사업 전환율을 측정하는 냉정한 깔때기.",
    tags: ["지표", "사업"],
    comp: FunnelMock,
  },
  {
    title: "스트릭 트래커",
    desc: "하루 1개라도 완료하면 불꽃 유지. 듀오링고가 증명한 그 중독성을 프로젝트 관리에 이식합니다.",
    tags: ["습관", "중독성"],
    comp: StreakMock,
  },
  {
    title: "수익 위젯",
    desc: "결국 부업의 목적은 수익. 프로젝트별 매출과 추세선을 첫 화면에. 숫자가 오르는 걸 보는 게 최고의 동기부여.",
    tags: ["수익", "지표"],
    comp: RevenueMock,
  },
  {
    title: "오늘의 타임라인",
    desc: "오늘 일어난 모든 프로젝트 이벤트를 시간순 세로 피드로. 하루를 마감하며 스크롤 한 번이면 회고 끝.",
    tags: ["기록", "회고"],
    comp: TimelineMock,
  },
  {
    title: "포모도로 타이머",
    desc: "할 일을 골라 25분 집중. 진짜 돌아가는 타이머예요 — ▶ 눌러보세요. 완료된 뽀모도로가 할 일에 🍅로 쌓입니다.",
    tags: ["집중", "실행"],
    comp: PomodoroMock,
  },
  {
    title: "주간 회고 카드",
    desc: "일요일 밤, 이모지 하나로 한 주를 평가하고 통계를 받아보기. 기분 기록이 쌓이면 번아웃 조기 경보가 돼요.",
    tags: ["회고", "웰빙"],
    comp: ReviewMock,
  },
  {
    title: "레이싱 트랙",
    desc: "프로젝트들이 완주(100%)를 향해 달리는 경주. 순위가 붙는 순간 묘하게 승부욕이 생깁니다.",
    tags: ["게이미피케이션", "진행률"],
    comp: RaceMock,
  },
  {
    title: "산 등반 지도",
    desc: "출시라는 정상을 향해 오르는 등반 지도. 내 깃발이 어느 고도에 있는지, 다음 캠프(마일스톤)는 어디인지.",
    tags: ["마일스톤", "스토리"],
    comp: MountainMock,
  },
  {
    title: "별자리 맵",
    desc: "연관 프로젝트끼리 선으로 이어 별자리로. 밝게 깜빡이는 별이 요즘 활발한 프로젝트. 밤하늘 감성 대시보드.",
    tags: ["관계도", "감성"],
    comp: ConstellationMock,
  },
  {
    title: "워크로드 밸런스",
    desc: "프로젝트마다 기획/제작/마케팅에 시간이 어떻게 쏠리는지 누적 막대로. 만들기만 하고 안 파는 병을 조기 발견.",
    tags: ["밸런스", "시간관리"],
    comp: WorkloadMock,
  },
];

export default function IdeasPage() {
  return (
    <div className="rise flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">아이디어 랩 💡</h1>
        <p className="mt-1 text-sm text-muted">
          프로젝트 관리 UI 콘셉트 20선 — 전부 만질 수 있는 미니 목업이에요.
          마음에 드는 번호를 말해주면 실제 데이터와 연결해 진짜 탭으로
          만들어 드립니다!
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {CONCEPTS.map((c, i) => (
          <Frame key={c.title} n={i + 1} title={c.title} desc={c.desc} tags={c.tags}>
            <c.comp />
          </Frame>
        ))}
      </div>

      <p className="pb-4 text-center text-xs text-muted">
        ✨ 조합도 가능해요 — 예: 대시보드 상단엔 12번 스트릭, 프로젝트 카드엔
        9번 배터리, 일요일엔 16번 회고 팝업
      </p>
    </div>
  );
}
