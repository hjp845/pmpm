"use client";

import { useState } from "react";

/* ---------- Donut: project status distribution ---------- */

export interface DonutSlice {
  label: string;
  value: number;
  colorVar: string; // CSS var name, e.g. "--series-1"
}

export function DonutChart({
  slices,
  centerLabel,
}: {
  slices: DonutSlice[];
  centerLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = slices.reduce((s, d) => s + d.value, 0);
  const R = 56;
  const STROKE = 18;
  const C = 2 * Math.PI * R;
  const GAP = total > 0 ? 2.5 : 0; // px gap between segments on the circumference

  let offset = 0;
  const segs = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const frac = s.value / total;
      const len = Math.max(frac * C - GAP, 0.5);
      const seg = { ...s, frac, dash: `${len} ${C - len}`, offset };
      offset -= frac * C;
      return seg;
    });

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label={`상태별 프로젝트 분포, 총 ${total}개`}>
          <circle
            cx="75"
            cy="75"
            r={R}
            fill="none"
            stroke="var(--card-2)"
            strokeWidth={STROKE}
          />
          {segs.map((s, i) => (
            <circle
              key={s.label}
              cx="75"
              cy="75"
              r={R}
              fill="none"
              stroke={`var(${s.colorVar})`}
              strokeWidth={hover === i ? STROKE + 4 : STROKE}
              strokeDasharray={s.dash}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
              transform="rotate(-90 75 75)"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ transition: "stroke-width .15s ease", cursor: "pointer" }}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {hover !== null && segs[hover] ? (
            <>
              <span className="text-2xl font-bold">{segs[hover].value}</span>
              <span className="text-[11px] font-medium text-ink-2">
                {segs[hover].label} · {Math.round(segs[hover].frac * 100)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold">{total}</span>
              <span className="text-[11px] font-medium text-ink-2">
                {centerLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* legend with direct value labels */}
      <ul className="flex flex-col gap-2">
        {slices.map((s) => (
          <li
            key={s.label}
            className="flex items-center gap-2 text-sm"
            onMouseEnter={() => {
              const idx = segs.findIndex((g) => g.label === s.label);
              setHover(idx >= 0 ? idx : null);
            }}
            onMouseLeave={() => setHover(null)}
          >
            <span
              className="h-3 w-3 rounded-[4px]"
              style={{ background: `var(${s.colorVar})` }}
            />
            <span className="text-ink-2">{s.label}</span>
            <span className="ml-1 font-bold tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Weekly bars: tasks completed per day (single series) ---------- */

export function WeekBars({
  data,
}: {
  data: { day: string; value: number; isToday: boolean }[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 280;
  const H = 120;
  const PAD_TOP = 16;
  const PAD_BOTTOM = 22;
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const bw = 22;
  const step = W / data.length;
  const maxIdx = data.reduce((mi, d, i) => (d.value > data[mi].value ? i : mi), 0);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="최근 7일 완료한 할 일 수"
      className="max-w-[320px]"
    >
      {/* hairline gridlines */}
      {[0.5, 1].map((f) => (
        <line
          key={f}
          x1="0"
          x2={W}
          y1={PAD_TOP + plotH * (1 - f)}
          y2={PAD_TOP + plotH * (1 - f)}
          stroke="var(--grid)"
          strokeWidth="1"
        />
      ))}
      <line
        x1="0"
        x2={W}
        y1={PAD_TOP + plotH}
        y2={PAD_TOP + plotH}
        stroke="var(--grid)"
        strokeWidth="1.5"
      />
      {data.map((d, i) => {
        const h = d.value === 0 ? 3 : (d.value / max) * plotH;
        const x = i * step + (step - bw) / 2;
        const y = PAD_TOP + plotH - h;
        const showLabel = hover === i || (hover === null && i === maxIdx && d.value > 0);
        return (
          <g
            key={d.day}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: "pointer" }}
          >
            {/* hit target bigger than the mark */}
            <rect x={i * step} y="0" width={step} height={H} fill="transparent" />
            <rect
              x={x}
              y={y}
              width={bw}
              height={h}
              rx="4"
              fill={d.value === 0 ? "var(--card-2)" : "var(--series-1)"}
              opacity={hover === null || hover === i ? 1 : 0.45}
              style={{ transition: "opacity .15s ease" }}
            />
            {/* square off the bottom corners: bars sit on the baseline */}
            {h > 4 && d.value > 0 && (
              <rect x={x} y={PAD_TOP + plotH - 4} width={bw} height={4} fill="var(--series-1)" opacity={hover === null || hover === i ? 1 : 0.45} style={{ transition: "opacity .15s ease" }} />
            )}
            {showLabel && (
              <text
                x={x + bw / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="var(--ink)"
              >
                {d.value}
              </text>
            )}
            <text
              x={x + bw / 2}
              y={H - 6}
              textAnchor="middle"
              fontSize="10"
              fontWeight={d.isToday ? 800 : 500}
              fill={d.isToday ? "var(--accent)" : "var(--muted)"}
            >
              {d.day}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
