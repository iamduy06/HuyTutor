import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="text-center py-4 px-4 text-[#adb5bd] text-[0.82em] leading-7 border-t-2 border-[#f0e0e7] bg-white">
      © Bản quyền thuộc về <strong className="text-[#1a1a2e]">Huy Tutor</strong>
      &nbsp;|&nbsp;
      Tham khảo tài liệu tiếng Anh tại{" "}
      <Link
        href="https://www.huytutor.io.vn/"
        target="_blank"
        className="text-brand font-semibold hover:underline"
      >
        www.huytutor.io.vn
      </Link>
    </footer>
  );
}
