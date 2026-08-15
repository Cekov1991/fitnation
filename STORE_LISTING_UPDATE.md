# US Store Listing Update — Android & iOS

What has to change in Google Play Console and App Store Connect to ship the
US direct-to-consumer listing. The copy itself lives in `APP_STORE_COPY.txt`
(rewritten in PR #47); iOS release mechanics are in `APP_STORE_DEPLOY.md`.

**Blocked-on map:** screenshots wait for imperial units (punch list 04),
Marketing URL waits for the landing page (09), Support/Privacy URLs may move
with the US domain decision (10), privacy forms change again with analytics (06).

## What changed in the copy

| Field | Store | Old | New |
|---|---|---|---|
| App name | both | Fit Nation: The Movement | unchanged |
| Subtitle | iOS | Train. Belong. Rise. | Workout Plans & Gym Tracker |
| Promotional text | iOS | "...official app of premium gyms across North Macedonia." | consumer pitch: program + progression + PRs |
| Short description | Play | "...Premium gyms, MK." (82 chars — over the 80 limit) | "Personal training plans, fast set logging, and progression that earns PRs." (74) |
| Keywords | iOS | included gym, tracker, planner, community | deduped vs name/subtitle; added weights, bodybuilding, barbell |
| Description | both | gym-equipment + trainer-program positioning | consumer-first: generated program, fast logging, progression engine |
| What's new | both | v1.0 notes with gym/trainer bullets | US-launch notes, gym-neutral |
| Screenshots | both | show kg | **unchanged for now** — reshoot after punch list 04 |

## Android — Google Play Console

App: `com.fitnation.app`.

### 1. Decide: main listing vs. custom listing

The main store listing is what every country sees, including North Macedonia.
Two ways to roll out the consumer copy:

- **Option A (recommended):** put the new consumer copy on the **Main store
  listing** (it serves the US and everywhere else), and create a **custom
  store listing targeted at North Macedonia** that keeps the gym-partnership
  copy for the existing MK audience. Console: *Grow users → Store presence →
  Custom store listings*.
- **Option B:** leave main as-is and create a US-targeted custom listing.
  Not recommended — every other country keeps seeing MK gym positioning.

### 2. Update the listing text

*Grow users → Store presence → Main store listing* → paste the new short and
full description from `APP_STORE_COPY.txt` → **Save** → publish (via
*Publishing overview* if managed publishing is on).

- Text-only listing edits do **not** require an app release.
- They do go through Google review — typically hours, occasionally days.

### 3. Release notes

"What's new" rides the next production release: *Release → Production →
Create new release* → paste the US-launch notes.

### 4. Country availability

*Release → Production → Countries / regions* → confirm **United States** is
included; add it if not.

### 5. Declarations to re-verify while in Console (*Policy → App content*)

- **Data safety** — must match the privacy policy: account email + health &
  fitness data collected, no tracking, no third-party sharing. Re-do this
  form when punch list 06 adds analytics/crash reporting.
- Content rating questionnaire — current for Health & Fitness.
- Health apps declaration — answer if prompted (fitness category).
- Ads declaration — app contains no ads.

### 6. Screenshots + feature graphic (later — blocked on punch list 04)

- Phone screenshots: 2–8, PNG/JPEG, shortest side ≥ 320 px, longest ≤ 3840 px.
- Feature graphic: 1024 × 500 (needed for most promotional placements).
- 7" / 10" tablet sets if we keep claiming tablet support.

## iOS — App Store Connect

Apple ID `6766201705`, account `cstefan1991@gmail.com`, bundle
`com.fitnation.app`.

**Key mechanic:** Name, Subtitle, Description, Keywords, and Screenshots are
**version-locked** — they can only change by submitting a new app version for
review. **Promotional Text is the exception** — editable any time, no review.

### 1. Today, without a release

- **Promotional Text:** *App Store tab → current version → Promotional Text*
  → paste the new promo line from `APP_STORE_COPY.txt`.

### 2. With the next version submission

Follow `APP_STORE_DEPLOY.md` (bump version → EAS build → submit → create the
version in ASC), and before *Add for Review* paste from `APP_STORE_COPY.txt`:

- Subtitle → "Workout Plans & Gym Tracker"
- Description (full rewrite)
- Keywords (98-char deduped set)
- What's New → US-launch notes

Practical sequencing: bundle this with the imperial-units release (punch
list 04) — that release also unblocks the screenshot reshoot, so the whole
listing updates in one review cycle.

### 3. Availability

*Pricing and Availability → Territories* → confirm **United States** is
selected (the live listing link currently used is the `/mk/` storefront —
verify rather than assume).

### 4. App Privacy labels

Verify the labels match the policy: no tracking, no third-party analytics.
Re-do together with the Play Data safety form when punch list 06 lands.

### 5. URLs

- Support URL / Privacy Policy URL: currently `fitnation.mk` pages — revisit
  with the US domain decision (punch list 10).
- Marketing URL: add when the landing page ships at the root (punch list 09).

### 6. Screenshots (later — blocked on punch list 04)

- Required sets: **6.9" iPhone** (1290 × 2796 or 1320 × 2868) and — because
  `apps/mobile/app.json` sets `supportsTablet: true` — **13" iPad**
  (2064 × 2752 or 2048 × 2732). Up to 10 per size; smaller devices scale down
  from these automatically.

## Checklist

- [ ] Play: choose main-vs-custom listing strategy (rec: main = consumer copy, MK custom keeps gym copy)
- [ ] Play: update short + full description, send for review
- [ ] Play: confirm United States under Countries / regions
- [ ] Play: re-verify Data safety, content rating, health/ads declarations
- [ ] iOS: update Promotional Text (no release needed)
- [ ] iOS: bundle Subtitle / Description / Keywords / What's New into the next version submission
- [ ] iOS: confirm United States under Territories
- [ ] iOS: verify App Privacy labels
- [ ] Both, after punch list 04: reshoot screenshots (+ Play feature graphic, iPad set)
- [ ] Both, after punch list 06: update Data safety + App Privacy for analytics/crash reporting
- [ ] Both, after punch list 09/10: Marketing/Support/Privacy URLs
