# AlmanacΦ · Harvest-to-Pantry Bridge (v0.5)

The v0.5 bridge lets a grower make **one explicit harvest transfer** that also creates a **linked pantry batch**. The same saved harvest-allocation object is the only authoritative record for linked batches, so a browser-storage error cannot leave a separate pantry entry without its harvest deduction.

## How to transfer a harvest to the pantry

1. In **Harvest**, record a crop yield with an amount and unit.
2. Under **Account for what you used**, select the harvest lot and enter the amount being transferred. Choose **Preserved or stored**.
3. Leave **Also create a linked Pantry Ledger batch** checked.
4. Pick a method suitable for that crop. Describe the **finished batch quantity** (for example, "3 jars" or "2 freezer bags"), storage location, optional notes, and recipe URL.
5. For **boiling-water or pressure canning**, the recipe-source field is mandatory and must be a well-formed HTTPS address. A URL is only a reference, not an automatic validation of ingredients, processing or safety.
6. Submit once. The harvest lot's available amount decreases. The Pantry section displays a **Linked from harvest** entry with the method, packaged quantity, date, and original harvest amount.
7. To correct a linked transfer, go back to **Harvest** and choose **Undo** on that allocation. You will be warned that this also removes the linked pantry entry.

This keeps harvest **input quantity** separate from pantry **finished yield**. Six pounds of fresh tomatoes might yield some number of jars, which depends on the tested recipe and preparation; the app never invents a conversion.

## Previous records remain intact

- Existing garden plantings, harvest lots, allocations and pantry batches remain under their previous browser-storage keys.
- **Standalone pantry entries** in \`almanacphi.pantry.v1\` remain editable/removable exactly as before. They do **not** retroactively deduct produce.
- **Linked pantry entries** are projections of harvest allocations containing a \`pantry\` object in \`almanacphi.harvest.v1\`. They cannot be independently deleted from Pantry, because that could leave harvest balances inconsistent.
- An existing unlinked \`preserved\` allocation is still valid. The new linked form is optional.
- A valid linked allocation is \`purpose: "preserved"\`, with method/quantity/storage location/notes/source URL recorded in the same object.
- JSON export from **Harvest** includes the linked batch metadata within allocations. JSON export from **Pantry** contains a separate \`linkedPantry\` read-only list for convenience alongside its original standalone \`pantry\` list. Do not import these as two independent transactions or count them twice.
- Correcting a physical jar's contents is outside the ledger's ability. Undo changes the **record** and harvest availability; it cannot undo what happened to the food.

## Evidence, food safety and limits

A recorded batch is **not** proof that food was safely canned, refrigerated, fermented or dried. For shelf-stable canning, use a current **research-tested USDA, NCHFP or cooperative extension recipe** that matches the exact food, formulation, jar size, packing method and elevation-specific pressure/time. The interface does **not** generate processing schedules or certify recipes.

The crop-specific list only provides **potential methods for which authoritative procedures or storage guidance may exist**; it does not validate your own batch. The app also does not know freshness, spoilage, safe use-by dates, consumed pantry stock or true yield conversion.

For background and primary references, see [PRESERVATION.md](./PRESERVATION.md). For harvest accounting, see [HARVEST.md](./HARVEST.md).

## Implementation

- \`harvest-data.js\`: \`validLinkedPantry\`, \`linkedPantryEntry\`, \`linkedPantryBatches\`, \`safeRecipeSource\` plus updated ledger integrity checks.
- \`harvest-ui.js\`: conditional fields on the explicit \`preserved\` action; validates the crop/method/URL and appends a single allocation containing pantry metadata.
- \`preservation-ui.js\`: combines standalone batches with a read-only, live projection of linked harvest allocations, refreshes after harvest changes, and exports both sources separately.
- \`tests/bridge.test.js\`: tests backward compatibility, safe linkage, double-allocation prevention, incorrect crop/method combinations, canning-source requirements and UI wiring.
- LocalStorage remains fully local. No new backend, accounts, remote telemetry, or location capture.

## Next engineering step

Introduce explicit pantry stock **consumption** history (for example, "used one of three jars") as a separate, auditable record with safe handling guidance. Do not equate "jar remaining" with food being safe to eat, and never infer consumption solely from a meal plan.
