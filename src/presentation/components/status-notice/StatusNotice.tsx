import type { ReactNode } from "react";

const tones = {
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-stone-200 bg-stone-50 text-stone-800",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
} as const;

export type StatusNoticeTone = keyof typeof tones;

type StatusNoticeProps = {
  tone: StatusNoticeTone;
  role?: "alert" | "status";
  children: ReactNode;
};

export function StatusNotice({ tone, role, children }: StatusNoticeProps) {
  return (
    <div
      role={role}
      className={`rounded-xl border px-3 py-3 text-sm leading-6 ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
