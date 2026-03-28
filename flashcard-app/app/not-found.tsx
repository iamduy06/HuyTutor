import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-8xl font-extrabold text-brand-red">404</div>
      <h1 className="text-2xl font-bold">Trang không tìm thấy</h1>
      <p className="max-w-sm text-gray-400">Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển.</p>
      <Link href="/"><Button>← Về trang chủ</Button></Link>
    </div>
  );
}
