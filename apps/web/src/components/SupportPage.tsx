import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';

const sections = [
  { id: 'getting-started', title: 'Getting started' },
  { id: 'account-sign-in', title: 'Account & sign-in' },
  { id: 'workouts-progression', title: 'Workouts & progression' },
  { id: 'plans-programs', title: 'Plans & programs' },
  { id: 'workout-generator', title: 'The Workout Generator' },
  { id: 'partner-programs', title: 'Your gym (partner programs)' },
  { id: 'data-privacy', title: 'Data, privacy & deletion' },
  { id: 'troubleshooting', title: 'Troubleshooting' },
  { id: 'contact-us', title: 'Contact us' },
];

export function SupportPage() {
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
          {/* Hero */}
          <div className="mb-10">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--color-primary)' }}
            >
              Support
            </p>
            <h1 className="text-4xl font-extrabold mb-3">Need help?</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              We're here for you. The Nation moves together — including when something's not working.
              Most questions below are answered in seconds; if not, we're one email away.
            </p>
            <p className="mt-3" style={{ color: 'var(--color-text-secondary)' }}>
              Email replies typically within 24–48 hours, Monday to Friday. We're a small team, so
              weekends may take a little longer.
            </p>

            {/* Contact card */}
            <div
              className="mt-6 inline-flex items-center gap-3 px-5 py-3 rounded-xl border"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-surface)' }}
            >
              <span style={{ color: 'var(--color-text-secondary)' }} className="text-sm">Email us at</span>
              <a
                href="mailto:support@fitnation.mk"
                className="font-semibold text-sm transition-opacity hover:opacity-80"
                style={{ color: 'var(--color-primary)' }}
              >
                support@fitnation.mk
              </a>
            </div>
          </div>

          <div className="space-y-10">

            <Section id="getting-started" number={1} title="Getting started">
              <SubHeading>How do I create an account?</SubHeading>
              <p>
                Download the Fit Nation app, tap <strong>Create account</strong>, fill in your name,
                email, and password, then select the gym (partner) you belong to from the dropdown.
                After registering, check your inbox for a verification email and tap the link inside.
                You won't be able to access the full app until your email is verified.
              </p>

              <SubHeading>I didn't get my verification email.</SubHeading>
              <p>
                Check your spam or junk folder first. If it's not there, sign in with your new
                credentials and tap <strong>Resend verification email</strong> on the verification
                screen. The link expires after a period of time, so use the latest one you receive.
                If you're still having trouble, email us at{' '}
                <a href="mailto:support@fitnation.mk" style={{ color: 'var(--color-primary)' }}>
                  support@fitnation.mk
                </a>
                .
              </p>

              <SubHeading>What does "select your gym" mean during sign-up?</SubHeading>
              <p>
                Fit Nation is used by multiple gyms and fitness brands (we call them partners). Choosing
                your gym applies your gym's branding and gives you access to any exclusive programs or
                routines your gym has published. If your gym isn't in the list, contact us and we'll
                look into it.
              </p>
            </Section>

            <Section id="account-sign-in" number={2} title="Account & sign-in">
              <SubHeading>I forgot my password.</SubHeading>
              <p>
                On the sign-in screen, tap <strong>Forgot password</strong> and enter your email
                address. You'll receive a reset link within a few minutes. Follow the link, set a new
                password, and sign back in. Reset links expire after a short time, so use them
                promptly.
              </p>

              <SubHeading>How do I update my profile (goal, height, weight, schedule)?</SubHeading>
              <p>
                Go to <strong>Profile → Edit profile</strong>. You can update your fitness goal, age,
                gender, height, weight, training experience, days per week, and preferred workout
                duration at any time. Changes take effect immediately and will influence your next
                generated workout.
              </p>

              <SubHeading>How do I change my email address?</SubHeading>
              <p>
                Go to <strong>Profile → Edit profile</strong> and update the email field. You'll need
                to verify the new address before it takes effect. If you have trouble, email{' '}
                <a href="mailto:support@fitnation.mk" style={{ color: 'var(--color-primary)' }}>
                  support@fitnation.mk
                </a>{' '}
                from your current registered address.
              </p>

              <SubHeading>How do I delete my account?</SubHeading>
              <p>
                Go to <strong>Profile → Settings → Delete account</strong>. You'll be asked to confirm
                your password. Deletion is permanent and irreversible — your name, email, fitness
                profile, and all training history will be erased. See{' '}
                <Link to="/privacy#account-deletion" style={{ color: 'var(--color-primary)' }}>
                  our Privacy Policy
                </Link>{' '}
                for full details on what gets deleted.
              </p>
            </Section>

            <Section id="workouts-progression" number={3} title="Workouts & progression">
              <SubHeading>How does Fit Nation decide when to add weight?</SubHeading>
              <p>
                Fit Nation uses <strong>double progression</strong> for weighted exercises. Your target
                weight goes up only when every logged set in your previous completed session hit the
                top of the rep range (max target reps) at the same weight. Until that happens, the
                target weight stays the same and you work toward hitting all sets in range.
              </p>

              <SubHeading>Why didn't my target weight go up after my last session?</SubHeading>
              <p>
                The system checks whether all sets in your last <em>completed</em> session hit the
                maximum rep target at the same weight. If any set was below that — or if the session
                wasn't marked complete — the weight stays as-is. This is intentional: progression
                is earned, not automatic.
              </p>

              <SubHeading>What's the difference between double progression and total reps progression?</SubHeading>
              <p>
                <strong>Double progression</strong> is used for weighted exercises (barbell, dumbbell,
                machine, cable). You progress by first filling the rep range across all sets, then
                increasing weight.
              </p>
              <p>
                <strong>Total reps progression</strong> is used for bodyweight, TRX, and band exercises
                where load can't be easily adjusted. Your goal each session is to beat the total rep
                count from your last session by one rep.
              </p>

              <SubHeading>Can I edit or delete a logged set?</SubHeading>
              <p>
                You can update any set's weight and reps during an active session. You can delete only
                the <em>last</em> set for a given exercise. Once a session is completed, the set log is
                locked to preserve your history.
              </p>
            </Section>

            <Section id="plans-programs" number={4} title="Plans & programs">
              <SubHeading>How is my personalized plan generated?</SubHeading>
              <p>
                After onboarding, Fit Nation builds a 12-week plan using your fitness goal, training
                experience, days per week, and preferred session length. The split (Full Body, Push/Pull,
                PPL, etc.) is determined automatically from your training days, and exercises are selected
                to fit within your available session time, with a 10% buffer for warm-up and transitions.
              </p>

              <SubHeading>Can I regenerate my plan?</SubHeading>
              <p>
                Yes. Go to <strong>Plans</strong> and tap <strong>Regenerate plan</strong>. This creates
                a new 12-week personalized plan from your current profile. Your previous auto-generated
                plan is deactivated, but its history remains in your session log.
              </p>

              <SubHeading>What's the difference between a routine and a program?</SubHeading>
              <p>
                A <strong>routine</strong> is a flexible, repeatable collection of workouts with no
                fixed duration. You can run any workout from it as many times as you like. A{' '}
                <strong>program</strong> is a structured, time-bound plan (e.g., 12 weeks) that tracks
                progress and suggests your next workout in sequence.
              </p>

              <SubHeading>Can I build a plan from scratch?</SubHeading>
              <p>
                Yes. Go to <strong>Plans → Create plan</strong> to start a blank routine. Add workout
                templates, then add exercises to each template with your own target sets, reps, and
                weights. You have full control over everything.
              </p>
            </Section>

            <Section id="workout-generator" number={5} title="The Workout Generator">
              <SubHeading>How do I generate a workout?</SubHeading>
              <p>
                Tap the <strong>Generate workout</strong> button (on the Dashboard or via the
                navigation). Choose your focus (Push, Pull, Legs, Upper, Lower, or Full Body), filter
                by the equipment available to you, set a duration, and tap Generate. Fit Nation builds
                a session in seconds tailored to your goal and experience level.
              </p>

              <SubHeading>Can I change exercises before starting?</SubHeading>
              <p>
                Yes. After generating, the session is in <em>draft</em> status. You can add, remove,
                or reorder exercises before confirming. Tap <strong>Confirm &amp; start</strong> when
                you're happy with it.
              </p>

              <SubHeading>What if I don't like the generated workout?</SubHeading>
              <p>
                Tap <strong>Regenerate</strong>. You can also tweak the filters (equipment, focus,
                duration) and regenerate as many times as you like before starting. Each regeneration
                cancels the current draft and builds a fresh one.
              </p>
            </Section>

            <Section id="partner-programs" number={6} title="Your gym (partner programs)">
              <SubHeading>What does it mean to belong to a partner gym?</SubHeading>
              <p>
                If your gym is a Fit Nation partner, it can publish programs and routines directly to
                its members. You'll see these in <strong>Plans → Program Library</strong> and in the
                browsable routines section. The app also shows your gym's branding (logo, colors) and
                your strength percentile is calculated against other members at the same gym.
              </p>

              <SubHeading>How do I clone a program from my gym's library?</SubHeading>
              <p>
                Go to <strong>Plans → Program Library</strong>, browse the available programs, and tap
                <strong> Clone program</strong>. A copy is added to your plans, and you can set it as
                active and track progress through it independently.
              </p>

              <SubHeading>Can I switch gyms?</SubHeading>
              <p>
                Partner assignment is set during registration and is currently linked to your account.
                If you need to change your gym, email{' '}
                <a href="mailto:support@fitnation.mk" style={{ color: 'var(--color-primary)' }}>
                  support@fitnation.mk
                </a>{' '}
                and we'll sort it out for you.
              </p>
            </Section>

            <Section id="data-privacy" number={7} title="Data, privacy & deletion">
              <SubHeading>What data does Fit Nation collect?</SubHeading>
              <p>
                We collect the information you give us directly: name, email, fitness profile (goal,
                age, gender, height, weight, experience, schedule), and your workout logs (exercises,
                sets, reps, weight). We don't use advertising or analytics trackers. Full details are
                in our{' '}
                <Link to="/privacy" style={{ color: 'var(--color-primary)' }}>
                  Privacy Policy
                </Link>
                .
              </p>

              <SubHeading>How do I export my data?</SubHeading>
              <p>
                You have the right to request a copy of all personal data we hold about you. Email{' '}
                <a href="mailto:support@fitnation.mk" style={{ color: 'var(--color-primary)' }}>
                  support@fitnation.mk
                </a>{' '}
                with the subject line "Data export request" and we'll respond within 30 days.
              </p>

              <SubHeading>How do I delete my account and all my data?</SubHeading>
              <p>
                You can delete your account in-app via <strong>Profile → Settings → Delete account</strong>.
                This permanently removes your personal data, fitness profile, and training history.
                You can also request deletion by emailing us at{' '}
                <a href="mailto:support@fitnation.mk" style={{ color: 'var(--color-primary)' }}>
                  support@fitnation.mk
                </a>
                . We process deletion requests within 30 days.
              </p>

              <SubHeading>Where is my data stored?</SubHeading>
              <p>
                Your data is stored on Amazon Web Services infrastructure in Frankfurt, Germany (EU).
                See our{' '}
                <Link to="/privacy#international-transfers" style={{ color: 'var(--color-primary)' }}>
                  Privacy Policy
                </Link>{' '}
                for full details on international transfers and security measures.
              </p>
            </Section>

            <Section id="troubleshooting" number={8} title="Troubleshooting">
              <SubHeading>The app won't sign me in.</SubHeading>
              <p>
                First, double-check your email and password are correct. If you've forgotten your
                password, use the <strong>Forgot password</strong> link on the sign-in screen. If
                your email isn't verified, you'll need to complete verification before you can sign in.
                If none of these apply, try force-quitting and reopening the app, or uninstalling and
                reinstalling. If the issue persists, email us with your device model and OS version.
              </p>

              <SubHeading>A workout video won't play.</SubHeading>
              <p>
                Exercise videos require a network connection — they aren't cached offline. Check your
                internet connection and try again. If you're on a fast connection and videos still
                won't load, try force-quitting and reopening the app. If the problem continues, let us
                know the exercise name and your device model.
              </p>

              <SubHeading>The app crashed — what should I include in a bug report?</SubHeading>
              <p>
                Email{' '}
                <a href="mailto:support@fitnation.mk" style={{ color: 'var(--color-primary)' }}>
                  support@fitnation.mk
                </a>{' '}
                with:
              </p>
              <ul>
                <li>Your device model (e.g., iPhone 15 Pro, Samsung Galaxy S24)</li>
                <li>Operating system version (e.g., iOS 18.3, Android 15)</li>
                <li>App version (visible in Profile → Settings)</li>
                <li>What you were doing when it crashed</li>
                <li>Whether it happens consistently or only sometimes</li>
              </ul>
              <p>Screenshots or screen recordings are always helpful.</p>
            </Section>

            <Section id="contact-us" number={9} title="Contact us">
              <p>
                Didn't find what you were looking for? We're happy to help directly.
              </p>

              <SubHeading>General support</SubHeading>
              <p>
                Email:{' '}
                <a
                  href="mailto:support@fitnation.mk"
                  className="font-semibold transition-opacity hover:opacity-80"
                  style={{ color: 'var(--color-primary)' }}
                >
                  support@fitnation.mk
                </a>
                <br />
                Response time: typically 24–48 hours, Monday to Friday.
              </p>

              <SubHeading>Reporting a security issue</SubHeading>
              <p>
                If you've discovered a security vulnerability, please email{' '}
                <a href="mailto:support@fitnation.mk" style={{ color: 'var(--color-primary)' }}>
                  support@fitnation.mk
                </a>{' '}
                with "Security" in the subject line. Please do not disclose the issue publicly until
                we've had a chance to review and address it.
              </p>

              <SubHeading>Legal entity</SubHeading>
              <p>
                Fit Nation is operated by <strong>Mayst Impact DOOEL</strong>, Skopje, North Macedonia.
                For privacy-related requests and GDPR inquiries, please refer to our{' '}
                <Link to="/privacy" style={{ color: 'var(--color-primary)' }}>
                  Privacy Policy
                </Link>{' '}
                or contact us at the email above.
              </p>
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
              <Link to="/terms" style={{ color: 'var(--color-primary)' }}>Terms of Service</Link>
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
