import type { Metadata } from "next";
import { Jua, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { ToastProvider } from "@/components/Toast";
import { PageContainer } from "@/components/PageContainer";

const jua = Jua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-jua",
});

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "모아모아 — 내 모든 프로젝트를 한눈에",
  description: "여러 비즈니스와 프로젝트를 귀엽고 전문적으로 관리하는 대시보드",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧸</text></svg>",
  },
};

const themeInit = `(function(){try{var t=localStorage.getItem("moamoa-theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${jua.variable} ${noto.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full">
        <ToastProvider>
          <Sidebar />
          <MobileNav />
          <CommandPalette />
          <main className="md:ml-60">
            <PageContainer>{children}</PageContainer>
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
