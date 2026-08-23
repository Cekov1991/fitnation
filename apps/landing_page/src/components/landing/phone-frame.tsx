import { cn } from "@/lib/utils";

export function PhoneFrame({
  src,
  alt,
  className,
  priority,
  elevation = "high",
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  elevation?: "high" | "soft";
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[260px] rounded-[2.5rem] bg-navy p-[5px]",
        elevation === "high" ? "shadow-phone" : "elev-2",
        className,
      )}
    >
      <div className="absolute left-1/2 top-[10px] z-10 h-[5px] w-14 -translate-x-1/2 rounded-full bg-navy-foreground/25" />
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="block w-full rounded-[2.15rem] bg-surface object-cover"
      />
    </div>
  );
}
