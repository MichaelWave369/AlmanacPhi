# AlmanacΦ · Harvest Ledger (v0.4)

The **Harvest Ledger** turns "I planted tomatoes" into a local, traceable record of what was actually picked and how it was used. It connects to the existing Garden Journal and Harvest Kitchen without silently modifying other records.

## The harvest cycle

1. Log a planting in **My garden**. When you collect produce, use **Log yield** on that planting to preselect the crop and bed, or open **Harvest** directly.
2. Enter the harvest date, positive quantity, unit and notes. That creates a **harvest lot**.
3. When some of the produce is eaten, cooked, preserved, given away, spoiled or composted, select a lot and **Record use** with the amount and category. For preservation, optionally create a linked pantry batch as part of that same allocation.
4. Each recorded use is an **allocation**, reducing the lot's available balance. The app disallows spending more than remains.
5. The Harvest overview summarizes unallocated quantities by crop. Select **Find meals using this harvest** to filter the Kitchen to recipes matching at least one available crop.
6. Export the complete Harvest Ledger JSON when you need a backup.

**Important:** Kitchen meal plans and **standalone** Pantry Ledger batches do **not** automatically subtract stock. A **linked** pantry batch is created from its explicit harvest allocation in a single harvest record. No meal plan ever deducts harvest stock automatically. You can reference recipes or batch identifiers in the allocation notes. This prevents mysterious or inaccurate inventory changes.

## How quantities are handled

- Weight units: grams (\`g\`), kilograms (\`kg\`), ounces (\`oz\`), and pounds (\`lb\`). Conversion uses the standard exact definitions of avoirdupois pounds and ounces; internal calculations use grams.
- Count: \`each\`, for individual items. **Never converted to weight**. For a stock summary, a crop may therefore show both pounds and individual items separately.
- Each lot retains its original unit. The "Record use" form uses the **same unit as the selected lot**, to avoid ambiguous conversions.
- Available balance = amount picked minus all explicit allocations, converted to a common base unit for comparison.
- You can undo a use, restoring its quantity. You cannot delete a lot while it still has allocations, unless you first undo those allocations.
- This release is intentionally **not** automatic batch/recipe mass accounting. Recipes may include multiple crops, servings, liquids and purchased ingredients. No algorithms can infer how much of your particular harvest was actually used without explicit input.

## Data privacy, exports and failure handling

Harvest state is stored in this browser under \`almanacphi.harvest.v1\`. The complete record includes a \`lots\` list and an \`allocations\` list. No account, cloud database, or analytics is involved. There is no automatic cross-device sync.

The app validates saved records before using them. When saved data is malformed or mathematically inconsistent, the harvest forms are disabled and **the existing browser storage is left untouched**; use **Backup raw stored data** to preserve it for recovery. Manual JSON export provides a human-readable, independent backup. This is a simple local app, not a substitute for professional farm traceability systems.

Harvest lots optionally retain the planting ID from the Garden Journal. Deleting that planting does not delete harvest lots, preserving independently recorded harvest history.

## Safety and evidence boundaries

- Harvest availability is a record of measured and allocated produce, **not** certification of freshness, edibility, food safety or shelf life.
- Freezing, canning, drying, and fermenting must still follow the appropriate tested preservation guidance in [PRESERVATION.md](./PRESERVATION.md).
- Fresh-cooking recipes in [KITCHEN.md](./KITCHEN.md) are not shelf-stable canning recipes.
- **Kitchen filter** means "at least one crop in this recipe has a positive recorded available balance." It does not prove you have **enough** of that crop, or that all ingredients are available, or that the food is safe to eat.
- If you donate food, follow applicable local safety handling, storage, and donation guidelines.

## Test and roadmap

\`tests/harvest.test.js\` checks dates, invalid quantities, weight conversions, count/weight separation, overspending, undo math, ledger integrity, crop summaries and static site integration.

Possible future additions include weighing harvests directly from a smart scale, scanned batch IDs for pantry allocations, consumption summaries, CSV import, more languages, and printable harvest records. Each integration should keep the allocation trail explicit and preserve local-first operation.

## v0.5 linked pantry transfers

Use **Preserved or stored → Also create a linked Pantry Ledger batch** to create both records together. The Pantry view shows the linked batch but corrections and undo happen in Harvest, protecting provenance and quantities. Existing standalone pantry entries remain independent. See [BRIDGE.md](./BRIDGE.md).
