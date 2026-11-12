# AlmanacΦ v0.7 · Pantry-Aware Harvest Kitchen

The Kitchen can now show **possible pantry batch matches** for recipes and provide an explicit **Review batch** action that opens the corresponding record in the Pantry Ledger.

This is intentionally an **inventory hint**, not an automated ingredient substitution, a nutrition calculator, a food-safety check, or a pantry consumption engine.

## How to use

1. In **Preserve → Pantry records**, keep container counts up to date. Batches without tracking still appear as **count unknown** in recipe details.
2. In **Kitchen**, turn on **Show recipes matching at least one crop with a positive tracked pantry container count**. Only pantry batches with a recorded number greater than zero qualify for this filter.
3. Search for a recipe or open one from your meal plan. Under **Possible pantry ingredients**, review batches that share the recipe's crop identifier.
4. Each candidate shows the crop, preservation method, free-text quantity, storage location and either the recorded container balance or “count unknown.”
5. Choose **Review batch** to jump directly to that exact Pantry Ledger entry. The entry is highlighted for review and correction. **Nothing is deducted automatically.**
6. Meal plans show a count of matching crops with recorded positive container balances. Their **Check pantry** action opens recipe details with candidate links.
7. The downloaded shopping list also notes the number of matching pantry crop names per meal, without checking off any ingredients or reducing shopping quantities.

## Distinguish counts, foods and recipes

- Matching by crop is *only* a starting point. A jar of pickled cucumbers is not interchangeable with the fresh cucumbers called for in a salad. A dried herb may require different quantities from a fresh herb. A canned tomato product may or may not suit a recipe as written.
- One **recorded** container is neither an amount in cups/pounds nor an assurance that its contents are intact or safe to eat.
- Batch records do **not** include reliable food-safety certification, sealing status, processing validation, freshness or real-time temperature. Dates and recipe-source links cannot substitute for proper handling.
- Kitchen only filters by **positive tracked counts**; untracked legacy batches are visible for review but never asserted to have positive current stock.
- Batches with zero recorded containers are excluded from Pantry Kitchen candidates. Planting seed-saving stock is excluded from edible ingredient suggestions.
- A recipe that matches one pantry crop still needs all its other ingredients and sufficient quantities. No recipe automatically consumes, allocates or modifies pantry stock.
- Harvest-only and Pantry-only filters may be combined. In that case a recipe must match each selected filter, not necessarily the same crop, and neither filter certifies readiness.

## Privacy, compatibility and source of truth

- Only existing localStorage keys are read: \`almanacphi.pantry.v1\` (standalone batches) and \`almanacphi.harvest.v1\` (the linked batch allocations).
- Candidate matching is read-only and leaves those records unmodified. Updates occur only through the existing explicit Pantry Stock interface.
- Standalone and linked batches retain distinct origin identifiers, even if the same batch ID happens to exist in both collections.
- Browser-local events refresh Kitchen suggestions after stock changes in the same tab. Other tabs receive the native storage-change event.
- The new \`pantry-kitchen.js\` contains pure testable matching functions. \`kitchen-ui.js\` renders matching guides and \`preservation-ui.js\` exposes the precisely targeted batch focus event.
- The UI is cached for later offline visits through the versioned service worker. Existing user records are not migrated or deleted.

## Primary guidelines

See [PANTRY_STOCK.md](./PANTRY_STOCK.md) for container counting and [PRESERVATION.md](./PRESERVATION.md) for authoritative preservation guidance. For safe cooking and leftovers, refer to [KITCHEN.md](./KITCHEN.md) and its USDA/CDC references.

## Next sensible work

Add a **manual cooking-session ingredient checklist** linked to a particular meal, where the grower can opt in to recording exact pantry container removals. The default must remain zero automatic deductions. It should not invent conversion between bags, jars, servings or weight.
