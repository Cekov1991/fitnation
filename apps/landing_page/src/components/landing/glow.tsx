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
        // No `blur-3xl` here: the softness lives in the --glow-* gradient stops
        // instead, so ten of these cost nothing beyond a plain gradient fill.
        "pointer-events-none absolute -z-10 rounded-full",
        tone === "blue" ? "glow-blue" : "glow-orange",
        className,
      )}
    />
  );
}
