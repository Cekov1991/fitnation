import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Faq } from "@/components/landing/faq";
import { FinalCta, SiteFooter } from "@/components/landing/final-cta";
import { ForCoaches, HowItWorks, ProblemSolution, Values } from "@/components/landing/sections";
import { APP_STORE_URL, PLAY_STORE_URL, SITE_URL } from "@/components/landing/data";

const title = "Fit Nation — Personalized Workout Plans & Tracking";
const description =
  "Fit Nation builds training plans around your goal, level and schedule, with guided exercises and set-by-set tracking. Download on iOS and Android.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MobileApplication",
          name: "Fit Nation — The Movement",
          applicationCategory: "HealthApplication",
          operatingSystem: "iOS, Android",
          description,
          url: [APP_STORE_URL, PLAY_STORE_URL],
        }),
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background font-sans">
      <SiteHeader />
      <main>
        <Hero />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <ForCoaches />
        <Values />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
