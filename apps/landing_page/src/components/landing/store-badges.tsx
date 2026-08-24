import { cn } from "@/lib/utils";

import appStoreBadge from "@/assets/app-store-badge-420.webp";
import googlePlayBadge from "@/assets/google-play-badge-420.webp";
import { APP_STORE_URL, PLAY_STORE_URL } from "./data";

export function StoreBadges({ className }: { className?: string }) {
  const link =
    "inline-flex h-[58px] w-[190px] shrink-0 items-center justify-center rounded-2xl bg-store-badge transition-transform hover:scale-[1.02] active:scale-[0.98]";
  const img = "block h-[42px] w-auto object-contain";

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={link}
        aria-label="Download Fit Nation on the App Store"
      >
        <img
          src={appStoreBadge}
          alt="Download on the App Store"
          width={420}
          height={126}
          className={img}
          loading="lazy"
        />
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={link}
        aria-label="Get Fit Nation on Google Play"
      >
        <img
          src={googlePlayBadge}
          alt="Get it on Google Play"
          width={420}
          height={126}
          className={img}
          loading="lazy"
        />
      </a>
    </div>
  );
}
