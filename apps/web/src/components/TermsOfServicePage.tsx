import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';

const LAST_UPDATED = 'May 2, 2026';

const sections = [
  { id: 'about', title: 'About Fit Nation' },
  { id: 'eligibility', title: 'Eligibility' },
  { id: 'account', title: 'Account Registration & Security' },
  { id: 'license', title: 'License to Use the Platform' },
  { id: 'health', title: 'Health & Medical Disclaimer' },
  { id: 'no-professional', title: 'No Professional Relationship' },
  { id: 'responsibility', title: 'User Responsibility & Assumption of Risk' },
  { id: 'generator', title: 'Workout Generator Disclaimer' },
  { id: 'payments', title: 'Subscriptions & Payments' },
  { id: 'third-party', title: 'Third-Party Services' },
  { id: 'acceptable-use', title: 'Acceptable Use' },
  { id: 'ip', title: 'Intellectual Property' },
  { id: 'ugc', title: 'User-Generated Content' },
  { id: 'privacy', title: 'Data & Privacy' },
  { id: 'availability', title: 'Availability & Service Interruptions' },
  { id: 'warranties', title: 'Disclaimer of Warranties' },
  { id: 'liability', title: 'Limitation of Liability' },
  { id: 'termination', title: 'Account Suspension and Termination' },
  { id: 'indemnification', title: 'Indemnification' },
  { id: 'force-majeure', title: 'Force Majeure' },
  { id: 'governing-law', title: 'Governing Law' },
  { id: 'severability', title: 'Severability' },
  { id: 'entire-agreement', title: 'Entire Agreement' },
  { id: 'changes', title: 'Changes to These Terms' },
];

export function TermsOfServicePage() {
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
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-tr from-blue-500 to-purple-600">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
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
            <h1 className="text-4xl font-extrabold mb-3">Terms of Service</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Welcome to Fit Nation. By accessing or using our website and mobile application ("Platform"), you agree to be bound by these Terms of Service ("Terms"). Please read them carefully. If you do not agree to these Terms, do not use the Platform.
            </p>
            <p className="text-sm mt-4" style={{ color: 'var(--color-text-muted)' }}>
              Last updated: {LAST_UPDATED}
            </p>
          </div>

          <div className="space-y-10">

            <Section id="about" number={1} title="About Fit Nation">
              <p>Fit Nation is a fitness training platform operated by <strong>Mayst Impact DOOEL</strong>, Skopje, North Macedonia. The Platform provides:</p>
              <ul>
                <li>Training programs and workout plans</li>
                <li>An algorithmic workout generator tailored to your fitness profile</li>
                <li>An exercise library with guidance and video demonstrations</li>
                <li>Workout session tracking and performance progress monitoring</li>
                <li>White-label access for partner organisations</li>
              </ul>
              <p>Fit Nation is intended as a support tool to help users better understand and manage their training. It does not replace professional advice, supervision, or medical guidance.</p>
            </Section>

            <Section id="eligibility" number={2} title="Eligibility">
              <p>To use the Platform, you must:</p>
              <ul>
                <li>Be at least 16 years old (or have parental or guardian consent if younger).</li>
                <li>Provide accurate and complete registration information.</li>
                <li>Have a valid invitation or partner access code where required.</li>
              </ul>
              <p>By using the Platform, you confirm you meet these requirements.</p>
            </Section>

            <Section id="account" number={3} title="Account Registration & Security">
              <p>When creating an account, you agree to:</p>
              <ul>
                <li>Provide accurate, current, and complete information.</li>
                <li>Maintain the confidentiality of your login credentials.</li>
                <li>Notify Fit Nation immediately at <a href="mailto:support@fitnation.mk">support@fitnation.mk</a> of any unauthorised access or use of your account.</li>
              </ul>
              <p>You are responsible for all activities that occur under your account. Fit Nation is not liable for any loss or damage arising from unauthorised use of your account.</p>
            </Section>

            <Section id="license" number={4} title="License to Use the Platform">
              <p>Fit Nation grants you a limited, non-exclusive, non-transferable, revocable licence to access and use the Platform strictly for personal, non-commercial purposes.</p>
              <p>You may not:</p>
              <ul>
                <li>Copy, modify, distribute, sell, or lease any part of the Platform.</li>
                <li>Reverse engineer or attempt to extract source code.</li>
                <li>Use the Platform for commercial purposes without prior written consent.</li>
              </ul>
            </Section>

            <Section id="health" number={5} title="Health & Medical Disclaimer">
              <p>Fit Nation is not a medical application and does not provide medical advice, diagnosis, or treatment. Before starting any exercise or training programme, you should consult a qualified healthcare professional, especially if you:</p>
              <ul>
                <li>Have existing medical conditions.</li>
                <li>Have a history of injury or chronic pain.</li>
                <li>Have cardiovascular issues.</li>
                <li>Are pregnant.</li>
              </ul>
              <p>Fit Nation does not monitor your health condition or activity in real time and cannot assess your condition during exercise.</p>
              <p>You are solely responsible for determining whether any activity is appropriate for you.</p>
            </Section>

            <Section id="no-professional" number={6} title="No Professional Relationship">
              <p>Use of the Platform does not create any coach-client, trainer-client, or medical professional relationship.</p>
              <p>All content is provided for general informational purposes only and does not replace professional supervision or personalised coaching.</p>
            </Section>

            <Section id="responsibility" number={7} title="User Responsibility & Assumption of Risk">
              <p>You are responsible for how you use the Platform and its content. You acknowledge that:</p>
              <ul>
                <li>Physical exercise involves inherent risks, including injury or, in rare cases, death.</li>
                <li>You voluntarily assume all risks associated with your training activities.</li>
                <li>You should stop exercising immediately if you experience pain, dizziness, or discomfort.</li>
                <li>Fit Nation does not guarantee results, and outcomes may vary based on individual factors.</li>
              </ul>
            </Section>

            <Section id="generator" number={8} title="Workout Generator Disclaimer">
              <p>Fit Nation includes a workout generator that produces training recommendations based on your fitness profile and preferences. <strong>This system is a deterministic algorithm — it does not use artificial intelligence, machine learning, or AI-generated outputs of any kind.</strong></p>
              <p>You acknowledge that:</p>
              <ul>
                <li>Algorithmically generated workout plans are informational and not prescriptive.</li>
                <li>They do not constitute medical advice, coaching, or professional guidance.</li>
                <li>Outputs may not be suitable for all users or health conditions.</li>
                <li>The algorithm does not account for real-time physiological conditions.</li>
              </ul>
              <p>All decisions based on such outputs are made at your own discretion and risk. Fit Nation does not guarantee the accuracy, suitability, or effectiveness of generated workout plans.</p>
            </Section>

            <Section id="payments" number={9} title="Subscriptions & Payments">
              <p>Fit Nation currently does not offer paid subscription tiers. All Platform features are accessible without payment at this time.</p>
              <p>If subscription-based features are introduced in the future, we will update these Terms and present the updated terms to you before any purchase is required. Continued use after a paid feature becomes available and applicable billing terms are accepted constitutes agreement to those terms.</p>
            </Section>

            <Section id="third-party" number={10} title="Third-Party Services">
              <p>Fit Nation relies on the following third-party services to operate the Platform:</p>
              <ul>
                <li><strong>Amazon Web Services (AWS Frankfurt)</strong> — cloud hosting and infrastructure</li>
                <li><strong>Apple App Store</strong> — iOS app distribution</li>
                <li><strong>Google Play</strong> — Android app distribution</li>
                <li><strong>Expo (expo.dev)</strong> — over-the-air app updates</li>
              </ul>
              <p>We are not responsible for the availability, performance, accuracy, or policies of these third-party services. Your use of such services is subject to their respective terms and policies.</p>
            </Section>

            <Section id="acceptable-use" number={11} title="Acceptable Use">
              <p>You agree not to:</p>
              <ul>
                <li>Misuse, hack, reverse-engineer, or exploit the Platform.</li>
                <li>Upload harmful, illegal, or misleading content.</li>
                <li>Interfere with system functionality or performance.</li>
                <li>Impersonate other users or entities.</li>
                <li>Use the Platform for commercial coaching or services without prior written consent.</li>
                <li>Scrape or extract data from the Platform by automated means.</li>
                <li>Use bots or automated systems without permission.</li>
              </ul>
              <p>Violation of these rules may result in suspension or termination of your account.</p>
            </Section>

            <Section id="ip" number={12} title="Intellectual Property">
              <p>All content and technology within Fit Nation — including software, design, text, media, branding, and the workout generation algorithm — are the exclusive property of <strong>Mayst Impact DOOEL</strong> or its licensors.</p>
              <p>You may not copy, reproduce, distribute, modify, or reverse-engineer any part of the Platform without prior written consent.</p>
              <p>The name "Fit Nation" and all associated branding may not be used without permission.</p>
            </Section>

            <Section id="ugc" number={13} title="User-Generated Content">
              <p>If you submit content to the Platform (including fitness data, exercise logs, or other user-provided information), you:</p>
              <ul>
                <li>Confirm you own or have the rights to submit such content.</li>
                <li>Grant Fit Nation a non-exclusive, worldwide, royalty-free licence to use it solely for the purpose of providing Platform functionality.</li>
              </ul>
              <p>You remain responsible for all content you provide.</p>
            </Section>

            <Section id="privacy" number={14} title="Data & Privacy">
              <p>Fit Nation processes personal and training data to provide and improve the Platform. For full details on what data we collect, how we use it, and your rights, please refer to our <Link to="/privacy">Privacy Policy</Link>.</p>
            </Section>

            <Section id="availability" number={15} title="Availability & Service Interruptions">
              <p>We do not guarantee uninterrupted or error-free access to the Platform. The service may be temporarily unavailable due to maintenance, updates, or technical issues.</p>
              <p>We reserve the right to modify, suspend, or discontinue any part of the Platform at any time. We do not guarantee that the Platform will meet your specific training goals or expectations.</p>
            </Section>

            <Section id="warranties" number={16} title="Disclaimer of Warranties">
              <p>Fit Nation is provided "as is" and "as available." To the fullest extent permitted by law, we disclaim all warranties, including any warranty that:</p>
              <ul>
                <li>Results will be achieved.</li>
                <li>Content is accurate or reliable.</li>
                <li>The Platform will be error-free or uninterrupted.</li>
              </ul>
            </Section>

            <Section id="liability" number={17} title="Limitation of Liability">
              <p>To the maximum extent permitted by applicable law, Mayst Impact DOOEL shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:</p>
              <ul>
                <li>Any injuries or health-related issues arising from use of the Platform.</li>
                <li>Any losses or damages arising from the use or misuse of the Platform or its generated workout plans.</li>
              </ul>
              <p>You use the Platform at your own risk. To the maximum extent permitted by applicable law, Fit Nation's total liability shall not exceed the amount paid by you (if any) for use of the Platform in the preceding 12 months.</p>
            </Section>

            <Section id="termination" number={18} title="Account Suspension and Termination">
              <p>We may suspend or terminate your access to the Platform at any time, with or without notice, if you violate these Terms or if we reasonably believe such action is necessary.</p>
              <p>Upon termination, your right to access and use the Platform will immediately cease. Any provisions that by their nature should survive termination shall remain in full force and effect.</p>
              <p>We may retain certain data as required for legal, regulatory, or legitimate business purposes, in accordance with our Privacy Policy.</p>
              <p>You may delete your account at any time through your Profile settings. Account deletion is irreversible.</p>
            </Section>

            <Section id="indemnification" number={19} title="Indemnification">
              <p>You agree to indemnify and hold harmless Mayst Impact DOOEL, its founders, employees, and partners from any claims, damages, liabilities, or expenses arising from:</p>
              <ul>
                <li>Your use of the Platform.</li>
                <li>Your violation of these Terms.</li>
                <li>Your misuse of training content or generated workout plans.</li>
              </ul>
            </Section>

            <Section id="force-majeure" number={20} title="Force Majeure">
              <p>Fit Nation shall not be liable for any failure or delay in performance resulting from events beyond its reasonable control, including but not limited to natural disasters, infrastructure outages, or third-party service failures.</p>
            </Section>

            <Section id="governing-law" number={21} title="Governing Law">
              <p>These Terms are governed by the laws of North Macedonia. Any disputes shall be subject to the jurisdiction of the competent courts of North Macedonia, unless otherwise required by applicable consumer protection laws in your country of residence.</p>
            </Section>

            <Section id="severability" number={22} title="Severability">
              <p>If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.</p>
            </Section>

            <Section id="entire-agreement" number={23} title="Entire Agreement">
              <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and Fit Nation regarding use of the Platform.</p>
            </Section>

            <Section id="changes" number={24} title="Changes to These Terms">
              <p>We may update these Terms from time to time. When we make material changes, we will notify you via email or an in-app notice. Continued use of the Platform after the effective date of any changes constitutes acceptance of the updated Terms.</p>
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
            <p className="mt-2">© {new Date().getFullYear()} Mayst Impact DOOEL. All rights reserved.</p>
            <div className="mt-4 flex gap-4">
              <Link to="/privacy" style={{ color: 'var(--color-primary)' }}>Privacy Policy</Link>
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
