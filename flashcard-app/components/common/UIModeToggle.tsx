"use client";

import { useUIStore } from "@/features/auth/store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function UIModeToggle() {
  const { mode, toggleMode } = useUIStore();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm hidden sm:inline">🎓</span>
      <Switch
        id="ui-mode"
        checked={mode === "kid"}
        onCheckedChange={toggleMode}
      />
      <Label htmlFor="ui-mode" className="text-sm cursor-pointer hidden sm:inline">
        {mode === "kid" ? "🎨 Kid" : "📚 Standard"}
      </Label>
    </div>
  );
}
