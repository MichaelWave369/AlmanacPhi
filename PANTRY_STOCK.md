# AlmanacΦ · Pantry Stock Ledger (v0.6)

Pantry Stock adds **explicit counts of whole containers** (jars, freezer bags, bundles or another type defined by the grower) to the existing Pantry Ledger. These numbers track what was recorded, *not* food safety, freshness, weight, servings or edible contents.

## From sealed containers to everyday use

1. When creating a standalone pantry batch or a harvest-linked preservation transfer, optionally enter the **whole number of containers** actually packaged (for example, 4 freezer bags).
2. The free-text **Finished batch quantity** (“4 freezer bags”) remains a separate description. The optional numeric field is not guessed from that text.
3. In **Preserve → Pantry records**, every batch shows either “Container count: not tracked” or “X of Y containers remaining.”
4. For a batch without a count (including pre-v0.6 batches), select **Start tracking** and enter the **number currently on hand**. This creates a baseline now; it does not rewrite or invent the batch's original package count.
5. For a tracked batch, enter how many whole containers you **used**, **shared/donated**, or **discarded**, plus date and optional notes. AlmanacΦ refuses removals greater than the remaining balance.
6. Use **Undo latest** for mistaken entries. The system restores the numerical balance, **not the actual food**. For safety, a discarded or opened container should never be considered physically recovered just because you undid a record.
7. Export either the Pantry Ledger (standalone and separately identified linked batches) or Harvest Ledger (authoritative data for linked batches) for backup.

## Storage and provenance

- **Standalone batches** store their optional \`stock: { opening, uses }\` within \`almanacphi.pantry.v1\`. Updating a count writes one updated standalone pantry collection.
- **Linked batches** store their \`stock\` under \`allocation.pantry.stock\` within \`almanacphi.harvest.v1\`. Updating a count writes one harvest ledger snapshot. The Pantry view is derived from that harvest data and refreshes after changes.
- Neither pathway automatically creates or modifies harvest allocations when containers are used. Those quantities were already allocated **when the produce moved into preservation**. This avoids double deduction.
- **Older batches without stock fields remain valid**. Enabling stock counts is optional; no migration or guessing is performed.
- Stock removal is an explicit audit event containing a unique ID, date, whole-container count, reason and note.
- The per-batch maximum is 100,000 counted containers, with up to 1,000 recorded removal events. Counts cannot become negative.
- Save and update operations are local-browser only, without accounts, remote services or telemetry. A storage failure prevents updating the in-memory display for the two new stock-edit paths.

## Critical food-safety boundaries

**Inventory is not inspection.** “1 container remaining” does not mean it is sealed, shelf-stable, safely processed, fresh or safe to eat. If you open a jar, eat part of it and keep leftovers, the *whole-container count* is a poor measure of what remains. Record the jar as used and follow the appropriate refrigerator storage guidance rather than treating its contents as an untouched sealed jar.

The Pantry Stock Ledger does not provide use-by dates, botulism detection, automatic spoilage flags, guaranteed storage periods, valid canning processes or calculated serving/weight conversions. Consult verified USDA/NCHFP/extension instructions and food-specific cold storage requirements. See [PRESERVATION.md](./PRESERVATION.md).

## Implementation

- \`pantry-stock.js\`: pure, independently tested count validation, action application, remaining balance and undo.
- \`pantry-stock-ui.js\`: one shared, accessible starting-count/use/share/discard interface for standalone and linked batches.
- \`preservation-data.js\`: optional \`stock\` validation in the pre-existing pantry batch schema.
- \`harvest-data.js\`: linked batch projection and integrity checks preserve and validate the stock object.
- \`harvest-ui.js\`: add optional starting counts to a linked transfer, and persist later linked stock changes inside the same original harvest ledger.
- \`preservation-ui.js\`: add optional starting counts to standalone batches, display both origins, and save each stock change in its authoritative record.
- \`tests/pantry-stock.test.js\`: test old data compatibility, whole-number bounds, reasons, dates, duplicates, overdraw, undo and linked provenance.

## Further expansion

Add a **pantry-aware cooking checklist** that reminds the grower to explicitly record a used container after preparing a meal. Do not silently deduct quantities from a recipe plan, and never equate a “cooked” checkbox with physical use.

## v0.7 Pantry Kitchen connections

Pantry batch counts can now inform Kitchen recipe **candidate hints**, including a direct link to review a specific batch. The Kitchen does not consume packages, infer freshness, or turn crop-name matches into ingredient equivalence. The grower must still explicitly record use under Pantry. See [PANTRY_KITCHEN.md](./PANTRY_KITCHEN.md).
