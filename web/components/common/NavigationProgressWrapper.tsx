"use client";

import { Suspense } from "react";
import { NavigationProgress } from "./NavigationProgress";

// Wrapper để tránh lỗi useSearchParams() ngoài Suspense
export function NavigationProgressWrapper() {
  return (
    <Suspense fallback={null}>
      <NavigationProgress />
    </Suspense>
  );
}
