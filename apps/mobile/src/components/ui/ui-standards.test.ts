import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Structural guards for the mobile UI standards in apps/mobile/CLAUDE.md.
 *
 * Each rule names a shared component that owns a piece of UI and fails on the
 * textual signature of a hand-rolled copy in a screen. They are source scans
 * rather than render tests because no `.tsx` is reachable from the
 * node-environment test setup, and the failure being guarded — someone pastes
 * the markup again instead of importing the component — is textual anyway.
 *
 * An allow-list entry needs a reason next to it. If a rule fights a real
 * design need, extend the component; do not widen the allow-list.
 */

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCREENS = join(SRC, 'screens');

function files(dir: string, ext = '.tsx'): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...files(path, ext));
    else if (entry.endsWith(ext)) out.push(path);
  }
  return out;
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

/** Every `file:line — match` for `pattern` in the given files, skipping allow-listed relative paths. */
function offenders(paths: string[], pattern: RegExp, allow: Set<string> = new Set()): string[] {
  const hits: string[] = [];
  for (const file of paths) {
    const rel = relative(SRC, file);
    if (allow.has(rel)) continue;
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(pattern)) {
      hits.push(`${rel}:${lineOf(source, match.index ?? 0)} — ${match[0].trim().slice(0, 80)}`);
    }
  }
  return hits;
}

const screens = () => files(SCREENS);
const everything = () => files(SRC).filter((f) => !f.endsWith('.test.tsx'));

describe('ui standards', () => {
  it('screens render their header with <ScreenHeader>, not an ArrowLeft of their own', () => {
    // ArrowLeft is the back icon and only ScreenHeader draws it. ChevronLeft is fine: it pairs
    // with ChevronRight in pagers (the progress calendar's previous week).
    expect(offenders(screens(), /\bArrowLeft\b/g)).toEqual([]);
  });

  it('screens do not hand-roll a CTA button (use <Button>)', () => {
    // A TouchableOpacity styled like a full-width pill: py-4 with a rounded corner class …
    const nativewind = /className="[^"]*\b(?:py-4[^"]*rounded-(?:xl|2xl)|rounded-(?:xl|2xl)[^"]*py-4)\b[^"]*"/g;
    // … or the brand gradient wrapped around padding.
    const gradient = /<LinearGradient[^>]*colors=\{\[colors\.primary,\s*colors\.secondary\]\}/g;
    const allow = new Set<string>([
      // The dashboard's partner logo tile is a gradient square, not a button.
      'screens/placeholders/DashboardScreen.tsx',
      // The summary's Award medallion is an 80px decorative gradient disc, not a button.
      'screens/placeholders/WorkoutSummaryScreen.tsx',
    ]);
    const gradientOwners = new Set<string>([
      ...allow,
      'components/ui/Button.tsx',
      // Brand-gradient surfaces (cards, the tab strip's active pill, the timer ring), not buttons.
      'components/ui/GradientText.tsx',
      'components/ui/WorkoutTemplateSelector.tsx',
      'components/workout-session/RestTimer.tsx',
      'components/workout-session/SetLogCard.tsx',
      'components/workout-session/SetEditCard.tsx',
      'components/progress/BalanceModal.tsx',
      'components/progress/StrengthScoreModal.tsx',
      'components/progress/WeeklyProgressModal.tsx',
      'screens/placeholders/WorkoutSummaryScreen.tsx',
    ]);
    expect([...offenders(everything(), nativewind), ...offenders(everything(), gradient, gradientOwners)]).toEqual([]);
  });

  it('screens do not hand-roll retry or empty states (use <ErrorState> / <EmptyState>)', () => {
    // "Retry" drawn by hand — a <Text> or a string literal — not a <Button label="Try Again"> or a prop.
    const retry = /(>\s*(?:Retry|Try again|Try Again)\s*<|(?<!(?:label|title|message|confirmLabel|cancelLabel)=)['"](?:Retry|Try again|Try Again)['"])/g;
    // A "No … found" sentence rendered directly — not one passed as a prop to EmptyState/ErrorState.
    const empty = /(?<!(?:title|description|message|label)=)(?:>|['"`])\s*No [a-z ]+ (?:found|yet|available|in this [a-z]+)\.?\s*(?:<|['"`])/g;
    expect([...offenders(screens(), retry), ...offenders(screens(), empty)]).toEqual([]);
  });

  it('screens do not hand-roll a dashed "add" tile or a 24-radius card (use <Button variant="dashed"> / <Card variant="summary">)', () => {
    const dashed = /border-dashed|borderStyle:\s*'dashed'/g;
    const bigRadius = /\bborderRadius:\s*24\b|\brounded-3xl\b/g;
    const allow = new Set<string>([
      // The plan carousel's "Create New" is a 160×140 card-shaped tile in a horizontal list, not a button.
      'screens/placeholders/DashboardScreen.tsx',
    ]);
    expect([...offenders(screens(), dashed, allow), ...offenders(screens(), bigRadius)]).toEqual([]);
  });

  it('profile questions are asked by the sections in components/profile, not re-drawn in screens', () => {
    // Rendering the option lists directly is the signature of a re-drawn goal / experience / days / units picker.
    const optionMap = /\b(?:FITNESS_GOAL_OPTIONS|TRAINING_EXPERIENCE_OPTIONS|WORKOUT_DURATION_OPTIONS|TRAINING_DAYS_OPTIONS|UNIT_OPTIONS)\.map\(/g;
    const allow = new Set<string>([
      // The plan-adjust sheet is a plan action, not a profile edit; it has its own compact pickers.
      'components/ui/AdjustPlanSheet.tsx',
    ]);
    expect(offenders(everything().filter((f) => !f.includes('/components/profile/')), optionMap, allow)).toEqual([]);
  });

  it('screens use SCREEN.paddingX for their gutter, not a literal', () => {
    // 20 and 24 were the strays; 16 matches the token and is tolerated inline.
    const literal = /\b(?:paddingHorizontal:\s*(?:20|24)\b|px-[56]\b)/g;
    expect(offenders(screens(), literal)).toEqual([]);
  });

  it('small-caps captions are <SectionLabel>', () => {
    const nativewind = /className="[^"]*\buppercase\b[^"]*"/g;
    const stylesheet = /textTransform:\s*'uppercase'/g;
    const allow = new Set<string>([
      'components/ui/SectionLabel.tsx',
      // Button labels on the dark plan-building scene are deliberately set in caps.
      'components/ui/PlanGeneratingOverlay.tsx',
    ]);
    expect([...offenders(everything(), nativewind, allow), ...offenders(everything(), stylesheet, allow)]).toEqual([]);
  });

  it('colours come from the theme, not literals', () => {
    // Hex or rgb(a) anywhere outside the theme file. shadowColor black is the platform default and is fine.
    const literal = /(?<!shadowColor:\s*)(?:'|"|`)(?:#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))(?:'|"|`)/g;
    const whiteClass = /\btext-white\b/g;
    const allow = new Set<string>([
      'constants/theme.ts',
      // Renders when the theme provider itself may have crashed.
      'components/ui/error-boundary.tsx',
      // Google's brand mark; its colours are Google's.
      'components/ui/SocialAuthButtons.tsx',
      // A single dark scene shared by onboarding and plan regeneration; owns its palette by design.
      'components/ui/PlanGeneratingOverlay.tsx',
    ]);
    const paths = everything().concat(files(SRC, '.ts').filter((f) => !f.endsWith('.test.ts')));
    expect([...offenders(paths, literal, allow), ...offenders(paths, whiteClass, allow)]).toEqual([]);
  });
});
