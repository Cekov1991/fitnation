import { PhoneFrame } from "./phone-frame";
import { Glow } from "./glow";
import { features } from "./data";
import { cn } from "@/lib/utils";

const layout = [
  // dashboard — wide hero tile
  "sm:col-span-2 lg:col-span-2 lg:row-span-2",
  // smart workout — tall tile
  "lg:col-span-2 lg:row-span-2",
  "",
  "",
  "sm:col-span-2 lg:col-span-2",
  "sm:col-span-2 lg:col-span-4",
];

export function Features() {
  return (
    <section
      id="features"
      className="relative isolate overflow-hidden bg-background py-24 sm:py-32 lg:py-40"
    >
      <Glow className="left-[-8rem] top-24 h-[26rem] w-[26rem] opacity-70" />

      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Inside the app
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-[1.02] tracking-display text-navy sm:text-6xl">
            Everything you need to train with intent
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Planning, generating, logging and learning — all in one place, built for the gym floor.
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {features.map((f, i) => {
            const large = i === 0 || i === 1;
            return (
              <li
                key={f.title}
                className={cn(
                  "group relative isolate flex flex-col overflow-hidden squircle bg-card p-6 elev-1 transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:elev-3 sm:p-8",
                  layout[i],
                )}
              >
                {large ? (
                  <Glow
                    tone={i === 0 ? "blue" : "orange"}
                    className="left-1/2 top-1/3 h-[22rem] w-[22rem] -translate-x-1/2 opacity-50 transition-opacity duration-500 group-hover:opacity-80"
                  />
                ) : null}

                <div className={cn("order-2 mt-8", large ? "" : "sm:mt-6")}>
                  {/*
                   * The two large tiles fetch eagerly. They are the first
                   * screenshots below the hero, so on a fast scroll a lazy fetch
                   * does not start until the tile is already on screen and you
                   * watch an empty card while it downloads and decodes. The
                   * remaining four stay lazy.
                   */}
                  <PhoneFrame
                    shot={f.image}
                    alt={f.alt}
                    elevation="soft"
                    priority={large}
                    sizes={large ? "230px" : "180px"}
                    className={large ? "max-w-[230px]" : "max-w-[180px]"}
                  />
                </div>

                <div className="order-1 min-w-0">
                  <h3
                    className={cn(
                      "font-display font-bold tracking-display text-navy",
                      large ? "text-2xl sm:text-3xl" : "text-xl",
                    )}
                  >
                    {f.title}
                  </h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
