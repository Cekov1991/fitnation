import { cn } from "@/lib/utils";
import type { Shot } from "./data";

export function PhoneFrame({
  shot,
  alt,
  sizes,
  className,
  priority,
  elevation = "high",
}: {
  shot: Shot;
  alt: string;
  /**
   * The slot width CSS actually renders this frame at, for srcset selection.
   * Required rather than defaulted: a `sizes` that overstates the slot makes
   * every device pull the 720w variant, which is the whole thing this avoids.
   * Keep it in step with the `max-w-*` on the call site.
   */
  sizes: string;
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
        src={shot.src}
        srcSet={shot.srcSet}
        sizes={sizes}
        // width/height give the box an intrinsic aspect ratio, so a lazy tile
        // reserves its full height before the bytes arrive instead of being
        // zero-high and shoving the page around as it decodes. `h-auto` is what
        // stops the height attribute being taken as a literal 1560px.
        width={shot.width}
        height={shot.height}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className="block h-auto w-full rounded-[2.15rem] bg-surface object-cover"
      />
    </div>
  );
}
