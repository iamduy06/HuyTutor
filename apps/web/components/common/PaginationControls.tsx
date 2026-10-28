"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
  disabled?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 50, 100],
  itemName = "mục",
  className = "",
  disabled = false,
}: PaginationControlsProps) {
  const [jumpPage, setJumpPage] = useState<string>(String(currentPage));

  // Sync internal input when currentPage changes externally
  useEffect(() => {
    setJumpPage(String(currentPage));
  }, [currentPage]);

  const handleJump = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseInt(jumpPage.trim(), 10);
    if (isNaN(parsed)) {
      setJumpPage(String(currentPage));
      return;
    }
    const safeTotal = Math.max(1, totalPages);
    const validPage = Math.min(Math.max(1, parsed), safeTotal);
    setJumpPage(String(validPage));
    if (validPage !== currentPage) {
      onPageChange(validPage);
    }
  };

  const getPageNumbers = (): (number | "...")[] => {
    const safeTotal = Math.max(1, totalPages);
    if (safeTotal <= 7) {
      return Array.from({ length: safeTotal }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", safeTotal];
    }

    if (currentPage >= safeTotal - 3) {
      return [
        1,
        "...",
        safeTotal - 4,
        safeTotal - 3,
        safeTotal - 2,
        safeTotal - 1,
        safeTotal,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      safeTotal,
    ];
  };

  const fromItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toItem = Math.min(currentPage * pageSize, totalItems);
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-sm text-gray-700 select-none ${className}`}
    >
      {/* Summary and Page Size Select */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span className="text-xs sm:text-sm text-gray-500 font-medium">
          {totalItems === 0 ? (
            `Không có ${itemName} nào`
          ) : (
            <>
              Hiển thị <span className="font-semibold text-gray-900">{fromItem}</span> -{" "}
              <span className="font-semibold text-gray-900">{toItem}</span> trên tổng số{" "}
              <span className="font-semibold text-gray-900">{totalItems}</span> {itemName}
            </>
          )}
        </span>

        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              const newLimit = parseInt(val, 10);
              if (!isNaN(newLimit)) {
                onPageSizeChange(newLimit);
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-[100px] text-xs font-semibold bg-white border-gray-200">
              <SelectValue placeholder={`${pageSize} / trang`} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)} className="text-xs">
                  {opt} / trang
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pagination Buttons & Jump-to-page */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-gray-200 hover:bg-gray-100 hover:text-brand"
            disabled={disabled || currentPage <= 1}
            onClick={() => onPageChange(1)}
            title="Trang đầu"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-gray-200 hover:bg-gray-100 hover:text-brand"
            disabled={disabled || currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            title="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-xs text-gray-400 font-bold"
                  >
                    ...
                  </span>
                );
              }

              const isCurrent = p === currentPage;
              return (
                <Button
                  key={`page-${p}`}
                  type="button"
                  variant={isCurrent ? "brand" : "outline"}
                  size="sm"
                  className={`h-8 min-w-[32px] px-2 text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-brand text-white shadow-sm hover:bg-brand/90"
                      : "border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-brand"
                  }`}
                  disabled={disabled}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </Button>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-gray-200 hover:bg-gray-100 hover:text-brand"
            disabled={disabled || currentPage >= safeTotalPages}
            onClick={() => onPageChange(currentPage + 1)}
            title="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-gray-200 hover:bg-gray-100 hover:text-brand"
            disabled={disabled || currentPage >= safeTotalPages}
            onClick={() => onPageChange(safeTotalPages)}
            title="Trang cuối"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Manual Page Jump Input */}
        <form
          onSubmit={handleJump}
          className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-200"
        >
          <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:inline">
            Đến:
          </span>
          <Input
            type="number"
            min={1}
            max={safeTotalPages}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            disabled={disabled}
            className="h-8 w-14 text-center text-xs font-bold border-gray-200 px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Số"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 px-2.5 text-xs font-bold border-gray-200 hover:bg-brand hover:text-white hover:border-brand transition-colors"
          >
            Đi
          </Button>
        </form>
      </div>
    </div>
  );
}
