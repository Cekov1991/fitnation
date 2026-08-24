import { useState } from "react";
import { Menu, X } from "lucide-react";

import { APP_STORE_URL, logoUrl } from "./data";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#coaches", label: "For coaches" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <div className="mx-auto max-w-5xl">
        <div className="glass-solid grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-full px-3 py-2 sm:px-4">
          <a href="#top" className="flex min-w-0 items-center gap-2.5 pl-1">
            <img
              src={logoUrl}
              alt="Fit Nation logo"
              className="size-8 shrink-0 rounded-full"
              width={32}
              height={32}
            />
            <span className="truncate font-display text-base font-semibold tracking-display text-navy">
              Fit Nation
            </span>
          </a>

          <div className="flex items-center gap-1.5">
            <nav className="hidden items-center gap-7 pr-3 lg:flex">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-navy"
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-full bg-navy px-5 text-sm font-semibold text-navy-foreground transition-[transform,background-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-accent hover:shadow-[0_10px_30px_-10px_var(--accent)] active:translate-y-0"
            >
              Get the app
            </a>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex size-11 items-center justify-center rounded-full text-navy transition-colors hover:bg-navy/5 lg:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {open ? (
          <nav className="glass-solid mt-2 squircle p-2 lg:hidden">
            <ul className="flex flex-col">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center rounded-2xl px-4 text-base font-medium text-navy transition-colors hover:bg-navy/5"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
