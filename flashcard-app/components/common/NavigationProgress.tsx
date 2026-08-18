"use client";

/**
 * NavigationProgress — thanh loading khi chuyển trang.
 * Hiển thị spinner + thanh progress ở đầu trang khi đang navigate.
 */

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function NavigationProgress() {
  const pathname      = usePathname();
  const searchParams  = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPath  = useRef(pathname + searchParams.toString());

  useEffect(() => {
    const current = pathname + searchParams.toString();

    if (current !== prevPath.current) {
      // Navigation bắt đầu → show loading
      prevPath.current = current;
      setLoading(true);
      setProgress(20);

      // Fake progress
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 85) {
            clearInterval(timerRef.current!);
            return 85;
          }
          return p + Math.random() * 12;
        });
      }, 150);
    }

    // Navigation xong → complete bar rồi hide
    setProgress(100);
    const done = setTimeout(() => {
      setLoading(false);
      setProgress(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }, 300);

    return () => clearTimeout(done);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <>
      {/* Thanh progress ở đầu trang */}
      <div
        className="fixed top-0 left-0 z-[9999] h-[3px] bg-brand transition-all duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: loading || progress > 0 ? 1 : 0 }}
      />
      {/* Spinner góc phải */}
      {loading && (
        <div className="fixed top-[70px] right-4 z-[9999] bg-white shadow-lg border-2 border-[#f0e0e7] rounded-full p-2">
          <Loader2 className="w-5 h-5 animate-spin text-brand" />
        </div>
      )}
    </>
  );
}
