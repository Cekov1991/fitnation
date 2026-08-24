import dashboard360 from "@/assets/dashboard-360.webp";
import dashboard720 from "@/assets/dashboard-720.webp";
import smartWorkout360 from "@/assets/smart-workout-360.webp";
import smartWorkout720 from "@/assets/smart-workout-720.webp";
import workoutPreview360 from "@/assets/workout-preview-360.webp";
import workoutPreview720 from "@/assets/workout-preview-720.webp";
import logging360 from "@/assets/logging-360.webp";
import logging720 from "@/assets/logging-720.webp";
import catalog360 from "@/assets/catalog-360.webp";
import catalog720 from "@/assets/catalog-720.webp";
import guidance360 from "@/assets/guidance-360.webp";
import guidance720 from "@/assets/guidance-720.webp";
import icon from "@/assets/fitnation-icon.png";

/**
 * A phone screenshot in the two widths `scripts/optimize-images.mjs` emits.
 * Masters live in `src/assets/originals/` and are not imported anywhere, so
 * they never reach the bundle — run `pnpm images` after changing one.
 */
export type Shot = {
  /** Largest variant. Also the fallback for anything ignoring srcSet. */
  src: string;
  srcSet: string;
  width: number;
  height: number;
};

// Every master shares the same aspect within a rounding error, so the encoder
// forces one exact size for all of them. Consumers need these on the <img> to
// reserve the box before the bytes land — without them a lazy tile is zero-high
// and the page reflows as each one decodes.
const SHOT_WIDTH = 720;
const SHOT_HEIGHT = 1560;

const shot = (w360: string, w720: string): Shot => ({
  src: w720,
  srcSet: `${w360} 360w, ${w720} 720w`,
  width: SHOT_WIDTH,
  height: SHOT_HEIGHT,
});

const dashboard = shot(dashboard360, dashboard720);
const smartWorkout = shot(smartWorkout360, smartWorkout720);
const workoutPreview = shot(workoutPreview360, workoutPreview720);
const logging = shot(logging360, logging720);
const catalog = shot(catalog360, catalog720);
const guidance = shot(guidance360, guidance720);

// Canonical origin, no trailing slash. Used for canonical/og:url and anywhere
// else an absolute URL is required. Keep in sync with `sitemap.host` in
// vite.config.ts.
export const SITE_URL = "https://joinfitnation.com";

export const APP_STORE_URL = "https://apps.apple.com/mk/app/fit-nation-the-movement/id6766201705";
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.fitnation.app";

export const logoUrl = icon;
export const heroShot = dashboard;

export const features = [
  {
    title: "A program built around you",
    body: "Pick your goal, level and how many days you can train. Fit Nation builds the weekly plan and keeps it moving forward.",
    image: dashboard,
    alt: "Fit Nation dashboard showing a personalized muscle gain program with Day 1 Push Day",
  },
  {
    title: "Smart Workout in seconds",
    body: "No time to think? Choose push, pull, legs or full body, set a duration, and get a complete session instantly.",
    image: smartWorkout,
    alt: "Smart Workout screen with quick select workout types and duration options",
  },
  {
    title: "Review before you lift",
    body: "See every exercise, sets and reps up front. Reorder, swap, add your own, or regenerate the whole session.",
    image: workoutPreview,
    alt: "Workout preview listing five exercises with sets, reps and weights before starting",
  },
  {
    title: "Log every set",
    body: "Weight, reps and rest tracked set by set, with suggested starting weights the first time you try an exercise.",
    image: logging,
    alt: "Active workout screen logging weight and reps for set one of barbell bench press",
  },
  {
    title: "A full exercise catalog",
    body: "Search hundreds of movements filtered by muscle group and equipment — barbell, dumbbell, cable or machine.",
    image: catalog,
    alt: "Exercise catalog with search and filters for muscle group and equipment",
  },
  {
    title: "Know what you are training",
    body: "Real demo footage, primary and secondary muscles, and step-by-step guidance for every exercise.",
    image: guidance,
    alt: "Exercise guidance screen showing demo video and muscles worked diagram",
  },
];

export const steps = [
  {
    n: "01",
    title: "Set your goal",
    body: "Muscle gain, fat loss or strength. Tell us your level and your weekly availability.",
  },
  {
    n: "02",
    title: "Get your plan",
    body: "A structured multi-week program lands on your dashboard, day by day.",
  },
  {
    n: "03",
    title: "Train and progress",
    body: "Log your sets, watch your numbers climb, and let the plan adapt as you get stronger.",
  },
];

export const values = [
  { title: "Accessible", body: "Coaching quality guidance without the coaching price tag." },
  {
    title: "Personal",
    body: "Plans shaped by your goal, level and schedule — not a generic template.",
  },
  {
    title: "Simple",
    body: "Open the app, see today's session, start lifting. That is the whole flow.",
  },
  { title: "Progressive", body: "Every logged set feeds the next one. Progress is the product." },
];

export const faqs = [
  {
    q: "Is this cheaper than a personal trainer?",
    a: "Far cheaper. Fit Nation gives you a structured program, exercise guidance and progress tracking for a fraction of what in-person coaching costs.",
  },
  {
    q: "I have never trained before. Is it for me?",
    a: "Yes. Choose the beginner level and you get manageable sessions, suggested starting weights and demo footage for every movement.",
  },
  {
    q: "What equipment do I need?",
    a: "Filter the catalog by what you have — barbell, dumbbell, cable, machine or bodyweight. Your plan is built from movements you can actually do.",
  },
  {
    q: "How much time does a session take?",
    a: "You choose: 20-30, 30-45, 45-60, 60-90 or 90+ minutes. Sessions are built to fit the window you pick.",
  },
  {
    q: "Can coaches use Fit Nation with clients?",
    a: "Yes. Coaches can build programs, manage clients and follow their real training data instead of guessing between sessions.",
  },
];
