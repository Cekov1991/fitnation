import { Glow } from "./glow";
import { steps, values } from "./data";

export function ProblemSolution() {
  return (
    <section className="bg-background px-3 pb-8 sm:px-6">
      <div className="relative isolate mx-auto max-w-6xl overflow-hidden squircle-lg bg-navy px-6 py-24 text-navy-foreground sm:px-12 sm:py-32">
        <Glow className="right-[-6rem] top-[-6rem] h-[26rem] w-[26rem] opacity-60" />
        <Glow
          tone="orange"
          className="bottom-[-8rem] left-[-6rem] h-[24rem] w-[24rem] opacity-50"
        />

        <h2 className="max-w-3xl font-display text-4xl font-bold leading-[1.02] tracking-display sm:text-6xl">
          Most people quit the gym because nobody tells them what to do
        </h2>
        <div className="mt-14 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {[
            {
              t: "Coaching is expensive",
              b: "A trainer costs more per month than most people spend on the gym itself. Fit Nation gives you the structure without the invoice.",
            },
            {
              t: "Guesswork kills progress",
              b: "Random sessions produce random results. A real program tells you what to lift today and why.",
            },
            {
              t: "Time is the real barrier",
              b: "Pick your window and get a session that fits it. Twenty focused minutes beats a skipped hour.",
            },
          ].map((c) => (
            <div key={c.t} className="glass-dark squircle p-7">
              <h3 className="font-display text-xl font-bold tracking-display">{c.t}</h3>
              <p className="mt-3 text-base leading-relaxed text-navy-foreground/70">{c.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="bg-surface py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <h2 className="max-w-2xl font-display text-4xl font-bold leading-[1.02] tracking-display text-navy sm:text-6xl">
          Three steps. Then you just train.
        </h2>
        <ol className="mt-16 grid gap-14 sm:grid-cols-3 sm:gap-10">
          {steps.map((s) => (
            <li key={s.n} className="min-w-0">
              <span className="font-display text-6xl font-bold tracking-display text-gradient-brand sm:text-7xl">
                {s.n}
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold tracking-display text-navy">
                {s.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ForCoaches() {
  return (
    <section id="coaches" className="bg-background px-3 py-8 sm:px-6">
      <div className="relative isolate mx-auto max-w-6xl overflow-hidden squircle-lg bg-navy px-6 py-24 text-navy-foreground sm:px-12 sm:py-32">
        <Glow tone="orange" className="right-[-4rem] top-[-4rem] h-[28rem] w-[28rem] opacity-70" />
        <Glow className="bottom-[-8rem] left-[10%] h-[26rem] w-[26rem] opacity-60" />

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-navy-foreground/60">
          For coaches
        </p>
        <h2 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.02] tracking-display sm:text-6xl">
          Coach more people, without more admin
        </h2>
        <div className="mt-14 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {[
            { t: "Build programs", b: "Create multi-week plans once and assign them in seconds." },
            { t: "Manage clients", b: "Everyone's plan, history and schedule in a single view." },
            {
              t: "Follow real data",
              b: "See logged sets and loads instead of asking how it went.",
            },
          ].map((c) => (
            <div key={c.t} className="glass-dark squircle p-7">
              <h3 className="font-display text-xl font-bold tracking-display">{c.t}</h3>
              <p className="mt-3 text-base leading-relaxed text-navy-foreground/70">{c.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Values() {
  return (
    <section className="bg-surface py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <h2 className="max-w-2xl font-display text-4xl font-bold leading-[1.02] tracking-display text-navy sm:text-6xl">
          What we stand for
        </h2>
        <div className="mt-16 grid gap-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {v.title}
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
