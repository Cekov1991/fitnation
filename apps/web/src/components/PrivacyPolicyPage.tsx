import { Link } from 'react-router-dom';

const LAST_UPDATED = 'May 6, 2026';

const sections = [
  { id: 'information-we-collect', title: 'Information We Collect' },
  { id: 'how-we-use', title: 'How We Use Your Information' },
  { id: 'legal-basis', title: 'Legal Basis for Processing' },
  { id: 'workout-generator', title: 'Workout Generator & Data Processing' },
  { id: 'data-sharing', title: 'Data Sharing & Third Parties' },
  { id: 'international-transfers', title: 'International Data Transfers' },
  { id: 'storage', title: 'Browser Storage & Authentication' },
  { id: 'security', title: 'Data Storage & Security' },
  { id: 'retention', title: 'Data Retention' },
  { id: 'your-rights', title: 'Your Rights' },
  { id: 'account-deletion', title: 'Account Deletion' },
  { id: 'children', title: "Children's Privacy" },
  { id: 'marketing', title: 'Marketing & Communications' },
  { id: 'breach', title: 'Data Breach Notification' },
  { id: 'governing-law', title: 'Governing Law' },
  { id: 'controller', title: 'Data Controller & Contact' },
  { id: 'acceptance', title: 'Acceptance' },
];

export function PrivacyPolicyPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b px-6 py-4 flex items-center justify-between"
        style={{
          backgroundColor: 'var(--color-bg-base)',
          borderColor: 'var(--color-border)',
        }}
      >
        <Link to="/login" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="Fit Nation"
            className="w-8 h-8 object-contain rounded-xl"
          />
          <span
            className="font-bold text-lg bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >
            Fit Nation
          </span>
        </Link>
        <Link
          to="/login"
          className="text-sm transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
        >
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
              {sections.map((s, i) => (
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
                    {i + 1}.
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
            <h1 className="text-4xl font-extrabold mb-3">Privacy Policy</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Stefan Cekov, an individual operator of the Fit Nation Platform ("Fit Nation," "we," "us," or "our") is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, share, and protect your information when you use the Fit Nation website, mobile application, and related services ("Platform"). By using Fit Nation, you agree to the practices described in this Privacy Policy.
            </p>
            <p className="text-sm mt-4" style={{ color: 'var(--color-text-muted)' }}>
              Last updated: {LAST_UPDATED}
            </p>
          </div>

          <div className="space-y-10">

            <Section id="information-we-collect" number={1} title="Information We Collect">
              <p>We collect only the data necessary to provide and improve our services.</p>

              <SubHeading>a. Personal Information</SubHeading>
              <p>Creating an account is required to access the Platform's core features. We collect:</p>
              <ul>
                <li>Name</li>
                <li>Email address</li>
                <li>Password (stored as a cryptographic hash — we never store your plaintext password)</li>
                <li>Partner identifier (used to apply the correct white-label branding)</li>
              </ul>

              <SubHeading>b. Fitness & Training Data</SubHeading>
              <p>Providing this data is optional but enables personalised features. Fitness and body-related data may qualify as health data (special category personal data under GDPR). We process such data only with your explicit consent and solely to provide the Platform's core functionality.</p>
              <p>By providing such data, you explicitly consent to the processing of your health-related data for the purposes described in this Privacy Policy. This includes:</p>
              <ul>
                <li>Fitness goal, training experience level</li>
                <li>Age, gender, height, weight</li>
                <li>Training days per week, preferred workout duration</li>
                <li>Workout history and completed sessions</li>
                <li>Exercise logs, set and rep data, performance metrics</li>
              </ul>

              <SubHeading>c. Technical & Usage Data</SubHeading>
              <ul>
                <li>Device type and model</li>
                <li>Operating system and app version</li>
                <li>IP address (logged by our hosting infrastructure)</li>
                <li>General usage activity within the app</li>
              </ul>

              <SubHeading>d. What We Do NOT Collect</SubHeading>
              <ul>
                <li>Payment card or financial data (no payment features currently exist)</li>
                <li>Precise location data</li>
                <li>Device contacts or calendar</li>
                <li>Biometric data (fingerprint, Face ID, etc.)</li>
                <li>Data from third-party analytics, advertising, or tracking SDKs</li>
              </ul>
            </Section>

            <Section id="how-we-use" number={2} title="How We Use Your Information">
              <p>We use your data to:</p>
              <ul>
                <li>Provide and operate the Platform</li>
                <li>Generate personalised workout recommendations using our algorithmic workout generator</li>
                <li>Track and display your training progress and performance metrics</li>
                <li>Apply the correct partner branding to your experience</li>
                <li>Send service-related communications (account verification, password reset, security alerts)</li>
                <li>Improve Platform features, usability, and reliability</li>
                <li>Ensure platform security and detect misuse</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p>We do not sell, rent, or trade your personal data.</p>
            </Section>

            <Section id="legal-basis" number={3} title="Legal Basis for Processing">
              <p>We process personal data under the following legal bases (GDPR Article 6 and Article 9):</p>
              <ul>
                <li><strong>Contract performance</strong> — to provide access to the Platform and its core features</li>
                <li><strong>Explicit consent</strong> — for health-related fitness data (special category data under GDPR Article 9)</li>
                <li><strong>Legitimate interests</strong> — to improve, secure, and optimise the Platform</li>
                <li><strong>Legal obligations</strong> — to comply with applicable laws</li>
              </ul>
              <p>You may withdraw your consent for health-related data processing at any time by deleting your account or contacting us at <a href="mailto:support@fitnation.mk">support@fitnation.mk</a>. Withdrawal of consent does not affect the lawfulness of processing before withdrawal.</p>
            </Section>

            <Section id="workout-generator" number={4} title="Workout Generator & Data Processing">
              <p><strong>We do not use artificial intelligence.</strong> Workout recommendations on the Platform are produced by a deterministic algorithm that applies a set of rules and logic to the fitness profile data you provide (goal, experience, training days, workout duration).</p>
              <p>You acknowledge that:</p>
              <ul>
                <li>Algorithmically generated workout plans are informational and not prescriptive.</li>
                <li>Outputs may not be suitable for all users or health conditions.</li>
                <li>The algorithm does not account for real-time physiological conditions.</li>
              </ul>
              <p>Fit Nation does not perform automated decision-making that produces legal or similarly significant effects on you.</p>
            </Section>

            <Section id="data-sharing" number={5} title="Data Sharing & Third Parties">
              <p>We share only the minimum necessary data with the following trusted service providers who act as data processors on our behalf:</p>
              <ul>
                <li><strong>Amazon Web Services (AWS)</strong> — cloud hosting, database, and media file storage located in Frankfurt, Germany</li>
                <li><strong>Cloudflare</strong> — content delivery network and DDoS protection sitting in front of our website and API; processes IP addresses and request metadata for routing and security purposes</li>
                <li><strong>Sentry</strong> — crash reporting and error diagnostics for the mobile app and backend; receives limited diagnostic data such as IP address, authenticated user ID, and request metadata when an error occurs. Sensitive fields (passwords, tokens) are scrubbed automatically</li>
                <li><strong>Brevo</strong> — transactional email delivery for verification, password reset, and security notifications; processes email addresses and message content for these purposes only</li>
                <li><strong>Expo (expo.dev)</strong> — over-the-air JavaScript bundle updates for the mobile app</li>
                <li><strong>Apple App Store / Google Play</strong> — app distribution; crash reports and device diagnostics are collected by these platforms under their own privacy policies, not by us</li>
              </ul>
              <p>All service providers are required to process data securely and in accordance with applicable data protection laws.</p>

              <SubHeading>Data Sharing With Partner Gyms</SubHeading>
              <p>When you select a partner gym during sign-up, that gym's administrators can see <strong>only your name, your email address, and the fact that you are a registered member of their gym</strong>. They cannot see your fitness profile, workout history, set logs, performance metrics, personal records, or any other training data.</p>
              <p>Aggregate analytics — such as the gym-wide member count and percentile rankings displayed within the Platform — are computed server-side without exposing any individual user's data to gym administrators.</p>

              <p><strong>We do not use advertising, marketing analytics, or behavioural tracking services.</strong> We do not sell personal data.</p>
            </Section>

            <Section id="international-transfers" number={6} title="International Data Transfers">
              <p>Your data is primarily processed on Amazon Web Services infrastructure located in Frankfurt, Germany (AWS eu-central-1 region), which is within the European Economic Area (EEA). EU data protection standards apply to this processing.</p>
              <p>For users located outside the EEA, your data may be transferred to and processed in the EEA. By using the Platform, you consent to this transfer. We rely on the adequacy of the EEA's data protection framework and, where required, appropriate safeguards such as Standard Contractual Clauses.</p>
            </Section>

            <Section id="storage" number={7} title="Browser Storage & Authentication">
              <p>Fit Nation uses browser and device storage strictly to keep you signed in:</p>
              <ul>
                <li><strong>Web app</strong> — your authentication token is stored in your browser's <code>localStorage</code>. No third-party tracking cookies are set.</li>
                <li><strong>Mobile app</strong> — your authentication token is stored in <code>expo-secure-store</code>, a secure encrypted storage layer on your device.</li>
              </ul>
              <p>We do not use cookies for advertising, analytics, or tracking purposes. No cookie consent banner is shown because no non-essential cookies are set.</p>
            </Section>

            <Section id="security" number={8} title="Data Storage & Security">
              <p>We implement appropriate technical and organisational measures to protect your data, including:</p>
              <ul>
                <li>Encrypted connections (TLS/HTTPS) for all data in transit</li>
                <li>Cryptographic hashing for passwords (we never store plaintext passwords)</li>
                <li>Access controls limiting who can access production data</li>
                <li>Secure infrastructure managed by AWS</li>
              </ul>
              <p>Crash reports collected by Sentry may include limited diagnostic metadata — such as IP address, authenticated user ID, and request paths — used solely for debugging and stability improvements. Sensitive fields including passwords, authentication tokens, and authorisation headers are scrubbed automatically and never reach Sentry.</p>
              <p>While we take reasonable steps to protect your data, no system can guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials.</p>
            </Section>

            <Section id="retention" number={9} title="Data Retention">
              <p>We retain personal data:</p>
              <ul>
                <li>For as long as your account is active</li>
                <li>For a limited period afterwards, to comply with legal, operational, and security requirements</li>
              </ul>
              <p>When your account is deleted, your personal data and training history are permanently removed or anonymised. Certain data may be retained in anonymised, non-identifiable form for aggregate analytics. Some records may be retained where required by law.</p>
            </Section>

            <Section id="your-rights" number={10} title="Your Rights">
              <p>Under the General Data Protection Regulation (GDPR) and applicable data protection laws, you have the right to:</p>
              <ul>
                <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
                <li><strong>Correction</strong> — request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion</strong> — request erasure of your personal data ("right to be forgotten")</li>
                <li><strong>Restriction</strong> — request that we restrict processing of your data</li>
                <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
                <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
                <li><strong>Withdraw consent</strong> — withdraw consent for health-related data processing at any time</li>
              </ul>
              <p>To exercise any of these rights, contact us at <a href="mailto:support@fitnation.mk">support@fitnation.mk</a>. We will respond within 30 days.</p>
              <p>You also have the right to lodge a complaint with the data protection authority in your country of residence.</p>
            </Section>

            <Section id="account-deletion" number={11} title="Account Deletion">
              <p>You can delete your account at any time from your <strong>Profile</strong> screen — scroll to the bottom and tap <strong>Delete account</strong>. You will be asked to confirm your password. Upon deletion:</p>
              <ul>
                <li>Your name and email address are permanently anonymised so they can no longer be associated with you.</li>
                <li>Your account record is soft-deleted and cannot be reactivated.</li>
                <li>Your training data (workout sessions, set logs, exercise history) may be retained in <strong>anonymised, non-identifiable form</strong> to power aggregate Platform analytics such as gym-wide member counts and percentile rankings.</li>
                <li>Certain records may be retained for a limited period where required by law.</li>
                <li>Account deletion is irreversible.</li>
              </ul>
              <p>You can also request account deletion by emailing <a href="mailto:support@fitnation.mk">support@fitnation.mk</a>. We will process your request within 30 days.</p>
            </Section>

            <Section id="children" number={12} title="Children's Privacy">
              <p>Fit Nation is not intended for users under the age of 16 without parental or guardian consent. We do not knowingly collect personal data from children under 16. If we become aware that we have collected personal data from a child under 16 without appropriate consent, we will delete it promptly.</p>
              <p>If you believe a child has provided us with personal data, please contact us at <a href="mailto:support@fitnation.mk">support@fitnation.mk</a>.</p>
            </Section>

            <Section id="marketing" number={13} title="Marketing & Communications">
              <p>We currently send only the following service-related communications:</p>
              <ul>
                <li>Account verification emails</li>
                <li>Password reset emails</li>
                <li>Security-related account notifications</li>
              </ul>
              <p>We do not currently send marketing or promotional emails. If we introduce marketing communications in the future, we will only do so with your explicit opt-in consent. You will be able to opt out at any time.</p>
            </Section>

            <Section id="breach" number={14} title="Data Breach Notification">
              <p>In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, we will notify the relevant supervisory authority within 72 hours of becoming aware of the breach, as required by GDPR Article 33. We will notify affected users without undue delay where the breach is likely to result in a high risk to their rights and freedoms.</p>
            </Section>

            <Section id="governing-law" number={15} title="Governing Law">
              <p>This Privacy Policy is governed by the laws of North Macedonia. Any disputes shall be subject to the exclusive jurisdiction of the courts of North Macedonia, unless otherwise required by applicable consumer protection laws in your country of residence.</p>
            </Section>

            <Section id="controller" number={16} title="Data Controller & Contact">
              <p>The Fit Nation Platform is operated by, and the data controller for personal data processed through it is:</p>
              <ul>
                <li><strong>Stefan Cekov</strong></li>
                <li>Skopje, North Macedonia</li>
              </ul>
              <p>For any privacy-related questions, requests, or concerns:</p>
              <ul>
                <li>Email: <a href="mailto:support@fitnation.mk">support@fitnation.mk</a></li>
              </ul>
            </Section>

            <Section id="acceptance" number={17} title="Acceptance">
              <p>By using Fit Nation, you confirm that you have read, understood, and agreed to this Privacy Policy. If you do not agree with this Privacy Policy, please do not use the Platform.</p>
            </Section>

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
              <Link to="/terms" style={{ color: 'var(--color-primary)' }}>Terms of Service</Link>
              <Link to="/support" style={{ color: 'var(--color-primary)' }}>Support</Link>
              <Link to="/login" style={{ color: 'var(--color-text-secondary)' }}>Back to sign in</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface SectionProps {
  id: string;
  number: number;
  title: string;
  children: React.ReactNode;
}

function Section({ id, number, title, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-baseline gap-3 mb-4">
        <span
          className="text-sm font-mono font-bold"
          style={{ color: 'var(--color-primary)' }}
        >
          {number}.
        </span>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div
        className="space-y-3 text-sm leading-relaxed pl-6"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {children}
      </div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-semibold pt-2" style={{ color: 'var(--color-text-primary)' }}>
      {children}
    </p>
  );
}
