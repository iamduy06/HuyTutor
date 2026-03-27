import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UIMode, UIStore } from "@/types";

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      mode: "standard" as UIMode,
      setMode: (mode) => set({ mode }),
      toggleMode: () =>
        set({ mode: get().mode === "standard" ? "kid" : "standard" }),
    }),
    { name: "ui-mode" }
  )
);
