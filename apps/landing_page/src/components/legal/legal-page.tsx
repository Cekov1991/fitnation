import { Link } from "@tanstack/react-router";
import type { LegalBlock, LegalDocument, LegalSpan } from "@fit-nation/legal";

import { SiteFooter } from "@/components/landing/final-cta";
import { logoUrl } from "@/components/landing/data";

function Spans({ spans }: { spans: LegalSpan[] }) {
  return (
    <>
      {spans.map((s, i) => {
        if ("href" in s) {
          const internal = s.href.startsWith("/");
          return internal ? (
            <Link key={i} to={s.href} className="text-primary underline underline-offset-4">
              {s.text}
            </Link>
          ) : (
            <a key={i} href={s.href} className="text-primary underline underline-offset-4">
              {s.text}
            </a>
          );
        }
        if ("bold" in s)
          return (
            <strong key={i} className="font-semibold text-navy">
              {s.text}
            </strong>
          );
        if ("code" in s)
          return (
            <code key={i} className="rounded bg-surface px-1.5 py-0.5 font-mono text-[0.9em]">
              {s.text}
            </code>
          );
        return <span key={i}>{s.text}</span>;
      })}
    </>
  );
}

function Blocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === "h3")
          return (
            <h3 key={i} className="mt-7 font-display text-base font-semibold text-navy">
              <Spans spans={b.spans} />
            </h3>
          );
        if (b.kind === "ul")
          return (
            <ul key={i} className="mt-4 space-y-2 pl-5">
              {b.items.map((item, j) => (
                <li key={j} className="list-disc leading-relaxed marker:text-primary">
                  <Spans spans={item} />
                </li>
              ))}
            </ul>
          );
        return (
          <p key={i} className="mt-4 leading-relaxed">
            <Spans spans={b.spans} />
          </p>
        );
      })}
    </>
  );
}

export function LegalPage({ doc }: { doc: LegalDocument }) {
  return (
    <div className="min-h-screen bg-background font-sans text-muted-foreground">
      <header className="sticky top-0 z-30 border-b border-navy/[0.08] bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoUrl} alt="" aria-hidden="true" className="size-8 rounded-full" />
            <span className="font-display text-lg font-semibold tracking-display text-navy">
              Fit Nation
            </span>
          </Link>
          <Link to="/" className="text-sm transition-colors hover:text-navy">
            ← Back to home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:flex lg:gap-14">
        <aside className="hidden lg:block lg:w-64 lg:shrink-0">
          <nav aria-label="Sections" className="sticky top-24">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-navy/50">
              Contents
            </p>
            <ul className="space-y-1.5">
              {doc.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex gap-2 text-sm leading-snug transition-colors hover:text-navy"
                  >
                    <span className="w-5 shrink-0 font-mono text-xs text-navy/40">{s.number}.</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Legal</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-display text-navy">
            {doc.title}
          </h1>
          <div className="mt-3 text-base">
            <Blocks blocks={doc.lead} />
          </div>
          <p className="mt-5 text-sm text-navy/50">Last updated: {doc.lastUpdated}</p>

          <div className="mt-12 space-y-12">
            {doc.sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold tracking-display text-navy">
                  <span className="mr-2 text-primary">{s.number}.</span>
                  {s.title}
                </h2>
                <Blocks blocks={s.blocks} />
              </section>
            ))}
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
