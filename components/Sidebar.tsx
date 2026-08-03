"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useSettings, api, refresh, fileToIconDataUrl } from "@/lib/hooks";
import { useToast } from "./Toast";

const NAV = [
  { href: "/overview", label: "한눈에", emoji: "👀" },
  { href: "/", label: "대시보드", emoji: "🏠" },
  { href: "/projects", label: "프로젝트", emoji: "📁" },
  { href: "/board", label: "칸반보드", emoji: "📋" },
  { href: "/calendar", label: "캘린더", emoji: "🗓️" },
  { href: "/notes", label: "메모", emoji: "📝" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: settings } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const logo = settings?.logo;

  const uploadLogo = async (f: File) => {
    try {
      const url = await fileToIconDataUrl(f, 128);
      await api("PATCH", "/api/settings", { key: "logo", value: url });
      refresh("/api/settings");
      toast("로고를 교체했어요!", "🎨");
    } catch {
      toast("이미지를 읽을 수 없어요 🥲", "⚠️");
    }
  };

  const resetLogo = async () => {
    await api("PATCH", "/api/settings", { key: "logo", value: null });
    refresh("/api/settings");
    toast("기본 로고로 돌아왔어요", "🧸");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-card/70 p-4 backdrop-blur-xl md:flex">
      <div className="group/logo mb-8 flex items-center gap-2.5 px-2 pt-2">
        <button
          onClick={() => fileRef.current?.click()}
          title="클릭해서 로고 이미지 교체"
          className="pressable relative shrink-0"
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt="로고"
              className="h-10 w-10 rounded-2xl object-cover shadow-sm"
            />
          ) : (
            <span className="wiggle-hover block text-3xl">🧸</span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) uploadLogo(f);
          }}
        />
        <Link href="/overview" className="min-w-0">
          <div className="font-display bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-2xl text-transparent">
            모아모아
          </div>
          <div className="text-[11px] font-medium text-muted">
            내 모든 프로젝트를 한눈에
          </div>
        </Link>
        {logo && (
          <button
            onClick={resetLogo}
            title="기본 로고로"
            className="pressable ml-auto hidden h-6 w-6 place-items-center rounded-full text-[11px] text-muted hover:bg-card-2 group-hover/logo:grid"
          >
            ↩️
          </button>
        )}
      </div>

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
