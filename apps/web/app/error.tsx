"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border-2 border-[#f0e0e7] p-8 text-center shadow-lg">
        <div className="text-4xl mb-4">🔄</div>
        <h2 className="text-2xl font-extrabold text-[#1a1a2e] mb-2">Đang kết nối lại</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Máy chủ vừa phản hồi chậm hoặc đang khởi động lại. Vui lòng bấm thử lại để tiếp tục.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="brand" onClick={() => reset()}>
            Thử lại
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Về trang chủ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
