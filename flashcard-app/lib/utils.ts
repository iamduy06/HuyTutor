import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FlashcardUnit, FlashcardRow, VocabItem } from "@/types";

// ─── Tailwind ──────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Misc ──────────────────────────────────────────────────────────────────

export function generatePassword(length = 8): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function isExpired(expiredAt: string | null): boolean {
  if (!expiredAt) return true;
  return new Date(expiredAt) <= new Date();
}

export function getCefrColor(cefr: string): string {
  const map: Record<string, string> = {
    A1: "bg-green-100 text-green-800",
    A2: "bg-blue-100 text-blue-800",
    B1: "bg-yellow-100 text-yellow-800",
    B2: "bg-orange-100 text-orange-800",
    C1: "bg-purple-100 text-purple-800",
    C2: "bg-red-100 text-red-800",
  };
  return map[cefr] ?? "bg-gray-100 text-gray-700";
}

// ─── JSONB normalisation ───────────────────────────────────────────────────

/**
 * Normalise a raw JSONB content value to always-array of FlashcardUnit.
 * Handles:
 *   CASE A  { id, label, vocabulary: [...] }
 *   CASE B  [{ id, label, vocabulary: [...] }, ...]
 */
export function normaliseUnits(raw: FlashcardUnit | FlashcardUnit[]): FlashcardUnit[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return [raw];
}

/**
 * Extract all VocabItems from a single FlashcardRow.
 */
export function extractVocab(row: FlashcardRow): VocabItem[] {
  return normaliseUnits(row.content).flatMap((u) => u.vocabulary ?? []);
}

/**
 * Count total vocabulary words across all units in a row.
 */
export function countWords(row: FlashcardRow): number {
  return extractVocab(row).length;
}

/**
 * Normalise synonyms/antonyms: comma-string OR array → string[]
 */
export function toArray(val: string | string[] | undefined | null): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}
