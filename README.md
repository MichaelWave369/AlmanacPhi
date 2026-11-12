# AlmanacΦ

**Grow with the rhythms. Guided by evidence.**

AlmanacPhi is a free, open-source farmer's almanac built as a lightweight offline-capable web app. It helps gardeners decide **what to plant, when to plant it, how to care for it**, and how to notice the changing seasons, sun and Moon without confusing traditions for validated horticultural science.

## What's in v0.8

- **19 crop guides**: vegetables, herbs, flowers, and roots, with seed depth, spacing, light, soil temperatures, water, feeding, harvest, common issues, and growing tips.
- **Harvest-to-pantry preservation library**: 8 research-linked method guides, crop-specific pathways across all 19 crops, canning safety boundaries and seed-saving guidance.
- **Harvest Kitchen**: 16 original cook-now recipes covering every crop, serving-size scaling, searchable seasonal filters, and a private meal planner with JSON and per-meal shopping-list exports.
- **Harvest Ledger**: link garden plantings to measured yields, track explicit cooking/preservation/sharing/compost allocations without overspending, and filter recipes based on crops still on hand. Export a local JSON ledger.
- **Harvest-to-Pantry Bridge**: one explicit preservation transfer both allocates a harvest quantity and creates its linked pantry batch, without a second independent storage write. Linked batches show their provenance in the Pantry Ledger.
- **Pantry Stock Ledger**: optional, explicit whole-container counts for linked and standalone pantry batches; track use, sharing and disposal without overdraw, and undo the latest mistaken removal.
- **Pantry-Aware Kitchen**: browse recipes matching crops with recorded positive pantry container counts, review exact linked/standalone pantry batches from recipe details, and see cautious pantry hints on meal plans and shopping lists.
- **Cooking Session Ledger**: start a cooking record from a recipe or meal plan; explicitly deduct fresh harvest quantities or counted pantry containers one action at a time, with an auditable per-meal activity history.
- **Private pantry ledger**: record preservation batches and export their JSON history; shelf-stable canning entries require a recipe URL for the log (not a guarantee of process safety).
- **Editable planting calendar**: crop windows calculated relative to your manually entered last spring and first fall frost dates.
- **Sunlight explorer**: approximate day length calculated from an editable Northern Hemisphere latitude.
- **Lunar explorer**: approximate phase, illumination, and waxing/waning status with lunar planting tradition clearly identified as unproven folklore.
- **Private garden journal**: track crops, beds, dates, notes and harvest status. Export a JSON backup at any time.
- **Static, dependency-free frontend**: no account, telemetry, remote database, or third-party JS. After the first successful load on HTTPS, the service worker caches the app for offline visits.

### Try it locally

Any static file server works:

```bash
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). The interface uses ES modules, so opening `index.html` as a `file://` URL is not supported.

### Publish on GitHub Pages

On GitHub, go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, then `main` and `/(root)`. Once enabled, the expected URL is:

https://michaelwave369.github.io/AlmanacPhi/

GitHub Pages must be enabled by a repository administrator. Pushing a PR does not automatically publish it.

### Run tests

```bash
npm test
```

Node.js 20+ is enough. No `npm install` is required.

## How to use the planting calendar

1. Find your **local average last spring frost** and **first fall frost** through a nearby extension office or climate record. Values shipped in the app are explicitly **illustrative**.
2. Enter those dates in `MM-DD` format. This release assumes a **Northern Hemisphere climate with spring's last frost before fall's first frost** in the same calendar year.
3. Set your latitude for day-length calculation, if desired. No GPS permission is requested or needed.
4. Browse crop-specific sowing, indoor-start, and transplant windows, then confirm actual conditions with a soil thermometer, forecast, and cultivar seed packet.
5. Record what you plant in the journal. Make regular JSON exports if the records matter to you; browser storage may be cleared by the device or browser.

**Critical limitations:** USDA plant hardiness zones indicate average extreme winter minimum temperatures for *perennial* survivability. They do not provide exact frost dates. Crop calendars are heuristics, not local weather forecasts or guarantees. Fall crops may require extra maturation time as daylight shortens. Days to maturity vary by cultivar and may be measured from transplant or sowing. No pesticide or chemical treatment instructions are implied.

## Cooking Session Ledger

[Cooking Sessions v0.8](./COOKING_SESSIONS.md) records the recipe, date and serving plan separately from the inventory. Each actual ingredient use writes **only to the authoritative Harvest or Pantry Ledger**, tagged with the session ID. This avoids silent deduction and mirrored balances. Completing a session does not deduct anything.

## Pantry-Aware Kitchen

The [Pantry-Aware Kitchen](./PANTRY_KITCHEN.md) offers **crop-name matches only**, with optional filtering to batches that have a positive tracked container balance. It never assumes sufficient ingredients, equivalent fresh/preserved forms, food safety, or automated deductions. Recipe and meal-plan views can take you to the precise Pantry record for inspection and explicit stock activity.

## Pantry Stock Ledger

[Pantry Stock v0.6](./PANTRY_STOCK.md) lets growers set explicit current container counts, record removals or donations, and correct mistakes. It never infers package counts from free-text descriptions or confuses remaining stock with safe-to-eat status. Older pantry entries remain valid without tracking.

## Harvest-to-Pantry Bridge

An explicit **Preserved or stored** harvest allocation can now include a linked pantry batch, with a crop-compatible method, packaged quantity, location and source link. Linked batches appear read-only in Pantry and are corrected or undone from Harvest so both views share one source of truth. **No automatic canning verification, shelf-life certification or finished-yield conversion is performed.** See [BRIDGE.md](./BRIDGE.md).

## Harvest Ledger and ingredient availability

The new [Harvest Ledger](./HARVEST.md) records actual crop quantities and a traceable allocation history. Weight units convert correctly, while counts are tracked separately. **Recipe plans and pantry entries never silently deduct quantities**; users record uses explicitly. The Kitchen offers matches with one or more available crops but does not guarantee enough ingredients or food safety.

## Harvest Kitchen (fresh cooking)

The [Harvest Kitchen](./KITCHEN.md) offers original recipes for prompt consumption or refrigeration, **never generalized home-canning processes**. Ingredient quantities scale for 2/4/6/8 servings. Its meal plan and shopping list stay in the browser. Follow USDA leftover handling advice.

## Preservation evidence standard

The new preservation section separates general growing/pantry education from **process-validated shelf-stable canning**. There are **no invented recipe amounts or generalized jar-processing times**. Low-acid foods require specific tested pressure-canning instructions, and acidified foods require the prescribed vinegar/lemon/citric acid and an altitude-correct processing schedule. An inventory entry does not establish safety. See [the preservation guide](./PRESERVATION.md) and the directly linked NCHFP/Extension references.

## Moon / sun evidence standard

The Moon's phases are astronomical facts. The approximately 29.53-day cycle in this app is computed with a mean synodic month referenced to a known new Moon, so phase dates can differ from a precise ephemeris by a day or so. Day length is a solar-declination / hour-angle approximation at a level horizon, not a clock-time sunrise or shade assessment. Neither feature accesses location or network data.

Claims that root crops grow better on a waning Moon or aboveground crops on a waxing Moon are treated as **optional cultural traditions**, not causal advice. A published critical review reports no reliable scientific evidence establishing lunar-phase planting benefits. Plant according to frost, soil, light, moisture and your circumstances before lunar tradition.

## Science and reference material

- [USDA 2023 Plant Hardiness Zone Map](https://planthardiness.ars.usda.gov/)
- [Colorado State University Extension: Vegetable Planting Guide](https://extension.colostate.edu/resource/vegetable-planting-guide/)
- [Rutgers Cooperative Extension: Starting Vegetable Seeds](https://extension.rutgers.edu/fs787)
- [University of California Master Gardener: Time of Planting](https://www.ucanr.edu/program/uc-master-gardener-program/time-planting)
- [Maryland Extension: When to Plant Vegetables](https://extension.umd.edu/resource/when-plant-vegetables)
- [Review: What Has Been Thought and Taught on the Lunar Influence on Plants in Agriculture?](https://www.mdpi.com/2073-4395/10/7/955)

## Roadmap

- Community-sourced extension citations and per-cultivar profiles.
- Local, provenance-aware weather and climate-station data with explicit source dates.
- Soil testing, irrigation reminders, and pest scouting checklists.
- Phenology, pollinator logs, seed saving, and indigenous/traditional knowledge with attribution and consent.
- Southern Hemisphere frost calendars and localized language/units support.
- Importable/syncable garden journals and optional PhiOS ecosystem integration.

## Privacy, accessibility and contributions

The app does not send garden names or journals anywhere. They live in browser `localStorage` until removed by the user or browser. The export JSON file is yours. Basic keyboard navigation, native dialogs, readable labels, reduced-motion support, and mobile layouts are included; accessibility testing should continue.

Contributions and corrections are welcome, especially with reputable extension/public-research sources, region/cultivar context, and reproducible observations. Avoid claims without evidence and do not mistake correlations with Moon phases for established causes.

**License:** see [LICENSE](./LICENSE).
