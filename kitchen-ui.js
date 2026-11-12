import {CROPS,CROP_BY_ID} from "./crop-data.js";
import {RECIPES,RECIPE_BY_ID,SERVINGS_OPTIONS,recipeIngredients,validateMealPlan} from "./recipe-data.js";
import {checkLedger,availableCropIds} from "./harvest-data.js";
import {pantryCandidates,pantryCandidatesForRecipe,matchedTrackedPantryCrops,pantrySummary} from "./pantry-kitchen.js";
import {PRESERVATION_BY_ID} from "./preservation-data.js";
const $=id=>document.getElementById(id);
const KEY="almanacphi.kitchen.v1", MAX_PLANS=300;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
function todayLocal(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
let plans=[],activeRecipeId=null;
function note(text){$("kitchenPlanStatus").textContent=text;}
function loadPlans(){
  try{const saved=JSON.parse(localStorage.getItem(KEY)||"[]");plans=Array.isArray(saved)?saved.filter(validateMealPlan).slice(0,MAX_PLANS):[];}
  catch(e){console.warn("Meal plan storage unavailable",e);plans=[];}
}
function savePlans(){try{localStorage.setItem(KEY,JSON.stringify(plans));return true}catch(e){console.warn("Meal plan save unavailable",e);return false}}
function options(){
  $("recipeCropFilter").innerHTML='<option value="all">All garden crops</option>'+CROPS.map(c=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join("");
  $("kitchenPlanRecipe").innerHTML=RECIPES.map(r=>'<option value="'+r.id+'">'+esc(r.title)+'</option>').join("");
  $("kitchenPlanServings").innerHTML=SERVINGS_OPTIONS.map(n=>'<option value="'+n+'">'+n+' servings</option>').join("");
  $("kitchenPlanServings").value="4";
  $("kitchenPlanDate").value=todayLocal();
}
function readHarvestAvailability(){
  try{
    const record=JSON.parse(localStorage.getItem("almanacphi.harvest.v1")||"null");
    return record&&checkLedger(record.lots,record.allocations)?
      availableCropIds(record.lots,record.allocations):new Set();
  }catch(e){return new Set();}
}
function readPantryCandidates(){
  let standalone=[],harvest=null;
  try{
    const stored=JSON.parse(localStorage.getItem("almanacphi.pantry.v1")||"[]");
    if(Array.isArray(stored))standalone=stored;
  }catch(e){console.warn("Standalone pantry not readable",e);}
  try{harvest=JSON.parse(localStorage.getItem("almanacphi.harvest.v1")||"null");}
  catch(e){console.warn("Linked pantry not readable",e);}
  return pantryCandidates(standalone,harvest);
}
function renderPantrySnapshot(candidates){
  const summary=pantrySummary(candidates);
  $("kitchenPantrySummary").textContent=summary.trackedBatches?
    summary.trackedBatches+" tracked pantry batches with containers remaining across "+
    summary.crops+" garden crops. "+summary.unknownBatches+" additional batches have unknown counts.":
    "No tracked pantry containers available yet. "+summary.unknownBatches+
    " batches have unknown counts. Set a current count in Preserve to include them in pantry-only filtering.";
}
function pantryRecipeDetails(recipe){
  const matches=pantryCandidatesForRecipe(recipe,readPantryCandidates()).slice(0,20);
  if(!matches.length)return '<p class="subtle">No pantry batches recorded for these crops with available or unknown container counts.</p>';
  return '<ul class="kitchen-pantry-candidates">'+matches.map(batch=>{
    const crop=CROP_BY_ID[batch.crop];
    const method=PRESERVATION_BY_ID[batch.method];
    const amount=batch.remaining===null?"Container count unknown":batch.remaining+" container"+(batch.remaining===1?"":"s")+" recorded";
    return '<li><div><strong>'+esc(crop.emoji)+' '+esc(crop.name)+'</strong> · '+esc(method.name)+
      '<p>'+esc(amount)+' · '+esc(batch.quantity)+' · '+esc(batch.location)+'</p></div>'+
      '<button type="button" data-review-pantry data-pantry-origin="'+esc(batch.origin)+'" data-pantry-id="'+esc(batch.id)+'">Review batch ↗</button></li>';
  }).join("")+'</ul>';
}
function refreshPantryRecipeDetails(){
  const node=$("recipePantryMatches");
  if(node&&RECIPE_BY_ID[activeRecipeId])node.innerHTML=pantryRecipeDetails(RECIPE_BY_ID[activeRecipeId]);
}
export function showHarvestKitchen(){
  $("recipeFromHarvest").checked=true;
  $("recipeCropFilter").value="all";$("recipeSeasonFilter").value="all";$("recipeSearch").value="";
  renderRecipes();
  $("kitchen").scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
}
function renderRecipes(){
  const harvestCrops=readHarvestAvailability(),harvestOnly=$("recipeFromHarvest").checked;
  const candidates=readPantryCandidates(),pantryOnly=$("recipeFromPantry").checked;
  renderPantrySnapshot(candidates);
  const crop=$("recipeCropFilter").value,season=$("recipeSeasonFilter").value,search=$("recipeSearch").value.trim().toLowerCase();
  const filtered=RECIPES.filter(r=>(!harvestOnly||r.crops.some(id=>harvestCrops.has(id)))&&(!pantryOnly||matchedTrackedPantryCrops(r,candidates).size>0)&&(crop==="all"||r.crops.includes(crop))&&(season==="all"||r.season===season)&&
    (r.title.toLowerCase().includes(search)||r.description.toLowerCase().includes(search)||r.crops.some(id=>CROP_BY_ID[id].name.toLowerCase().includes(search))));
  $("kitchenRecipeCards").innerHTML=filtered.map(r=>
    '<button type="button" class="kitchen-recipe-card" data-open-recipe="'+r.id+'" aria-label="Open recipe for '+esc(r.title)+'">'+
    '<span class="recipe-sticker">'+esc(r.season.toUpperCase())+' · '+r.minutes+' MIN</span><strong>'+esc(r.title)+'</strong>'+
    '<span class="recipe-crops">'+r.crops.slice(0,4).map(id=>CROP_BY_ID[id].emoji).join(" ")+'</span>'+
    (harvestOnly?'<span class="recipe-harvest-match">'+r.crops.filter(id=>harvestCrops.has(id)).length+' of '+r.crops.length+' garden crops recorded</span>':"")+
    (pantryOnly?'<span class="recipe-harvest-match">'+matchedTrackedPantryCrops(r,candidates).size+' crop(s) with recorded pantry containers</span>':"")+
    '<span class="recipe-description">'+esc(r.description)+'</span><span class="crop-link">VIEW RECIPE ↗</span></button>'
  ).join("")||'<div class="empty-state">No recipes match these filters. Try another season or crop.</div>';
  $("kitchenRecipeCount").textContent=filtered.length+" of "+RECIPES.length+" original recipes"+(harvestOnly?" · matches at least one recorded crop":"")+(pantryOnly?" · matches a positive tracked pantry count":"")+". Counts do not imply usable ingredients, safe food, or enough quantity.";
}
function renderRecipeIngredients(){
  const recipe=RECIPE_BY_ID[activeRecipeId];
  if(!recipe)return;
  const servings=Number($("recipeServings").value);
  $("recipeIngredientList").innerHTML=recipeIngredients(recipe,servings).map(x=>'<li>'+esc(x)+'</li>').join("");
}
function openRecipe(id){
  const recipe=RECIPE_BY_ID[id];if(!recipe)return;
  activeRecipeId=id;
  $("kitchenRecipeDialogBody").innerHTML=
    '<div class="kitchen-recipe-heading"><p class="eyebrow">'+esc(recipe.season.toUpperCase())+' · '+recipe.minutes+' MINUTES</p><h2 id="kitchenRecipeTitle">'+esc(recipe.title)+'</h2><p>'+esc(recipe.description)+'</p></div>'+
    '<div class="kitchen-recipe-produce"><b>From your garden:</b> '+recipe.crops.map(c=>esc(CROP_BY_ID[c].name)).join(" · ")+'</div>'+
    '<div class="kitchen-recipe-servings"><label for="recipeServings">Adjust servings</label><select id="recipeServings">'+SERVINGS_OPTIONS.map(n=>'<option value="'+n+'" '+(n===4?"selected":"")+'>'+n+' servings</option>').join("")+'</select></div>'+
    '<div class="kitchen-recipe-columns"><div><h3>Ingredients</h3><ul class="kitchen-ingredients" id="recipeIngredientList"></ul></div>'+
    '<div><h3>Method</h3><ol class="kitchen-steps">'+recipe.steps.map(step=>'<li>'+esc(step)+'</li>').join("")+'</ol></div></div>'+
    '<section class="recipe-pantry-section"><h3>Possible pantry ingredients</h3>'+
    '<p>Matched by crop only. Preserved food may not work in a fresh recipe. Check the actual food, method, package and handling instructions. Neither counts nor batch dates certify safety.</p>'+
    '<div id="recipePantryMatches">'+pantryRecipeDetails(recipe)+'</div></section>'+
    '<div class="kitchen-recipe-safety"><b>Cook and eat, not can.</b> These are original fresh-cooking recipes, not validated shelf-stable preservation methods. Refrigerate perishable leftovers promptly and reheat leftovers to 165°F (74°C).</div>'+
    '<button class="button primary full" type="button" data-plan-current>Plan this garden meal +</button>';
  renderRecipeIngredients();
  $("kitchenRecipeDialog").showModal();
}
function renderPlan(){
  $("kitchenPlanCount").textContent=String(plans.length);
  const candidates=readPantryCandidates();
  $("kitchenPlanList").innerHTML=plans.length?[...plans].sort((a,b)=>a.date.localeCompare(b.date)).map(p=>{
    const r=RECIPE_BY_ID[p.recipeId],matched=matchedTrackedPantryCrops(r,candidates).size;
    const matchHint=matched?matched+" recipe crop(s) with recorded pantry containers":"No matching tracked pantry containers";
    return '<article class="kitchen-plan-entry'+(p.done?" done":"")+'"><div><h4>'+esc(r.title)+'</h4><p>'+esc(p.date)+' · '+p.servings+' servings · '+r.minutes+' min</p>'+
      '<p class="pantry-recipe-note">'+esc(matchHint)+' · check suitability and safety</p>'+
      (p.note?'<p>'+esc(p.note)+'</p>':'')+'</div>'+
      '<div class="kitchen-plan-actions"><button type="button" data-plan-pantry="'+esc(p.id)+'">Check pantry</button><button type="button" data-plan-toggle="'+esc(p.id)+'">'+(p.done?'Reopen':'Cooked')+'</button>'+
      '<button type="button" data-plan-remove="'+esc(p.id)+'" aria-label="Remove this meal from plan">×</button></div></article>';
  }).join(""):'<div class="empty-state">No meals planned. Open a recipe, then add it to your plan.</div>';
}
function saveDownload(filename,content,type){
  const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function downloadShoppingList(){
  if(!plans.length){note("Add a meal before making a shopping list.");return;}
  const pending=plans.filter(p=>!p.done).sort((a,b)=>a.date.localeCompare(b.date));
  if(!pending.length){note("All planned meals are marked cooked. Reopen one to build a shopping list.");return;}
  const lines=["ALMANACΦ · GARDEN MEAL SHOPPING LIST","",...pending.flatMap(p=>{
    const recipe=RECIPE_BY_ID[p.recipeId];
    const matched=matchedTrackedPantryCrops(recipe,readPantryCandidates()).size;
    return [p.date+" · "+recipe.title+" · "+p.servings+" servings",
      "  Pantry crop candidates: "+matched+" recorded with positive container counts (not verified substitutes or sufficient quantities)",
      ...recipeIngredients(recipe,p.servings).map(s=>"  [ ] "+s),""];

  }),"Ingredients are listed by meal and may repeat. Check your garden and pantry first.",
    "Perishable leftovers require refrigeration; these are not canning recipes."];
  saveDownload("almanacphi-shopping-"+todayLocal()+".txt",lines.join("\n"),"text/plain");
}
export function showCropKitchen(cropId){
  if(!CROP_BY_ID[cropId])return;
  $("recipeCropFilter").value=cropId;
  $("recipeSeasonFilter").value="all";$("recipeSearch").value="";
  renderRecipes();
  $("cropDialog")?.close();
  $("kitchen").scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
}
export function initKitchen(){
  options();loadPlans();renderRecipes();renderPlan();
  ["recipeCropFilter","recipeSeasonFilter"].forEach(id=>$(id).addEventListener("change",renderRecipes));
  $("recipeSearch").addEventListener("input",renderRecipes);
  $("recipeFromHarvest").addEventListener("change",renderRecipes);
  $("recipeFromPantry").addEventListener("change",renderRecipes);
  const reloadPantry=()=>{renderRecipes();renderPlan();refreshPantryRecipeDetails();};
  window.addEventListener("almanacphi:harvest-updated",reloadPantry);
  window.addEventListener("almanacphi:pantry-updated",reloadPantry);
  window.addEventListener("storage",e=>{if(["almanacphi.pantry.v1","almanacphi.harvest.v1"].includes(e.key))reloadPantry();});
  $("kitchenRecipeCards").addEventListener("click",e=>{
    const btn=e.target.closest("button[data-open-recipe]");
    if(btn)openRecipe(btn.dataset.openRecipe);
  });
  $("kitchenRecipeDialogClose").addEventListener("click",()=>$("kitchenRecipeDialog").close());
  $("kitchenRecipeDialog").addEventListener("click",e=>{if(e.target===$("kitchenRecipeDialog"))$("kitchenRecipeDialog").close()});
  $("kitchenRecipeDialogBody").addEventListener("change",e=>{if(e.target.id==="recipeServings")renderRecipeIngredients()});
  $("kitchenRecipeDialogBody").addEventListener("click",e=>{
    const pantryButton=e.target.closest("[data-review-pantry]");
    if(pantryButton){
      const {pantryOrigin:origin,pantryId:id}=pantryButton.dataset;
      $("kitchenRecipeDialog").close();
      window.dispatchEvent(new CustomEvent("almanacphi:pantry-focus",{detail:{origin,id}}));
      return;
    }
    if(!e.target.closest("[data-plan-current]")||!RECIPE_BY_ID[activeRecipeId])return;
    $("kitchenPlanRecipe").value=activeRecipeId;
    $("kitchenPlanServings").value=$("recipeServings").value;
    $("kitchenRecipeDialog").close();
    $("kitchenMealPlanner").scrollIntoView({behavior:"smooth"});
    $("kitchenPlanDate").focus({preventScroll:true});
  });
  $("kitchenPlanForm").addEventListener("submit",e=>{
    e.preventDefault();
    if(plans.length>=MAX_PLANS){note("Planner limit reached. Export and remove old entries first.");return;}
    const item={
      id:crypto.randomUUID(),recipeId:$("kitchenPlanRecipe").value,date:$("kitchenPlanDate").value,
      servings:Number($("kitchenPlanServings").value),note:$("kitchenPlanNote").value.trim().slice(0,200),done:false
    };
    if(!validateMealPlan(item)){note("Choose a valid recipe, date, and serving count.");return;}
    plans.push(item);
    note(savePlans()?"Meal planned on this device.":"Meal planned for this session; browser storage unavailable.");
    $("kitchenPlanNote").value="";renderPlan();
  });
  $("kitchenPlanList").addEventListener("click",e=>{
    const review=e.target.closest("[data-plan-pantry]");
    if(review){
      const plan=plans.find(p=>p.id===review.dataset.planPantry);
      if(plan)openRecipe(plan.recipeId);
      return;
    }
    const toggle=e.target.closest("[data-plan-toggle]"),remove=e.target.closest("[data-plan-remove]");
    if(toggle){const p=plans.find(x=>x.id===toggle.dataset.planToggle);if(p)p.done=!p.done;}
    else if(remove){if(!window.confirm("Remove this meal from your plan?"))return;plans=plans.filter(x=>x.id!==remove.dataset.planRemove);}
    else return;
    savePlans();renderPlan();
  });
  $("kitchenPlanExport").addEventListener("click",()=>saveDownload("almanacphi-meals-"+todayLocal()+".json",JSON.stringify({app:"AlmanacPhi",kind:"kitchen-meal-plan",version:1,exportedAt:new Date().toISOString(),plans},null,2),"application/json"));
  $("kitchenShoppingDownload").addEventListener("click",downloadShoppingList);
}
