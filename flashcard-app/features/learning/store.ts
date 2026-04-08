import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UIMode } from "@/types";

interface LearningStore {
  currentIndex: number;
  isFlipped: boolean;
  mode: UIMode;
  setCurrentIndex: (index: number) => void;
  setIsFlipped: (flipped: boolean) => void;
  toggleFlipped: () => void;
  setMode: (mode: UIMode) => void;
  toggleMode: () => void;
  reset: () => void;
}

export const useLearningStore = create<LearningStore>()(
  persist(
    (set, get) => ({
      currentIndex: 0,
      isFlipped: false,
      mode: "standard",

      setCurrentIndex: (index) => set({ currentIndex: index, isFlipped: false }),
      setIsFlipped: (flipped) => set({ isFlipped: flipped }),
      toggleFlipped: () => set((s) => ({ isFlipped: !s.isFlipped })),
      setMode: (mode) => set({ mode }),
      toggleMode: () =>
        set((s) => ({ mode: s.mode === "standard" ? "kid" : "standard" })),
      reset: () => set({ currentIndex: 0, isFlipped: false }),
    }),
    {
      name: "learning-ui",
      partialize: (s) => ({ mode: s.mode }),
    }
  )
);
