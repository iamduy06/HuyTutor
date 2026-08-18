"use client";

import { cn } from "@/lib/utils";

interface ProgressProps {
  current: number;
  total: number;
  className?: string;
}

export function Progress({ current, total, className }: ProgressProps) {
  const percent = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;

  return (
    <div className={cn("flex flex-col items-center gap-2 w-full", className)}>
      {/* Counter */}
      <div className="text-[#495057] text-base font-semibold">
        Thẻ {current + 1} / {total}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md h-2 bg-[#f0e0e7] rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Percent label */}
      <div className="text-xs text-muted-foreground font-medium">
        {percent}% hoàn thành
      </div>
    </div>
  );
}
