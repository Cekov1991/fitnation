// Generates src/generated/*.ts from content/*.md.
//
//   node scripts/build.mjs           regenerate
//   node scripts/build.mjs --check   fail if the generated files are stale
//
// content/*.md is the single source of truth for the legal text, shared by
// apps/web and apps/landing_page. Run this after editing it and commit both the
// markdown and the generated output.
//
// The markdown accepted here is a deliberately closed subset — this file is the
// spec. There is no markdown dependency because the input is not arbitrary
// markdown, and a hand-rolled parser for a closed grammar that throws on
// anything unexpected is safer than silently mis-rendering a legal document.
//
//   ---                       front matter, required, first
//   title: <text>
//   lastUpdated: <text>
//   ---
//   <paragraph>               lead paragraphs, before any heading
//   ## <title> {#<anchor-id>} section heading (one line)
//   ### <title>               sub-heading within a section (one line)
//   <paragraph>
//   - <item>                  consecutive `- ` lines form one list
//
// Blocks are separated by blank lines. Within a block, a wrapped line continues
// the previous line and is joined to it with a single space, so long paragraphs
// and long list items can be hard-wrapped at a sane width. A continuation line
// inside a list must not itself start with `- `.
//
//   inline: **bold**, `code`, [text](target). No nesting.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

/** Split a line of inline markdown into spans. Throws on unknown syntax. */
function spans(line, slug = '?') {
  const out = [];
  const re = /\*\*(.+?)\*\*|`(.+?)`|\[(.*?)\]\((.*?)\)/g;
  let last = 0;
  for (let m; (m = re.exec(line)); ) {
    if (m.index > last) out.push({ text: line.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ text: m[1], bold: true });
    else if (m[2] !== undefined) out.push({ text: m[2], code: true });
    else out.push({ text: m[3], href: m[4] });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last) });

  for (const s of out) {
    const stray = s.text.match(/\*\*|`|\[|\]\(/);
    if (stray) throw new Error(`${slug}: unparsed inline markup "${stray[0]}" in: ${line}`);
  }
  return out;
}

function parse(slug, src) {
  const fm = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) throw new Error(`${slug}: missing front matter`);
  const meta = {};
  for (const line of fm[1].split('\n')) {
    const m = line.match(/^([A-Za-z]+):\s*(.+)$/);
    if (!m) throw new Error(`${slug}: bad front matter line: ${line}`);
    meta[m[1]] = m[2].trim();
  }
  for (const k of ['title', 'lastUpdated']) {
    if (!meta[k]) throw new Error(`${slug}: front matter missing ${k}`);
  }

  const chunks = src
    .slice(fm[0].length)
    .split(/\n\s*\n/)
    .map((c) => c.replace(/^[\r\n]+/, '').replace(/\s+$/, ''))
    .filter((c) => c.trim());

  const lead = [];
  const sections = [];
  let cur = null; // null => still in the lead
  const target = () => (cur ? cur.blocks : lead);

  /** Join hard-wrapped continuation lines into logical lines. */
  const unwrap = (chunk, isListItem) => {
    const out = [];
    for (const raw of chunk.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      const starts = isListItem ? line.startsWith('- ') : out.length === 0;
      if (starts || out.length === 0) out.push(line);
      else out[out.length - 1] += ' ' + line;
    }
    return out;
  };

  for (const chunk of chunks) {
    const first = chunk.split('\n')[0].trim();

    const h2 = first.match(/^## (.+?) \{#([a-z0-9-]+)\}$/);
    if (h2) {
      if (chunk.includes('\n')) throw new Error(`${slug}: section heading must be one line: ${first}`);
      cur = { id: h2[2], number: sections.length + 1, title: h2[1], blocks: [] };
      sections.push(cur);
      continue;
    }
    const h3 = first.match(/^### (.+)$/);
    if (h3) {
      if (chunk.includes('\n')) throw new Error(`${slug}: sub-heading must be one line: ${first}`);
      target().push({ kind: 'h3', spans: spans(h3[1], slug) });
      continue;
    }
    if (first.startsWith('- ')) {
      const items = unwrap(chunk, true).map((l) => {
        if (!l.startsWith('- ')) throw new Error(`${slug}: expected a list item: ${l}`);
        return spans(l.slice(2), slug);
      });
      target().push({ kind: 'ul', items });
      continue;
    }
    if (first.startsWith('#')) throw new Error(`${slug}: unsupported heading: ${first}`);
    // A paragraph chunk must not contain a list or heading line.
    for (const l of chunk.split('\n').map((x) => x.trim())) {
      if (l.startsWith('- ') || l.startsWith('#')) {
        throw new Error(`${slug}: blank line needed before "${l}" — it is inside a paragraph`);
      }
    }
    target().push({ kind: 'p', spans: spans(unwrap(chunk, false)[0], slug) });
  }

  if (!sections.length) throw new Error(`${slug}: no sections found`);
  const dupes = sections.map((s) => s.id).filter((id, n, a) => a.indexOf(id) !== n);
  if (dupes.length) throw new Error(`${slug}: duplicate anchor id(s): ${dupes.join(', ')}`);

  return { slug, title: meta.title, lastUpdated: meta.lastUpdated, lead, sections };
}

const banner = (slug) =>
  `// GENERATED FILE — do not edit.\n` +
  `// Source: packages/legal/content/${slug}.md\n` +
  `// Regenerate: pnpm --filter @fit-nation/legal build\n\n` +
  `import type { LegalDocument } from '../types';\n\n`;

let stale = [];
const files = (await readdir(join(ROOT, 'content'))).filter((f) => f.endsWith('.md')).sort();
for (const file of files) {
  const slug = file.replace(/\.md$/, '');
  const doc = parse(slug, await readFile(join(ROOT, 'content', file), 'utf8'));
  const ident = slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const body =
    banner(slug) +
    `export const ${ident}: LegalDocument = ${JSON.stringify(doc, null, 2)};\n`;
  const dest = join(ROOT, 'src', 'generated', `${slug}.ts`);
  const prev = await readFile(dest, 'utf8').catch(() => null);
  if (prev !== body) {
    if (CHECK) stale.push(`${slug}.ts`);
    else {
      await writeFile(dest, body);
      console.log(
        `[legal] wrote src/generated/${slug}.ts — ${doc.sections.length} sections, ` +
          `updated ${doc.lastUpdated}`,
      );
    }
  } else if (!CHECK) {
    console.log(`[legal] src/generated/${slug}.ts already up to date`);
  }
}

if (CHECK && stale.length) {
  console.error(
    `[legal] stale generated file(s): ${stale.join(', ')}\n` +
      `        run: pnpm --filter @fit-nation/legal build`,
  );
  process.exit(1);
}
if (CHECK) console.log('[legal] generated files are up to date');
