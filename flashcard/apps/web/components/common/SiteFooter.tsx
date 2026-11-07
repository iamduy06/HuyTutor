"use client";

import Link from "next/link";
import { useBranding } from "@/components/common/BrandingContext";

export function SiteFooter({ shopUrl, supportUrl }: { shopUrl?: string; supportUrl?: string }) {
  const { branding } = useBranding();

  if (branding && branding.allow_custom_branding && branding.show_footer === false) {
    return null;
  }

  return (
    <footer className="border-t-[1.5px] border-[#f0e0e7] py-6 px-[5%] text-center text-[0.82em] text-[#6b7280] bg-white">
      © <strong>Huy Tutor</strong> &nbsp;|&nbsp; Chuẩn mực &amp; Chi tiết
      {shopUrl ? (
        <>
          &nbsp;|&nbsp;
          <Link href={shopUrl} target="_blank" className="text-[#ed0046] font-semibold hover:underline">
            {shopUrl.replace(/^https?:\/\//, "")}
          </Link>
        </>
      ) : null}
      {supportUrl ? (
        <>
          &nbsp;|&nbsp;
          <Link href={supportUrl} target="_blank" className="text-[#ed0046] font-semibold hover:underline">
            Fanpage
          </Link>
        </>
      ) : null}
    </footer>
  );
}
