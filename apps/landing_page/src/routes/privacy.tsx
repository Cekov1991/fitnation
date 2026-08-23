import { createFileRoute } from "@tanstack/react-router";
import { privacyPolicy } from "@fit-nation/legal";

import { LegalPage } from "@/components/legal/legal-page";
import { SITE_URL } from "@/components/landing/data";

const title = "Privacy Policy — Fit Nation";
const description =
  "How Fit Nation collects, uses, stores and protects your personal and training data.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: `${SITE_URL}/privacy` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/privacy` }],
  }),
  component: () => <LegalPage doc={privacyPolicy} />,
});
