"use client";

import Link from "next/link";
import { useBranding } from "@/components/common/BrandingContext";

export function SiteFooter() {
  const { branding } = useBranding();
  const mainUrl = process.env.NEXT_PUBLIC_MAIN_URL;

  if (branding && branding.allow_custom_branding && branding.show_footer === false) {
    return null;
  }

  return (
    <footer className="border-t-[1.5px] border-[#f0e0e7] py-6 px-[5%] text-center text-[0.82em] text-[#6b7280] bg-white">
      © <strong>Huy Tutor</strong> &nbsp;|&nbsp; Chuẩn mực &amp; Chi tiết
      {mainUrl ? (
        <>
          &nbsp;|&nbsp;
          <Link href={mainUrl} target="_blank" className="text-[#ed0046] font-semibold hover:underline">
            {mainUrl.replace(/^https?:\/\//, "")}
          </Link>
        </>
      ) : null}
      &nbsp;|&nbsp;
      <Link href="https://www.facebook.com/huytutor" target="_blank" className="text-[#ed0046] font-semibold hover:underline">
        Fanpage
      </Link>
    </footer>
  );
}
