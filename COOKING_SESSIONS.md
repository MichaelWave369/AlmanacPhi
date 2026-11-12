# AlmanacΦ v0.8 · Cooking Session Ledger

The Cooking Session Ledger ties a real meal to **explicit** uses of recorded harvest and preserved pantry ingredients. No recipe or meal plan can automatically spend produce.

## Start a session

1. Open **Kitchen** and select **Start cooking session** from a recipe or **Start cooking** from a planned meal. This fills the recipe, date and serving size in the form. You can also open the **Cooking Session Ledger** directly.
2. Choose **Start session**. This stores a recipe/date/servings/notes entry in this browser. **No inventory is deducted at this stage**.
3. Select your newly created session. Choose an existing eligible harvest lot or **counted** pantry batch.
4. Enter the **exact amount used in that source's own unit**. A fresh harvest lot uses the original lot unit (lb, kg, g, oz or whole pieces); a pantry batch uses **whole containers** only.
5. Choose **Save this ingredient use**. That specific transaction is written into its original source ledger:
   - Fresh produce: a \`purpose: "cooked"\` allocation is appended to \`almanacphi.harvest.v1\` after balance checks.
   - Standalone pantry: a \`reason: "used"\` removal is appended to the batch stock history in \`almanacphi.pantry.v1\`.
   - Harvest-linked pantry: a \`reason: "used"\` stock removal is appended inside the harvest allocation's \`pantry.stock\` record in \`almanacphi.harvest.v1\`.
6. Each record includes an optional \`sessionId\` so the Cooking Session Ledger can show exactly which recorded uses belong to the meal. Earlier legacy records without a \`sessionId\` remain valid.
7. Add further uses one at a time. A session can contain several harvest and pantry actions. Mark it **finished** when you're done. This only changes the session's status and **does not modify inventory**.
8. **Export sessions JSON** for a backup. The activity list is a read-only snapshot; original Harvest and Pantry exports remain the authoritative inventory records.

## Integrity boundaries

- **One source write per ingredient use**. The app doesn't try to fake an atomic transaction spanning multiple browser storage keys. If one ingredient action fails, earlier saved actions remain independent and trustworthy; the new one is not recorded.
- The cooking session's notes/status live in \`almanacphi.cooking.v1\`. Inventory actions remain attached to their source of truth and are not mirrored into a separate cooking balance.
- Quantity validation prevents harvest allocations exceeding the remaining lot balance or pantry removals exceeding the remaining counted containers. Pantry containers always require positive whole-number removals.
- Harvest lots and counted pantry batches are suggested **only by overlapping recipe crop identifiers**. A recipe match is not a declaration of enough food, suitable substitution, edible condition or safety.
- For pantry containers with unknown counts, start count tracking in **Preserve** before using one through Cooking.
- If an ingredient use needs correction, open the original **Harvest** or **Pantry** Ledger and use the existing undo controls. The Cooking Session Ledger updates from the currently recorded source histories.
- Deleting or changing a planned meal never silently changes a cooking session or its recorded ingredient use. A cooking session's optional plan ID is a reference, not an inventory transaction.
- A meal marked finished is not proof it was cooked safely and is **not** a trigger to spend ingredient balances.
- Existing sessions and inventory are saved only to the browser's localStorage; there's no account or network synchronization. Backup often. A malformed cooking session file is not overwritten automatically.

## Food safety

**Neither a pantry entry nor a serving count certifies food as safe.** Preserved foods may not substitute for fresh ingredients, and a whole container count is not a weight/volume conversion. Follow tested USDA/NCHFP canning guidance, properly refrigerate perishables, and use food-specific safety instructions. These cooking recipes must **not** be treated as home-canning processes.

Related guides: [KITCHEN.md](./KITCHEN.md), [PANTRY_KITCHEN.md](./PANTRY_KITCHEN.md), [PANTRY_STOCK.md](./PANTRY_STOCK.md), [HARVEST.md](./HARVEST.md), and [PRESERVATION.md](./PRESERVATION.md).

## Implementation

- \`cooking-data.js\`: pure validation, eligible source projections and derived activity history.
- \`cooking-ui.js\`: session creation/selection/completion, explicitly entered source allocations, export and browser-local refresh.
- \`harvest-data.js\` and \`pantry-stock.js\`: optional \`sessionId\` fields accepted and validated for backward compatibility.
- \`harvest-ui.js\` and \`preservation-ui.js\`: refresh their on-page views after an explicit cooking transaction.
- \`kitchen-ui.js\`: start actions from recipes/plans.
- \`tests/cooking.test.js\`: session validation, overdraw protection, linked source reconciliation and static UI wiring.
- Service worker v8 precaches the modules for offline revisits.

## Future upgrades

Full ingredient-line checklists and multi-source unit conversion would require explicit recipe-specific ingredient metadata and verified conversion assumptions. Avoid falsely presenting a jar count as an amount of fresh produce.
