"use client";

/**
 * Logo — Google Drive direct download.
 * Render cả img và fallback, dùng onError để toggle.
 * LogoFallback render inline hidden, chỉ hiện khi img lỗi.
 */

import { useState } from "react";

const LOGO_URL = "https://drive.google.com/thumbnail?id=1chYG_qCghZCS2li7fgixW8rHcBAL8rPC&sz=w200";

interface LogoProps {
  height?: number;
  className?: string;
}

export function Logo({ height = 44, className = "" }: LogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    // Fallback: chữ "H"
    return (
      <div
        style={{ width: height, height }}
        className={`rounded-xl bg-brand flex items-center justify-center text-white font-black text-2xl flex-shrink-0 ${className}`}
      >
        H
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_URL}
      alt="Huy Tutor"
      style={{ height, width: "auto", objectFit: "contain" }}
      className={`flex-shrink-0 ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

// Keep LogoFallback for backward compat (unused now)
export function LogoFallback({ height = 44 }: { height?: number }) {
  return (
    <div
      style={{ width: height, height }}
      className="rounded-xl bg-brand flex items-center justify-center text-white font-black text-2xl flex-shrink-0"
    >
      H
    </div>
  );
}
