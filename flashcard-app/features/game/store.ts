import { create } from "zustand";
import type { VocabItem } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GameType = "listening" | "multiple-choice" | "matching" | "syn-ant";

export interface AnswerRecord {
  userAnswer: string;
  isCorrect: boolean;
}

interface GameStore {
  // ── Config ──
  selectedDeckId: string | null;   // null = "all"
  selectedTabIds: string[];        // [] = "all tabs of the deck"
  gameType: GameType | null;
  pairCount: number;               // số cặp cho Matching/SynAnt (5–20)
  questionCount: number;           // số câu cho Listening/MC (5–30)

  // ── Session ──
  questions: VocabItem[];
  currentIndex: number;
  score: number;
  answers: Record<number, AnswerRecord>;
  isFinished: boolean;
  isStarted: boolean;

  // ── Actions ──
  setDeck: (deckId: string | null) => void;
  setSelectedTabIds: (tabIds: string[]) => void;
  toggleTab: (tabId: string) => void;
  setGameType: (type: GameType) => void;
  setPairCount: (n: number) => void;
  setQuestionCount: (n: number) => void;
  startGame: (questions: VocabItem[]) => void;
  submitAnswer: (index: number, userAnswer: string, isCorrect: boolean) => void;
  nextQuestion: () => void;
  finishGame: () => void;
  resetGame: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  // Config defaults
  selectedDeckId: null,
  selectedTabIds: [],
  gameType: null,
  pairCount: 5,
  questionCount: 10,

  // Session defaults
  questions: [],
  currentIndex: 0,
  score: 0,
  answers: {},
  isFinished: false,
  isStarted: false,

  // Actions
  setDeck: (deckId) => set({ selectedDeckId: deckId, selectedTabIds: [] }),
  setSelectedTabIds: (tabIds) => set({ selectedTabIds: tabIds }),
  toggleTab: (tabId) => set(state => {
    const isSelected = state.selectedTabIds.includes(tabId);
    if (isSelected) {
      return { selectedTabIds: state.selectedTabIds.filter(id => id !== tabId) };
    } else {
      return { selectedTabIds: [...state.selectedTabIds, tabId] };
    }
  }),
  setGameType: (type) => set({ gameType: type }),
  setPairCount: (n) => set({ pairCount: Math.min(Math.max(n, 5), 20) }),
  setQuestionCount: (n) => set({ questionCount: Math.min(Math.max(n, 5), 30) }),

  startGame: (questions) => set({
    questions,
    currentIndex: 0,
    score: 0,
    answers: {},
    isFinished: false,
    isStarted: true,
  }),

  submitAnswer: (index, userAnswer, isCorrect) => set(state => ({
    score: isCorrect ? state.score + 1 : state.score,
    answers: {
      ...state.answers,
      [index]: { userAnswer, isCorrect },
    },
  })),

  nextQuestion: () => set(state => {
    const next = state.currentIndex + 1;
    if (next >= state.questions.length) {
      return { isFinished: true, currentIndex: next };
    }
    return { currentIndex: next };
  }),

  finishGame: () => set({ isFinished: true }),

  resetGame: () => set({
    questions: [],
    currentIndex: 0,
    score: 0,
    answers: {},
    isFinished: false,
    isStarted: false,
  }),
}));
