"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { UserProvider } from "@/components/common/UserContext";
import { NavigationProgressWrapper } from "@/components/common/NavigationProgressWrapper";
import type { UserProfile } from "@/types";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <NavigationProgressWrapper />
        {children}
      </UserProvider>
    </QueryClientProvider>
  );
}
