"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PaginationControls } from "@/components/common/PaginationControls";
import { hasFullAccess } from "@/lib/utils";
import { FACEBOOK_URL } from "@/lib/constants";

interface DeckCardProps {
  title: string;
  description: string | null;
  accessLevel: any;
  active: boolean;
  words: number;
  streak: number;
  progressPercent: number;
  expiredAt: string | null;
  deckId: string;
  showExpiry: boolean;
  isAssigned: boolean;
}

function DeckCard({
  title,
  description,
  accessLevel,
  active,
  words,
  streak,
  progressPercent,
  expiredAt,
  deckId,
  showExpiry,
  isAssigned,
}: DeckCardProps) {
  const levels = accessLevel ?? {};

  return (
    <div
      className={`bg-white rounded-2xl border-2 p-5 flex flex-col transition-all hover:shadow-md ${
        active ? "border-[#f0e0e7] hover:border-brand" : "border-red-200"
      }`}
    >
      {/* Title + badges */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3
          className="font-bold text-[#1a1a2e] text-sm leading-snug line-clamp-2 flex-1 min-w-0 cursor-default"
          title={title}
        >
          {title}
        </h3>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {isAssigned && levels.paid === true ? (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}
            >
              {active ? "Còn hạn" : "Hết hạn"}
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap">
              🌐 Miễn phí
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 flex-1">
        <div className="text-xs text-muted-foreground flex gap-3">
          <span>📝 {words} từ</span>
          {streak > 0 && <span>🔥 Streak: {streak} ngày</span>}
        </div>

        {progressPercent > 0 && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Tiến độ</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-[#f0e0e7] rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {isAssigned && !active ? (
          <div className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg border border-red-100">
            ⚠️ Đã hết hạn. Vui lòng liên hệ để được hỗ trợ.
          </div>
        ) : (
          <>
            {showExpiry && expiredAt && (
              <div
                className={`text-xs font-medium ${
                  active ? "text-green-600" : "text-red-500"
                }`}
              >
                {active ? "✅" : "⛔"} Hạn:{" "}
                {new Date(expiredAt).toLocaleDateString("vi-VN")}
              </div>
            )}
            {showExpiry && !expiredAt && (
              <div className="text-xs text-green-600 font-medium">
                ♾️ Không giới hạn thời gian
              </div>
            )}
          </>
        )}
      </div>

      {/* Button */}
      <div className="mt-3">
        {active ? (
          <Link
            href={`/learning/${deckId}`}
            className="flex w-full items-center justify-center gap-1 py-2 px-4 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-[#c0003a] transition-colors"
          >
            Học ngay →
          </Link>
        ) : (
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-1 py-2 px-4 rounded-lg border-2 border-[#f0e0e7] text-sm font-semibold hover:border-brand hover:text-brand transition-colors"
          >
            💬 Gia hạn
          </a>
        )}
      </div>
    </div>
  );
}

interface DashboardDeckListProps {
  filteredUserDecks: any[];
  extraPublicDecks: any[];
  wordCountMap: Record<string, number>;
}

export function DashboardDeckList({
  filteredUserDecks,
  extraPublicDecks,
  wordCountMap,
}: DashboardDeckListProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const allDecks = useMemo(() => {
    const list: DeckCardProps[] = [];

    // 1. Assigned decks
    filteredUserDecks.forEach((ud: any) => {
      const deck = ud.deck as any;
      if (!deck) return;
      const expired_at = ud.expired_at as string | null;
      const levels = deck?.access_level ?? {};
      const isFree = levels.public || levels.auth;
      const active = isFree || hasFullAccess(expired_at);
      const words = wordCountMap[ud.deck_id as string] ?? 0;

      list.push({
        title: deck.title,
        description: deck.description,
        accessLevel: deck.access_level,
        active,
        words,
        streak: (ud.streak as number) ?? 0,
        progressPercent: (ud.progress_percent as number) ?? 0,
        expiredAt: isFree ? null : expired_at,
        deckId: deck.id,
        showExpiry: !isFree,
        isAssigned: true,
      });
    });

    // 2. Extra public decks
    (extraPublicDecks ?? []).forEach((deck: any) => {
      list.push({
        title: deck.title,
        description: deck.description,
        accessLevel: deck.access_level,
        active: true,
        words: wordCountMap[deck.id] ?? 0,
        streak: 0,
        progressPercent: 0,
        expiredAt: null,
        deckId: deck.id,
        showExpiry: false,
        isAssigned: false,
      });
    });

    return list;
  }, [filteredUserDecks, extraPublicDecks, wordCountMap]);

  const totalPages = Math.ceil(allDecks.length / pageSize) || 1;
  const paginatedDecks = useMemo(() => {
    const from = (page - 1) * pageSize;
    return allDecks.slice(from, from + pageSize);
  }, [allDecks, page, pageSize]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {paginatedDecks.map((deck) => (
          <DeckCard key={deck.deckId} {...deck} />
        ))}
      </div>

      {allDecks.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] px-4 py-2 mt-4 shadow-sm">
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={allDecks.length}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            itemName="bộ flashcard"
          />
        </div>
      )}
    </div>
  );
}
