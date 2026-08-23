import { cn } from "@/lib/utils";

export function Glow({
  className,
  tone = "blue",
}: {
  className?: string;
  tone?: "blue" | "orange";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -z-10 rounded-full blur-3xl",
        tone === "blue" ? "glow-blue" : "glow-orange",
        className,
      )}
    />
  );
}
