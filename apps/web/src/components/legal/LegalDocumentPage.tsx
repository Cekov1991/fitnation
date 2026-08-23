import { Link } from 'react-router-dom';
import type { LegalBlock, LegalDocument, LegalSpan } from '@fit-nation/legal';

// Renders a legal document from the shared source in packages/legal.
// The markup and classes here reproduce what PrivacyPolicyPage and
// TermsOfServicePage rendered inline before the text was extracted, so the
// pages look the same as they always did. Prose <a>, <code>, <ul> and <li>
// carry no classes on purpose — they did not before either.

function Spans({ spans }: { spans: LegalSpan[] }) {
  return (
    <>
      {spans.map((s, i) => {
        if ('href' in s) {
          return s.href.startsWith('/') ? (
            <Link key={i} to={s.href} style={{ color: 'var(--color-primary)' }}>
              {s.text}
            </Link>
          ) : (
            <a key={i} href={s.href}>
              {s.text}
            </a>
          );
        }
        if ('bold' in s) return <strong key={i}>{s.text}</strong>;
        if ('code' in s) return <code key={i}>{s.text}</code>;
        return <span key={i}>{s.text}</span>;
      })}
    </>
  );
}

function Blocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        // Was a <p className="font-semibold pt-2">. An <h3> with the same
        // classes is visually identical under Tailwind preflight (which resets
        // heading font-size and weight) but is actually a heading.
        if (b.kind === 'h3')
          return (
            <h3 key={i} className="font-semibold pt-2" style={{ color: 'var(--color-text-primary)' }}>
              <Spans spans={b.spans} />
            </h3>
          );
        if (b.kind === 'ul')
          return (
            <ul key={i}>
              {b.items.map((item, j) => (
                <li key={j}>
                  <Spans spans={item} />
                </li>
              ))}
            </ul>
          );
        return (
          <p key={i}>
            <Spans spans={b.spans} />
          </p>
        );
      })}
    </>
  );
}

export function LegalDocumentPage({
  doc,
  alsoSee,
}: {
  doc: LegalDocument;
  /** The sibling legal document, linked from the footer. */
  alsoSee: { to: string; label: string };
}) {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: 'var(--color-bg-base)', borderColor: 'var(--color-border)' }}
      >
        <Link to="/login" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="Fit Nation" className="w-8 h-8 object-contain rounded-xl" />
          <span
            className="font-bold text-lg bg-clip-text text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
            }}
          >
            Fit Nation
          </span>
        </Link>
        <Link to="/login" className="text-sm transition-colors" style={{ color: 'var(--color-text-secondary)' }}>
          ← Back to sign in
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12 lg:flex lg:gap-12">
        {/* Sidebar TOC — visible on large screens */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Table of Contents
            </p>
            <nav className="space-y-1">
              {doc.sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-start gap-2 text-sm py-1 transition-colors hover:opacity-100"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <span
                    className="text-xs font-mono mt-0.5 w-5 flex-shrink-0"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {s.number}.
                  </span>
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="mb-10">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--color-primary)' }}
            >
              Legal
            </p>
            <h1 className="text-4xl font-extrabold mb-3">{doc.title}</h1>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <Blocks blocks={doc.lead} />
            </div>
            <p className="text-sm mt-4" style={{ color: 'var(--color-text-muted)' }}>
              Last updated: {doc.lastUpdated}
            </p>
          </div>

          <div className="space-y-10">
            {doc.sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-sm font-mono font-bold" style={{ color: 'var(--color-primary)' }}>
                    {s.number}.
                  </span>
                  <h2 className="text-xl font-bold">{s.title}</h2>
                </div>
                <div
                  className="space-y-3 text-sm leading-relaxed pl-6"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Blocks blocks={s.blocks} />
                </div>
              </section>
            ))}
          </div>

          {/* Footer */}
          <div
            className="mt-16 pt-8 border-t text-sm"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            <p>
              Questions? Contact us at{' '}
              <a href="mailto:support@fitnation.mk" style={{ color: 'var(--color-primary)' }}>
                support@fitnation.mk
              </a>
            </p>
            <p className="mt-2">© {new Date().getFullYear()} Stefan Cekov. All rights reserved.</p>
            <div className="mt-4 flex gap-4">
              <Link to={alsoSee.to} style={{ color: 'var(--color-primary)' }}>
                {alsoSee.label}
              </Link>
              <Link to="/support" style={{ color: 'var(--color-primary)' }}>
                Support
              </Link>
              <Link to="/login" style={{ color: 'var(--color-text-secondary)' }}>
                Back to sign in
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
