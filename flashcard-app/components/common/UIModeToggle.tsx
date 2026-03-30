"use client";

import { useUIStore } from "@/features/auth/store";
import { cn } from "@/lib/utils";

export function UIModeToggle() {
  const { mode, toggleMode } = useUIStore();
  const isKid = mode === "kid";

  return (
    <button
      onClick={toggleMode}
      aria-label={isKid ? "Chuyển về Standard mode" : "Chuyển sang Kid mode"}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all",
        isKid
          ? "kid-mode-btn"
          : "bg-brand-light border-brand-mid text-brand hover:bg-brand-mid"
      )}
    >
      {isKid ? "🎨 Kid" : "📚 Standard"}
    </button>
  );
}
