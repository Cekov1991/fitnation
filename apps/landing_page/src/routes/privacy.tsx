import { createFileRoute } from "@tanstack/react-router";
import { privacyPolicy } from "@fit-nation/legal";

import { LegalPage } from "@/components/legal/legal-page";

// Title, description and canonical URL come from the document itself (0021).
const title = `${privacyPolicy.title} — Fit Nation`;
const description = privacyPolicy.description;

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: privacyPolicy.canonicalUrl },
    ],
    links: [{ rel: "canonical", href: privacyPolicy.canonicalUrl }],
  }),
  component: () => <LegalPage doc={privacyPolicy} />,
});
