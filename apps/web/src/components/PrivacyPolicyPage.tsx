import { privacyPolicy } from '@fit-nation/legal';

import { LegalDocumentPage } from './legal/LegalDocumentPage';

// The policy text lives in packages/legal/content/privacy-policy.md, shared with
// the marketing site. Edit it there, then run:
//   pnpm --filter @fit-nation/legal build
export function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage doc={privacyPolicy} />
  );
}
