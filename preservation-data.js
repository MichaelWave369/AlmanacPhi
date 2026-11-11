// Harvest-to-pantry educational content. Safety-first, source-linked; NO process schedules.
// Sources: NCHFP/USDA, FoodSafety.gov and University of Minnesota Extension.
export const PRESERVATION_GUIDES = [
  {
    id:"water-bath",name:"Boiling-water canning",icon:"◉",tag:"SHELF-STABLE · TESTED RECIPE ONLY",
    summary:"For high-acid foods and specifically acidified products in research-tested recipes.",
    alert:"NEVER water-bath can plain low-acid vegetables. Tomatoes need required acidification even for many pressure-canner options. Do not invent a recipe or processing schedule.",
    steps:[
      "Choose a CURRENT research-tested recipe from NCHFP, USDA or cooperative extension that specifies this exact product, ingredients, pack style and jar size.",
      "Confirm whether the recipe requires bottled lemon juice, citric acid or specified-strength vinegar. Follow its exact quantities without substitutions.",
      "Check your actual elevation and use the recipe's altitude-specific boiling-water processing time. Follow its equipment and headspace instructions.",
      "Prepare sound jars and approved lids, process for the full listed time with the specified water coverage, and let jars cool undisturbed as directed.",
      "Check seals according to the recipe, label the food and date, then store in a cool, dry, dark place. If a seal fails, follow tested instructions for prompt refrigeration/reprocessing or discard."
    ],
    sources:[{label:"NCHFP: safe canned foods",url:"https://nchfp.uga.edu/how/general-canning-information/ensuring-safe-canned-foods/"},{label:"NCHFP: processing times & altitude",url:"https://nchfp.uga.edu/how/general/selecting-the-correct-processing-time/"},{label:"NCHFP: tomato acidification",url:"https://nchfp.uga.edu/how/can/how-do-i-can-tomatoes/tomato-acidification-directions/"}]
  },
  {
    id:"pressure",name:"Pressure canning",icon:"♨",tag:"LOW-ACID · TESTED RECIPE ONLY",
    summary:"The appropriate home-canning method for many low-acid vegetables when an approved recipe exists.",
    alert:"A pressure cooker, multicooker or electric pressure cooker is NOT automatically an approved pressure canner. Water-bath canning low-acid foods carries a botulism risk. Do not guess time, pressure or jar size.",
    steps:[
      "Find a tested pressure-canning procedure for the exact food and pack style. Some foods have no safe, tested home-canning process.",
      "Check the pressure canner against NCHFP equipment recommendations. Inspect the vent, seal, safety mechanisms and dial gauge according to manufacturer/extension guidance.",
      "Determine elevation and gauge type (weighted or dial). Use the recipe's exact processing time, pressure and jar-size recommendations.",
      "Follow the tested instructions for packing, exhausting steam for 10 minutes, reaching target pressure, maintaining it for the entire processing time, and natural depressurization.",
      "After cooling, check seals, label/date and store. Never taste suspicious jars; discard according to official guidance."
    ],
    sources:[{label:"NCHFP: pressure canner instructions",url:"https://nchfp.uga.edu/how/general-canning-information/using-pressure-canners/"},{label:"NCHFP: recommended canners",url:"https://nchfp.uga.edu/how/can/general-information/recommended-canners/"},{label:"NCHFP: selecting processing time",url:"https://nchfp.uga.edu/how/general/selecting-the-correct-processing-time/"}]
  },
  {
    id:"freezing",name:"Freezing the harvest",icon:"❄",tag:"FROZEN STORAGE",
    summary:"A flexible option for vegetables, herbs and prepared produce, with food-specific preparation.",
    alert:"Freezing stops microbial growth but does not sterilize food. Most vegetables need crop-specific blanching before freezing for best quality. Never assume one blanching time fits all.",
    steps:[
      "Select fresh, sound produce and wash it. Follow an extension/NCHFP page for that specific vegetable or fruit.",
      "Blanch vegetables for the crop-specific time when recommended. Cool immediately in cold water and drain thoroughly.",
      "Pack in freezer-safe containers or bags, remove excess air, and allow headspace where necessary for liquids.",
      "Label crop, variety, date and preparation method. Freeze promptly at 0°F (-18°C) or below.",
      "Thaw safely in the refrigerator or cook from frozen as appropriate; follow food-specific handling instructions."
    ],
    sources:[{label:"NCHFP: blanching vegetables",url:"https://nchfp.uga.edu/how/freeze/freeze-generalinformation/blanching-vegetables/"},{label:"NCHFP: blanching time chart",url:"https://nchfp.uga.edu/how/freeze/freeze-general-information/blanching-times/"},{label:"FoodSafety.gov: cold storage",url:"https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts"}]
  },
  {
    id:"drying",name:"Drying & dehydrating",icon:"☼",tag:"DRIED STORAGE",
    summary:"Preserve moisture-sensitive herbs, fruits and suitable vegetables using controlled drying.",
    alert:"A food that seems dry can still mold if it is insufficiently dried or absorbs moisture. Do not substitute casual outdoor sun-drying for validated vegetable-drying procedures.",
    steps:[
      "Choose an appropriate food and use NCHFP drying preparation, treatment, temperature and dryness guidance specific to it.",
      "Slice evenly and blanch vegetables when recommended. Use a controlled dehydrator or approved drying setup.",
      "Dry to the texture specified by the authoritative guide; most dried vegetables should be brittle or crisp.",
      "Cool fully. Condition dried fruit when directed, watching for condensation and returning damp fruit for further drying.",
      "Pack into clean, dry airtight containers; label and store in a cool, dry, dark location. Discard moldy foods."
    ],
    sources:[{label:"NCHFP: drying methods",url:"https://nchfp.uga.edu/how/dry/"},{label:"NCHFP: package & store dried foods",url:"https://nchfp.uga.edu/how/dry/general-information-drying/packaging-and-storing-dried-foods/"},{label:"NCHFP: sun-drying limitations",url:"https://nchfp.uga.edu/how/dry/drying-general/sun-drying/"}]
  },
  {
    id:"fermenting",name:"Fermenting vegetables",icon:"◌",tag:"CONTROLLED FERMENTATION",
    summary:"Cultured vegetables such as tested sauerkraut and fermented pickles.",
    alert:"Fermentation is not the same as canning. Follow a tested recipe's salt, ingredient, temperature and monitoring directions; refrigerate finished product as directed. Never invent brine ratios.",
    steps:[
      "Begin with a research-tested fermentation recipe appropriate for the vegetable (for example, tested sauerkraut or dill pickles).",
      "Use fresh produce, safe food-contact equipment and the exact specified salt concentration and water type.",
      "Keep produce submerged under brine and manage temperature and oxygen exposure as prescribed by the recipe.",
      "Monitor the ferment according to the recipe, including any required acidity and stopping criteria; discard suspect batches rather than tasting to test.",
      "Refrigerate when finished, or use an independently tested canning process if a shelf-stable product is intended."
    ],
    sources:[{label:"University of Minnesota Extension: fermentation",url:"https://extension.umn.edu/som/node/172346"},{label:"NCHFP: home food preservation",url:"https://nchfp.uga.edu/"}]
  },
  {
    id:"refrigerator-pickles",name:"Refrigerator pickles",icon:"♧",tag:"REFRIGERATED · NOT SHELF-STABLE",
    summary:"Cold-stored pickled vegetables using a tested refrigerator recipe.",
    alert:"A refrigerator pickle is NOT canned or shelf-stable, even when placed in a mason jar. Keep refrigerated and follow the specific recipe's use-by guidance.",
    steps:[
      "Select a tested refrigerator-pickle recipe from a university extension source; use fresh, clean vegetables.",
      "Follow the stated vinegar acidity, ingredient quantities and container sanitation instructions.",
      "Cover the produce with the recipe's brine and refrigerate promptly at 40°F (4°C) or below.",
      "Label the date and the recipe's stated storage duration. Never store these jars at room temperature.",
      "Discard if spoilage is suspected. For shelf-stable pickles, use a separate tested water-bath canning recipe."
    ],
    sources:[{label:"UMN Extension: home food preservation",url:"https://extension.umn.edu/food/preparing/cooking-at-home/food-preservation"},{label:"FoodSafety.gov: refrigerate properly",url:"https://www.foodsafety.gov/keep-food-safe/4-steps-to-food-safety"}]
  },
  {
    id:"cold-storage",name:"Cool & cold storage",icon:"⌂",tag:"FRESH STORAGE",
    summary:"Keep suitable crops fresh with temperature, humidity, light and ventilation in mind.",
    alert:"Cool pantry storage is not appropriate for every crop. Perishables belong in the refrigerator at 40°F (4°C) or below, and actual crop-specific safe storage conditions vary.",
    steps:[
      "Sort carefully; discard damaged or spoiled items. Check each crop's specific storage requirements.",
      "Use the refrigerator for perishables. Keep it at or below 40°F (4°C) and use a thermometer.",
      "For crops that tolerate it, use a cool, dry, dark and ventilated location; do not confuse a warm cupboard with controlled root-cellar conditions.",
      "Avoid light exposure for stored potatoes, which can cause greening. Protect onions/garlic from excess moisture and use crop-specific guidance.",
      "Inspect regularly and rotate older produce first. Do not eat visibly spoiled or otherwise unsafe food."
    ],
    sources:[{label:"FoodSafety.gov: cold storage",url:"https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts"},{label:"FoodSafety.gov: four safety steps",url:"https://www.foodsafety.gov/keep-food-safe/4-steps-to-food-safety"}]
  },
  {
    id:"seed-saving",name:"Save seeds for next year",icon:"✿",tag:"GARDEN CONTINUITY",
    summary:"Select good plants, collect mature seed and keep it dry and labeled for next season.",
    alert:"Hybrid (F1) seed often will not grow true to type. Cross-pollinating crops require isolation; biennials can take two seasons. For edible seed storage, use food-safety guidance rather than seed-viability guidance.",
    steps:[
      "Start with healthy, open-pollinated plants. Tomatoes, peppers, beans and peas are often accessible first seed-saving projects.",
      "Understand species-specific pollination and maturity; squash and many brassicas can cross-pollinate, while carrots and beets are biennials.",
      "Collect fully mature seeds and use the appropriate cleaning, fermentation (for some seeds) or drying method for that crop.",
      "Dry seeds sufficiently before storage, label with crop, variety, date and growing location, and protect them from moisture.",
      "Keep seeds cool and dry in suitable sealed storage, and test germination before relying on older seed."
    ],
    sources:[{label:"UMN Extension: saving vegetable seeds",url:"https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/saving-vegetable-seeds"}]
  }
];
export const PRESERVATION_BY_ID=Object.fromEntries(PRESERVATION_GUIDES.map(guide=>[guide.id,guide]));
// Curated pathways, not recipes or declarations that a specific food is safe to can.
// Each method points to an educational guide, which links onward to tested instructions.
export const CROP_PRESERVATION = {
  tomato:{methods:["freezing","drying","water-bath","pressure","seed-saving"],note:"Canning whole, crushed or juiced tomatoes requires the acidification specified by NCHFP, including when choosing its pressure-canning alternatives."},
  pepper:{methods:["freezing","drying","pressure","refrigerator-pickles","seed-saving"],note:"Unpickled peppers are low-acid: shelf-stable jars require a tested pressure-canning procedure. Pickled peppers require their own tested acidified recipe."},
  cucumber:{methods:["refrigerator-pickles","fermenting","water-bath","cold-storage","seed-saving"],note:"Plain cucumber jars are not the same as safe pickles. Follow exact tested vinegar/fermentation and processing instructions."},
  beans:{methods:["freezing","pressure","seed-saving"],note:"Snap beans are low-acid. Never use a boiling-water canner for plain green beans."},
  zucchini:{methods:["freezing","drying","refrigerator-pickles","seed-saving"],note:"Do not home-can plain summer squash: tested recommendations were withdrawn. Use freezing or a specific tested pickle recipe instead."},
  corn:{methods:["freezing","pressure","drying","seed-saving"],note:"Corn is low-acid and needs a tested pressure-canning process if canned. Seeds need isolation and suitable dry-down."},
  basil:{methods:["drying","freezing","seed-saving"],note:"Do not keep homemade garlic/herb-in-oil mixtures at room temperature; choose tested safe storage guidance."},
  sunflower:{methods:["seed-saving","drying"],note:"Dry harvested heads or seeds appropriately and protect from mold and pests. Food-use seeds need food handling practices distinct from planting stock."},
  lettuce:{methods:["cold-storage","seed-saving"],note:"Best fresh and chilled. No shelf-stable plain lettuce canning pathway is offered."},
  spinach:{methods:["freezing","cold-storage","pressure","seed-saving"],note:"Leafy greens are low-acid; any canning needs a tested pressure-canning process specific to greens."},
  kale:{methods:["freezing","cold-storage","seed-saving"],note:"Freeze blanched greens or use promptly; seed saving may require isolation and multiple seasons."},
  broccoli:{methods:["freezing","cold-storage","seed-saving"],note:"Freezing preserves quality better than attempted home canning; avoid invented pressure or water-bath recipes."},
  peas:{methods:["freezing","pressure","seed-saving"],note:"Peas are low-acid; only use a tested pressure-canning procedure for shelf-stable jars."},
  carrot:{methods:["cold-storage","freezing","pressure","refrigerator-pickles","seed-saving"],note:"Plain carrots are low-acid and need tested pressure canning. Carrots are biennial seed crops."},
  radish:{methods:["cold-storage","refrigerator-pickles","seed-saving"],note:"Refrigerator pickles must stay cold. Seed saving requires allowing mature seed pods to form."},
  beets:{methods:["cold-storage","freezing","pressure","water-bath","seed-saving"],note:"Plain beets need pressure canning. Pickled beets may use boiling-water canning only with a tested acidified recipe."},
  potato:{methods:["cold-storage","freezing","pressure"],note:"Potatoes require a tested method for pressure canning and specific preparation. Never can whole potatoes in an untested homemade recipe."},
  onion:{methods:["cold-storage","freezing","drying","seed-saving"],note:"Keep cured onions ventilated and dry; ordinary onions do not belong in an untested water-bath canning recipe."},
  garlic:{methods:["cold-storage","drying","freezing","seed-saving"],note:"Save healthy cloves as planting stock; never store fresh garlic in oil at room temperature. Use tested food-storage instructions."}
};
export function preservationForCrop(cropId){
  const entry=CROP_PRESERVATION[cropId];
  return entry?{...entry,guides:entry.methods.map(id=>PRESERVATION_BY_ID[id]).filter(Boolean)}:null;
}
export function validPantryEntry(item){
  return !!(item&&typeof item.id==="string"&&item.id.length<=90&&
    typeof item.crop==="string"&&Object.hasOwn(CROP_PRESERVATION,item.crop)&&
    typeof item.method==="string"&&Object.hasOwn(PRESERVATION_BY_ID,item.method)&&
    CROP_PRESERVATION[item.crop].methods.includes(item.method)&&
    typeof item.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(item.date)&&
    typeof item.quantity==="string"&&item.quantity.length<=80&&
    typeof item.location==="string"&&item.location.length<=100&&
    typeof item.note==="string"&&item.note.length<=500&&
    typeof item.recipe==="string"&&item.recipe.length<=500&&
    (!["water-bath","pressure"].includes(item.method)||/^https:\/\//i.test(item.recipe)));
}
