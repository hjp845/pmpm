"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<string>("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "light");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("moamoa-theme", next);
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      className="pressable flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-ink-2 hover:bg-card-2"
      aria-label="테마 전환"
    >
      <span className="text-lg">{theme === "dark" ? "🌙" : "☀️"}</span>
      {theme === "dark" ? "다크 모드" : "라이트 모드"}
    </button>
  );
}
