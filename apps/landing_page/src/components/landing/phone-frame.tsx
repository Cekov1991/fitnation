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
    // Bezel, corners and camera are sized in cqw (this wrapper's width), so the
    // 180px feature tiles keep the hero phone's proportions. In fixed px the
    // same radius that suits the hero turned the small phones into pills and
    // cut into the screenshots' corners.
    <div className={cn("@container mx-auto w-full max-w-[260px]", className)}>
      <div
        className={cn(
          "relative rounded-[12.5cqw] bg-phone p-[2.5cqw]",
          elevation === "high" ? "shadow-phone" : "elev-2",
        )}
      >
        <div className="absolute left-1/2 top-[6.2cqw] z-10 size-[3.4cqw] -translate-x-1/2 rounded-full bg-phone" />
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
          className="block h-auto w-full rounded-[10cqw] bg-surface object-cover"
        />
      </div>
    </div>
  );
}
