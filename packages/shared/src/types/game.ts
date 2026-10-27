export type GameType = "listening" | "multiple-choice" | "matching" | "syn-ant";

export interface AnswerRecord {
  userAnswer: string;
  isCorrect: boolean;
}
