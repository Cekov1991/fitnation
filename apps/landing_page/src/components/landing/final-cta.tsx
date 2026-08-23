import { Link } from "@tanstack/react-router";

import { StoreBadges } from "./store-badges";
import { Glow } from "./glow";
import { APP_STORE_URL, PLAY_STORE_URL, logoUrl } from "./data";

export function FinalCta() {
  return (
    <section className="bg-background px-3 pb-8 sm:px-6">
      <div className="relative isolate mx-auto max-w-6xl overflow-hidden squircle-lg bg-gradient-brand px-6 py-24 text-center text-accent-foreground sm:px-12 sm:py-32">
        <Glow
          tone="orange"
          className="left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 opacity-60"
        />

        <h2 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-[1.02] tracking-display sm:text-6xl">
          Start your next session today
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-accent-foreground/85">
          Download Fit Nation, answer a few questions, and train with a plan that finally makes
          sense.
        </p>
        <StoreBadges className="mt-10" />
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2.5">
              <img
                src={logoUrl}
                alt=""
                className="size-9 shrink-0 rounded-full"
                aria-hidden="true"
              />
              <span className="truncate font-display text-lg font-semibold tracking-display text-navy">
                Fit Nation
              </span>
            </div>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
              The movement. Personalized training plans, real exercise guidance and progress you can
              measure.
            </p>
          </div>
          <nav className="flex flex-col gap-3 text-sm sm:text-right">
            {[
              { href: "#features", label: "Features" },
              { href: "#how", label: "How it works" },
              { href: "#coaches", label: "For coaches" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-muted-foreground transition-colors hover:text-navy"
              >
                {l.label}
              </a>
            ))}
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-navy"
            >
              App Store
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-navy"
            >
              Google Play
            </a>
            <Link to="/privacy" className="text-muted-foreground transition-colors hover:text-navy">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-muted-foreground transition-colors hover:text-navy">
              Terms of Service
            </Link>
          </nav>
        </div>
        <p className="mt-14 border-t border-navy/[0.08] pt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Fit Nation. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
