// Regenerates the WebP variants in `src/assets/` from the masters in
// `src/assets/originals/`. Run it after replacing or adding a screenshot:
//
//   pnpm images
//
// Why this exists rather than a Vite image plugin: the build is a plain static
// prerender with no image pipeline, and adding one would mean a new workspace
// dependency and a lockfile bump (Vercel installs frozen — see CLAUDE.md).
// Checked-in derivatives keep the build a pure `vite build`.
//
// Nothing imports from `originals/`, so those files are never emitted into
// `dist/` — Vite only bundles assets something actually imports. Keep the
// masters there anyway: a downscale is lossy and cannot be undone.
//
// Requires cwebp (`brew install webp`). This is a maintenance script, not part
// of `pnpm build`, so it is not a CI dependency.
import { execFile } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const SRC = "src/assets/originals";
const OUT = "src/assets";

// Quality 82 was picked by eye against the masters at 1:1 — UI text stays crisp
// and the gradient cards do not band. Below ~78 the gradients start to posterize.
const QUALITY = "82";

/*
 * Phone screenshots. Every master is 887x1920 or 739x1600, i.e. the same 0.462
 * aspect within a rounding error, so all variants are forced to one exact size.
 * That keeps the srcset candidates aspect-consistent and lets one width/height
 * pair describe every shot.
 *
 * Widths: the largest slot on the page is the hero phone at ~322 CSS px, so 720w
 * covers it at 2x and very nearly at 3x. 360w is what a 2x device pulls for the
 * 180px feature tiles.
 */
const SHOTS = {
  files: ["dashboard", "smart-workout", "workout-preview", "logging", "catalog", "guidance"],
  ext: ".jpeg",
  variants: [
    { w: 360, h: 780 },
    { w: 720, h: 1560 },
  ],
};

/*
 * Store badges render at 42px tall (140px wide at the badge's 800x240 aspect),
 * so 420x126 is a 3x asset. One variant only — at this size a second candidate
 * would save a couple of kB. Alpha is preserved; the badges sit on a black pill.
 */
const BADGES = {
  files: ["app-store-badge", "google-play-badge"],
  ext: ".png",
  variants: [{ w: 420, h: 126 }],
};

async function size(path) {
  return (await stat(path)).size;
}

async function encode(group) {
  const results = [];
  for (const name of group.files) {
    const from = join(SRC, name + group.ext);
    const masterBytes = await size(from);
    let outBytes = 0;

    for (const { w, h } of group.variants) {
      const to = join(OUT, `${name}-${w}.webp`);
      await run("cwebp", [
        "-quiet",
        "-q",
        QUALITY,
        // -m 6 is the slowest/densest search. This runs by hand, not per build.
        "-m",
        "6",
        // Sharper chroma downsampling; visibly cleaner on colored text and the
        // brand gradient edges.
        "-sharp_yuv",
        "-resize",
        String(w),
        String(h),
        from,
        "-o",
        to,
      ]);
      outBytes += await size(to);
    }
    results.push({ name, masterBytes, outBytes });
  }
  return results;
}

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

const rows = [...(await encode(SHOTS)), ...(await encode(BADGES))];

let master = 0;
let out = 0;
for (const r of rows) {
  master += r.masterBytes;
  out += r.outBytes;
  console.log(`  ${r.name.padEnd(18)} ${kb(r.masterBytes).padStart(9)} -> ${kb(r.outBytes)}`);
}
console.log(`\n  ${"total".padEnd(18)} ${kb(master).padStart(9)} -> ${kb(out)}`);

// Catch a master that was added but never wired into the lists above — it would
// silently keep shipping at full size, or not ship at all.
const known = new Set([...SHOTS.files, ...BADGES.files]);
const stray = (await readdir(SRC)).filter((f) => !known.has(f.replace(/\.[^.]+$/, "")));
if (stray.length) {
  throw new Error(
    `Masters in ${SRC} with no entry in this script: ${stray.join(", ")}. ` +
      `Add them to SHOTS or BADGES, or delete them.`,
  );
}
