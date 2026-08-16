"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiClient } from "@/lib/api-client";

export interface GroupBranding {
  allow_custom_branding: boolean;
  show_header: boolean;
  show_footer: boolean;
  header_logo_text: string | null;
}

interface BrandingContextValue {
  branding: GroupBranding | null;
  loading: boolean;
}

const BrandingContext = createContext<BrandingContextValue>({
  branding: null,
  loading: true,
});

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<GroupBranding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/me/branding")
      .then(data => {
        setBranding(data.branding ?? null);
      })
      .catch(() => setBranding(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
