# AlmanacΦ · Harvest Kitchen (v0.3)

**Plant → grow → harvest → cook → preserve (with tested methods) → save seeds.**

The Harvest Kitchen adds **16 original fresh-cooking recipes spanning all 19 crops** in the current crop library. The recipes are authored for AlmanacΦ and are not copied from published cookbooks or commercial sites.

## Using the kitchen

1. Visit the **Kitchen** navigation item. Search recipes or choose a harvested crop and season.
2. Open a recipe to see measured ingredients, approximate cook time and step-by-step cooking instructions.
3. Choose 2, 4, 6 or 8 servings. Ingredients scale arithmetically from a base of 4 servings and display common kitchen fractions.
4. Click **Plan this garden meal**, or choose a recipe and date directly in the meal planner.
5. Mark meals cooked, remove old entries, export the meal plan JSON, or download a text shopping list.

You can also open a crop in the crop library and select **Cook with this crop** to show only recipes using that crop.

### Season and portion caveats

- Spring/summer/autumn/winter tags are editorial suggestions, **not local climate predictions**. Availability depends on your region and stored produce.
- Cooking times are estimates; equipment, produce size and variety change the results. Follow the recipe's tenderness and doneness cues.
- Scaled ingredients are a **planning convenience**, not a promise that cooking time, seasoning or pan size scales linearly.
- The shopping list is **grouped by planned meal**. It deliberately does not deduplicate pantry items or compare with real inventory.
- Ingredient labels are descriptive, not an allergen-free certification. Check packaged foods and dietary needs independently.

## Safety: these recipes are NOT canning recipes

Even a fresh tomato sauce, pesto, soup, or pickled salad cannot be converted directly into a shelf-stable home-canning recipe. Use tested USDA/NCHFP/cooperative extension instructions specific to the finished food, equipment, jar size, altitude, and process. The Harvest Kitchen **does not provide** shelf-stable processing instructions.

- Wash produce well. Cook vegetables and grains safely and use clean tools.
- Refrigerate perishable foods within **2 hours** of cooking; within **1 hour** when above 90°F (32°C).
- Keep refrigerator at **40°F (4°C) or below**. Use refrigerated cooked leftovers within **3–4 days** or freeze for longer storage.
- Reheat leftovers thoroughly to **165°F (74°C)**.
- Treat garlic-in-oil preparations as **perishable**, not shelf-stable. The sunflower basil pesto recipe must not be stored at room temperature or canned.

Sources:
- [USDA FSIS · How do I handle leftovers safely?](https://ask.fsis.usda.gov/article/How-do-I-handle-leftovers-safely)
- [USDA FSIS · Reheating food safely](https://ask.fsis.usda.gov/article/What-methods-of-reheating-food-are-safe)
- [CDC · Preventing Food Poisoning](https://www.cdc.gov/food-safety/prevention/)
- [Penn State Extension · Use Validated Recipes to Preserve Foods](https://extension.psu.edu/use-validated-recipes-to-preserve-foods)
- [AlmanacΦ Preservation Field Guide](./PRESERVATION.md)

## Privacy and implementation

The planner uses browser `localStorage` under `almanacphi.kitchen.v1`, not a server or account. There is no external sync. The export contains planned meals only. To preserve your records, download a JSON backup before clearing browser data or switching devices.

`recipe-data.js` supplies the recipes and pure helpers. `kitchen-ui.js` renders the browser interface. `tests/kitchen.test.js` checks recipe coverage, scaling, validation and static-site integration. The app runs as a static website using native JavaScript modules with no build step.

## Next ideas

- Select harvests from garden journal and estimate actual harvested quantities.
- Track pantry ingredients and plan meals around stored produce.
- Generate an aggregated pantry-aware shopping list.
- Add dietary labels only after reviewing ingredients and package-specific allergens.
- Add optional printing, offline-first progressive enhancement, and accessible input flow audits.

**Sources were reviewed November 11, 2026; follow the current official advice when preparing food.**

## v0.7 Pantry-Aware Kitchen

Recipes and planned meals can now show possible matches from your standalone and harvest-linked pantry batches. A user-chosen **Review batch** action highlights the exact Pantry record; no stock is automatically spent. Only batches with a positive *recorded* container count qualify for the pantry-only recipe filter; untracked batches remain clearly unknown. A matching preserved crop does not establish an equivalent fresh ingredient or food safety. See [PANTRY_KITCHEN.md](./PANTRY_KITCHEN.md).
