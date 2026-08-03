"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProjects } from "@/lib/hooks";

const PAGES = [
  { href: "/overview", label: "한눈에", emoji: "👀" },
  { href: "/", label: "대시보드", emoji: "🏠" },
  { href: "/projects", label: "프로젝트", emoji: "📁" },
  { href: "/board", label: "칸반보드", emoji: "📋" },
  { href: "/calendar", label: "캘린더", emoji: "🗓️" },
  { href: "/notes", label: "메모", emoji: "📝" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: projects } = useProjects();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setCursor(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = PAGES.filter((p) => !q || p.label.toLowerCase().includes(q));
    const projs = (projects ?? [])
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .slice(0, 6)
      .map((p) => ({
        href: `/projects?q=${encodeURIComponent(p.name)}`,
        label: p.name,
        emoji: p.emoji,
      }));
    return [...pages, ...projs];
  }, [query, projects]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  if (!open) return null;
  return (
    <div
      className="modal-backdrop fixed inset-0 z-[90] flex items-start justify-center bg-black/40 p-4 pt-[18vh] backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="modal-panel card w-full max-w-lg overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="text-lg">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, items.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              }
              if (e.key === "Enter" && items[cursor]) go(items[cursor].href);
            }}
            placeholder="페이지나 프로젝트 이름을 검색해 보세요…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
          <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[10px] text-muted">
            ESC
          </kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {items.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted">
              앗, 검색 결과가 없어요 🥲
            </li>
          )}
          {items.map((item, i) => (
            <li key={`${item.href}-${item.label}`}>
              <button
                onClick={() => go(item.href)}
                onMouseEnter={() => setCursor(i)}
                className={`pressable flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium ${
                  i === cursor ? "bg-accent-soft text-accent" : "text-ink-2"
                }`}
              >
                <span className="text-lg">{item.emoji}</span>
                {item.label}
                {i === cursor && <span className="ml-auto text-xs">↵</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
