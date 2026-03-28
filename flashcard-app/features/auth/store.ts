import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UIMode } from "@/types";

interface UIStore {
  mode: UIMode;
  setMode: (mode: UIMode) => void;
  toggleMode: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      mode: "standard",
      setMode: (mode) => set({ mode }),
      toggleMode: () =>
        set({ mode: get().mode === "standard" ? "kid" : "standard" }),
    }),
    {
      name: "ui-mode",
    }
  )
);

interface SidebarStore {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  setLeftCollapsed: (v: boolean) => void;
  setRightCollapsed: (v: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>()((set) => ({
  leftCollapsed: false,
  rightCollapsed: false,
  setLeftCollapsed: (v) => set({ leftCollapsed: v }),
  setRightCollapsed: (v) => set({ rightCollapsed: v }),
}));
