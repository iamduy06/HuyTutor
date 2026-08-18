"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ControlsProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  onJump?: (index: number) => void;
  total: number;
  className?: string;
}

export function Controls({
  onPrev,
  onNext,
  canPrev,
  canNext,
  onJump,
  total,
  className,
}: ControlsProps) {
  function handleJump(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    if (!isNaN(val) && val >= 1 && val <= total) {
      onJump?.(val - 1);
      (e.target as HTMLInputElement).value = "";
    }
  }

  function handleJumpClick(input: HTMLInputElement | null) {
    if (!input) return;
    const val = parseInt(input.value, 10);
    if (!isNaN(val) && val >= 1 && val <= total) {
      onJump?.(val - 1);
      input.value = "";
    }
  }

  let jumpInputRef: HTMLInputElement | null = null;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Prev / Next */}
      <div className="flex items-center gap-4">
        <Button
          variant="brand"
          size="pill"
          onClick={onPrev}
          disabled={!canPrev}
          className="disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
          Trước
        </Button>

        <Button
          variant="brand"
          size="pill"
          onClick={onNext}
          disabled={!canNext}
          className="disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Tiếp
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Jump to card */}
      {onJump && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <label className="text-[#495057] font-semibold text-sm">
            Đi đến thẻ:
          </label>
          <input
            ref={(el) => { jumpInputRef = el; }}
            type="number"
            min={1}
            max={total}
            placeholder="..."
            onKeyDown={handleJump}
            className="w-16 px-3 py-2 border-2 border-brand rounded-lg text-sm font-semibold text-center text-brand outline-none focus:ring-2 focus:ring-brand/30"
          />
          <Button
            variant="brand"
            size="sm"
            onClick={() => handleJumpClick(jumpInputRef)}
          >
            Đi
          </Button>
        </div>
      )}

      <p className="text-muted-foreground text-sm">
        💡 Nhấn vào thẻ để lật
      </p>
    </div>
  );
}
