// Fixes up the static output after `vite build`. Both items work around
// TanStack Start's sitemap generator; drop this script if they get fixed
// upstream (check by inspecting dist/client/sitemap.xml after a build).
import { readFile, writeFile, rm, access } from "node:fs/promises";
import { join } from "node:path";

const OUT = "dist/client";

// 1. The sitemaps.org protocol namespace is the literal string
//    "http://www.sitemaps.org/schemas/sitemap/0.9". Start emits it with an
//    https scheme. XML namespaces are opaque strings, not URLs that get
//    fetched, so https is a *different* namespace — validators and Search
//    Console reject the file rather than reading it as a sitemap.
const sitemap = join(OUT, "sitemap.xml");
const WRONG = 'xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"';
const RIGHT = 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';

let xml = await readFile(sitemap, "utf8");
if (xml.includes(WRONG)) {
  await writeFile(sitemap, xml.replaceAll(WRONG, RIGHT));
  console.log("[postbuild] sitemap.xml: corrected xmlns to the http namespace");
} else if (!xml.includes(RIGHT)) {
  throw new Error(
    `[postbuild] ${sitemap} has neither the expected nor the known-bad sitemap ` +
      `namespace. Start's output format changed — re-check this workaround.`,
  );
} else {
  console.log("[postbuild] sitemap.xml: namespace already correct, workaround is now a no-op");
}

// 2. Start also writes pages.json next to the sitemap: build metadata (route
//    list, host, build timestamp) that nothing serves a purpose by publishing.
const pagesJson = join(OUT, "pages.json");
try {
  await access(pagesJson);
  await rm(pagesJson);
  console.log("[postbuild] removed pages.json (build metadata, not for publishing)");
} catch {
  // already absent
}
