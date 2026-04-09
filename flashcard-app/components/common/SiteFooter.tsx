import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t-[1.5px] border-[#f0e0e7] py-6 px-[5%] text-center text-[0.82em] text-[#6b7280] bg-white">
      © <strong>Huy Tutor</strong> &nbsp;|&nbsp; Chuẩn mực & Chi tiết &nbsp;|&nbsp;
      <Link href="https://huytutor.edu.vn" target="_blank" className="text-[#ed0046] font-semibold hover:underline">
        www.huytutor.edu.vn
      </Link>
      &nbsp;|&nbsp;
      <Link href="https://www.facebook.com/huytutor" target="_blank" className="text-[#ed0046] font-semibold hover:underline">
        Fanpage
      </Link>
    </footer>
  );
}
