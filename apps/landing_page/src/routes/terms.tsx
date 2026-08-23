import { createFileRoute } from "@tanstack/react-router";
import { termsOfService } from "@fit-nation/legal";

import { LegalPage } from "@/components/legal/legal-page";
import { SITE_URL } from "@/components/landing/data";

const title = "Terms of Service — Fit Nation";
const description =
  "The terms that govern your use of the Fit Nation platform, including health disclaimers and acceptable use.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: `${SITE_URL}/terms` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/terms` }],
  }),
  component: () => <LegalPage doc={termsOfService} />,
});
