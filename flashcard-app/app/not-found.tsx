import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4 text-center px-4">
      <div className="text-8xl font-extrabold text-brand-red">404</div>
      <h1 className="text-2xl font-bold">Trang không tìm thấy</h1>
      <p className="text-muted-foreground max-w-sm">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
      </p>
      <Link href="/">
        <Button>← Về trang chủ</Button>
      </Link>
    </div>
  );
}
