"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TopProgressBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const failsafeRef = useRef<NodeJS.Timeout | null>(null);

  const finish = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (failsafeRef.current) clearTimeout(failsafeRef.current);
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  };

  const start = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (failsafeRef.current) clearTimeout(failsafeRef.current);
    setVisible(true);
    setProgress(20);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) return prev;
        return prev + Math.random() * 15;
      });
    }, 150);

    // Auto-resolve after 8s if network hangs
    failsafeRef.current = setTimeout(finish, 8000);
  };

  // Route changed -> finish loading bar
  useEffect(() => {
    finish();
  }, [pathname, searchParams]);

  // Click listener on all links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href) return;

      if (
        href.startsWith("/") &&
        !href.startsWith("/#") &&
        !target.getAttribute("target") &&
        !target.getAttribute("download")
      ) {
        const currentUrl = window.location.pathname + window.location.search;
        if (href !== currentUrl) {
          start();
        }
      }
    };

    const handleCustomStart = () => start();
    const handleCustomFinish = () => finish();

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("hut_loading_start", handleCustomStart);
    window.addEventListener("hut_loading_finish", handleCustomFinish);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("hut_loading_start", handleCustomStart);
      window.removeEventListener("hut_loading_finish", handleCustomFinish);
      if (timerRef.current) clearInterval(timerRef.current);
      if (failsafeRef.current) clearTimeout(failsafeRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[3px] bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-[#ed0046] via-[#ff4d79] to-[#ed0046] shadow-[0_0_8px_#ed0046] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}

export function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <TopProgressBarContent />
    </Suspense>
  );
}
