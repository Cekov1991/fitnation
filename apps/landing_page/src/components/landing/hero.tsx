import { Clock, LineChart, Sparkles } from "lucide-react";

import { PhoneFrame } from "./phone-frame";
import { StoreBadges } from "./store-badges";
import { Glow } from "./glow";
import { features, heroShot } from "./data";

const catalogShot = features[4];
const smartShot = features[1];

const points = [
  { icon: Clock, label: "20-minute sessions" },
  { icon: LineChart, label: "Every set tracked" },
  { icon: Sparkles, label: "Plans that adapt" },
];

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden bg-gradient-soft">
      <Glow className="left-1/2 top-[-12rem] h-[34rem] w-[34rem] -translate-x-1/2" />
      <Glow
        tone="orange"
        className="right-[-10rem] top-[18rem] h-[28rem] w-[28rem] lg:right-[-4rem]"
      />

      <div className="mx-auto max-w-6xl px-5 pb-24 pt-16 sm:px-6 sm:pb-32 sm:pt-24 lg:pb-40 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="glass inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Fit Nation — The Movement
          </span>
          <h1 className="mt-7 font-display text-5xl font-bold leading-[0.95] tracking-display text-navy sm:text-7xl lg:text-8xl">
            Train like you
            <br />
            have a coach.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg font-normal leading-relaxed text-muted-foreground sm:text-xl">
            A plan built around your goal, your level and the time you actually have — with every
            set tracked so progress is impossible to miss.
          </p>

          <StoreBadges className="mt-9" />

          <ul className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-8">
            {points.map((p) => (
              <li key={p.label} className="flex min-w-0 items-center gap-2">
                <p.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate text-sm font-medium text-navy/70">{p.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto mt-16 max-w-4xl sm:mt-24">
          <div className="relative flex items-end justify-center">
            <div className="hidden w-[30%] -rotate-[9deg] translate-x-6 translate-y-6 opacity-90 sm:block">
              <PhoneFrame
                shot={catalogShot!.image}
                alt={catalogShot!.alt}
                elevation="soft"
                sizes="269px"
                className="max-w-none"
              />
            </div>

            <div className="relative z-10 w-[78%] max-w-[290px] sm:w-[36%] sm:max-w-none">
              <PhoneFrame
                shot={heroShot}
                alt="Fit Nation dashboard showing a personalized weekly training program"
                priority
                sizes="(min-width: 640px) 322px, min(78vw, 290px)"
                className="max-w-none"
              />
            </div>

            <div className="hidden w-[30%] -translate-x-6 translate-y-6 rotate-[9deg] sm:block">
              <PhoneFrame
                shot={smartShot!.image}
                alt={smartShot!.alt}
                elevation="soft"
                sizes="269px"
                className="max-w-none"
              />
            </div>
          </div>

          {/* Stats: inline row on phone, floating glass cards from sm up */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:hidden">
            <div className="glass squircle px-4 py-3 text-left">
              <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                Session
              </p>
              <p className="font-display text-xl font-bold tracking-display text-navy">36 min</p>
            </div>
            <div className="glass squircle px-4 py-3 text-left">
              <p className="truncate text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                Bench press
              </p>
              <p className="font-display text-xl font-bold tracking-display text-navy">
                30 kg <span className="text-base text-primary">× 8</span>
              </p>
            </div>
          </div>

          <div className="glass absolute left-4 top-16 hidden squircle px-4 py-3 text-left sm:block">
            <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
              Session
            </p>
            <p className="font-display text-xl font-bold tracking-display text-navy">36 min</p>
          </div>

          <div className="glass absolute right-6 top-28 hidden squircle px-4 py-3 text-left sm:block">
            <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
              Bench press
            </p>
            <p className="font-display text-xl font-bold tracking-display text-navy">
              30 kg <span className="text-base text-primary">× 8</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
