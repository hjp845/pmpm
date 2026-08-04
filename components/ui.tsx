"use client";

import { useEffect, type ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  emoji,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  emoji?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`modal-panel card max-h-[88vh] w-full overflow-y-auto p-6 ${wide ? "max-w-2xl" : "max-w-md"}`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display flex items-center gap-2 text-xl">
            {emoji && <span className="wiggle-hover text-2xl">{emoji}</span>}
            {title}
          </h2>
          <button
            onClick={onClose}
            className="pressable grid h-8 w-8 place-items-center rounded-full text-ink-2 hover:bg-card-2"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  message,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title="정말 삭제할까요?" emoji="🥺">
      <p className="mb-5 text-sm text-ink-2">{message}</p>
      <div className="flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={onClose}>
          취소
        </button>
        <button
          className="btn btn-danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          삭제하기
        </button>
      </div>
    </Modal>
  );
}

export function EmptyState({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="rise flex flex-col items-center gap-2 py-14 text-center">
      <span className="text-5xl">{emoji}</span>
      <p className="font-display mt-2 text-lg">{title}</p>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

// 프로젝트 아이콘: 업로드 이미지 > 이모지 > 이름 첫 글자 모노그램
export function Icon({
  emoji,
  icon,
  className = "",
}: {
  emoji: string;
  icon?: string | null;
  className?: string;
}) {
  if (!icon) {
    const isLetter =
      !!emoji && !/\p{Extended_Pictographic}/u.test(emoji);
    return isLetter ? (
      <span className="font-display leading-none">{emoji}</span>
    ) : (
      <>{emoji}</>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={icon}
      alt=""
      draggable={false}
      className={`inline-block h-[1.25em] w-[1.25em] rounded-[0.3em] object-cover align-[-0.2em] ${className}`}
    />
  );
}

// 이름에서 아이콘용 첫 글자 추출 (서로게이트 안전)
export function firstLetter(name: string): string {
  const ch = Array.from(name.trim())[0] ?? "✨";
  return ch.toUpperCase();
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <span className="animate-bounce text-3xl">🐻</span>
    </div>
  );
}
