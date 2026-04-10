"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FACEBOOK_URL } from "@/lib/constants";

interface AccessDeniedViewProps {
  deckTitle: string;
}

export function AccessDeniedView({ deckTitle }: AccessDeniedViewProps) {
  const [countdown, setCountdown] = useState(10);
  const router = useRouter();

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in fade-in duration-700">
      <div className="bg-white rounded-3xl border-2 border-red-100 p-8 md:p-12 max-w-xl w-full shadow-xl shadow-red-50/50 text-center flex flex-col items-center gap-6">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center animate-bounce">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-[#1a1a2e]">Không có quyền truy cập</h2>
          <p className="text-[#6b7280] font-medium leading-relaxed">
            Bạn không có quyền truy cập trang này, vui lòng liên hệ để được hỗ trợ.
          </p>
          <div className="inline-block mt-4 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-[#1a1a2e] font-bold">
            {deckTitle}
          </div>
        </div>

        <div className="w-full h-px bg-slate-100 my-2" />

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Button variant="brand" className="w-full py-6 rounded-2xl text-base shadow-lg shadow-brand/20 group" asChild>
            <a href={FACEBOOK_URL} target="_blank" rel="noreferrer">
              <MessageCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Liên hệ hỗ trợ ngay
            </a>
          </Button>
          <Button variant="ghost" className="w-full py-6 rounded-2xl text-[#6b7280]" onClick={() => router.push("/dashboard")}>
            Về Dashboard
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-2">
          <Clock className="w-3 h-3" />
          <span>Tự động quay lại Dashboard sau {countdown} giây...</span>
        </div>
      </div>
    </div>
  );
}
