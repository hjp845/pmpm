"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const fullBleed = pathname === "/overview";
  return (
    <div
      className={`mx-auto px-4 pb-24 pt-6 md:pb-10 lg:px-8 ${
        fullBleed ? "max-w-[1900px]" : "max-w-6xl"
      }`}
    >
      {children}
    </div>
  );
}
