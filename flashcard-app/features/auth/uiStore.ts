import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UIMode } from "@/types";

interface UIStore {
  mode: UIMode;
  toggle: () => void;
  setMode: (m: UIMode) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      mode: "standard",
      toggle: () => set({ mode: get().mode === "standard" ? "kid" : "standard" }),
      setMode: (mode) => set({ mode }),
    }),
    { name: "huytutor-ui-mode" }
  )
);
