import { createFileRoute } from "@tanstack/react-router";
import { termsOfService } from "@fit-nation/legal";

import { LegalPage } from "@/components/legal/legal-page";

// Title, description and canonical URL come from the document itself (0021).
const title = `${termsOfService.title} — Fit Nation`;
const description = termsOfService.description;

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: termsOfService.canonicalUrl },
    ],
    links: [{ rel: "canonical", href: termsOfService.canonicalUrl }],
  }),
  component: () => <LegalPage doc={termsOfService} />,
});
