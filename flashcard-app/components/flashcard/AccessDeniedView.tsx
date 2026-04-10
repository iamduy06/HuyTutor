"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, RefreshCcw, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FACEBOOK_URL } from "@/lib/constants";

interface AccessDeniedViewProps {
  deckTitle: string;
}

export function AccessDeniedView({ deckTitle }: AccessDeniedViewProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown <= 0) {
      router.push("/dashboard");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <h1 className="text-2xl md:text-3xl font-extrabold text-[#1a1a2e] mb-4">
        Bạn không có quyền truy cập trang này
      </h1>
      
      <p className="text-lg text-muted-foreground max-w-lg mb-2">
        Vui lòng liên hệ để được hỗ trợ cho bộ Flashcard:
      </p>
      
      <div className="bg-[#f0e0e7] px-4 py-2 rounded-xl font-bold text-brand mb-8">
        {deckTitle}
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
           <RefreshCcw className="w-4 h-4 animate-spin" />
           Tự động quay lại Dashboard sau <span className="text-brand font-bold w-4">{countdown}s</span>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="brand" size="lg" asChild>
            <a href={FACEBOOK_URL} target="_blank" rel="noreferrer">
              <Facebook className="w-5 h-5 mr-2" />
              Liên hệ Fanpage
            </a>
          </Button>
          <Button variant="brand-outline" size="lg" onClick={() => router.push("/dashboard")}>
            Về Dashboard ngay
          </Button>
        </div>
      </div>
    </div>
  );
}
