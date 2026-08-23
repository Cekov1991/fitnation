import { termsOfService } from '@fit-nation/legal';

import { LegalDocumentPage } from './legal/LegalDocumentPage';

// The terms text lives in packages/legal/content/terms-of-service.md, shared
// with the marketing site. Edit it there, then run:
//   pnpm --filter @fit-nation/legal build
export function TermsOfServicePage() {
  return (
    <LegalDocumentPage doc={termsOfService} alsoSee={{ to: '/privacy', label: 'Privacy Policy' }} />
  );
}
