import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "success" | "warning" | "danger";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        {
          default: "bg-brand-red text-white",
          outline: "border-2 border-brand-red text-brand-red",
          success: "bg-green-100 text-green-800",
          warning: "bg-yellow-100 text-yellow-800",
          danger: "bg-red-100 text-red-700",
        }[variant],
        className
      )}
      {...props}
    />
  );
}
