export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-[#f0e0e7] border-t-brand rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Đang tải...</p>
      </div>
    </div>
  );
}
