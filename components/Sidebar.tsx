"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/", label: "대시보드", emoji: "🏠" },
  { href: "/projects", label: "프로젝트", emoji: "📁" },
  { href: "/board", label: "칸반보드", emoji: "📋" },
  { href: "/calendar", label: "캘린더", emoji: "🗓️" },
  { href: "/notes", label: "메모", emoji: "📝" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-card/70 p-4 backdrop-blur-xl md:flex">
      <Link
        href="/"
        className="group/logo mb-8 flex items-center gap-2.5 px-2 pt-2"
      >
        <span className="wiggle-hover text-3xl">🧸</span>
        <div>
          <div className="font-display bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-2xl text-transparent">
            모아모아
          </div>
          <div className="text-[11px] font-medium text-muted">
            내 모든 프로젝트를 한눈에
          </div>
        </div>
      </Link>

      <nav className="flex flex-col gap-1.5">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`pressable flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-accent-soft text-accent shadow-sm"
                  : "text-ink-2 hover:bg-card-2 hover:text-ink"
              }`}
            >
              <span className="text-lg">{item.emoji}</span>
              {item.label}
              {active && (
                <span className="ml-auto h-2 w-2 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1.5">
        <div className="mx-2 mb-1 rounded-2xl bg-accent-soft/60 px-4 py-3 text-xs text-ink-2">
          <span className="font-bold text-accent">⌘K / Ctrl+K</span> 를 눌러
          어디로든 순간이동! 🪄
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-card/85 px-2 py-2 backdrop-blur-xl md:hidden">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`pressable flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[10px] font-semibold ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            <span className="text-xl">{item.emoji}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
