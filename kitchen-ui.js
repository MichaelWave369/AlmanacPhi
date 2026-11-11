import {CROPS,CROP_BY_ID} from "./crop-data.js";
import {RECIPES,RECIPE_BY_ID,SERVINGS_OPTIONS,recipeIngredients,validateMealPlan} from "./recipe-data.js";
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
function renderRecipes(){
  const crop=$("recipeCropFilter").value,season=$("recipeSeasonFilter").value,search=$("recipeSearch").value.trim().toLowerCase();
  const filtered=RECIPES.filter(r=>(crop==="all"||r.crops.includes(crop))&&(season==="all"||r.season===season)&&
    (r.title.toLowerCase().includes(search)||r.description.toLowerCase().includes(search)||r.crops.some(id=>CROP_BY_ID[id].name.toLowerCase().includes(search))));
  $("kitchenRecipeCards").innerHTML=filtered.map(r=>
    '<button type="button" class="kitchen-recipe-card" data-open-recipe="'+r.id+'" aria-label="Open recipe for '+esc(r.title)+'">'+
    '<span class="recipe-sticker">'+esc(r.season.toUpperCase())+' · '+r.minutes+' MIN</span><strong>'+esc(r.title)+'</strong>'+
    '<span class="recipe-crops">'+r.crops.slice(0,4).map(id=>CROP_BY_ID[id].emoji).join(" ")+'</span>'+
    '<span class="recipe-description">'+esc(r.description)+'</span><span class="crop-link">VIEW RECIPE ↗</span></button>'
  ).join("")||'<div class="empty-state">No recipes match these filters. Try another season or crop.</div>';
  $("kitchenRecipeCount").textContent=filtered.length+" of "+RECIPES.length+" original recipes";
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
    '<div class="kitchen-recipe-safety"><b>Cook and eat, not can.</b> These are original fresh-cooking recipes, not validated shelf-stable preservation methods. Refrigerate perishable leftovers promptly and reheat leftovers to 165°F (74°C).</div>'+
    '<button class="button primary full" type="button" data-plan-current>Plan this garden meal +</button>';
  renderRecipeIngredients();
  $("kitchenRecipeDialog").showModal();
}
function renderPlan(){
  $("kitchenPlanCount").textContent=String(plans.length);
  $("kitchenPlanList").innerHTML=plans.length?[...plans].sort((a,b)=>a.date.localeCompare(b.date)).map(p=>{
    const r=RECIPE_BY_ID[p.recipeId];
    return '<article class="kitchen-plan-entry'+(p.done?" done":"")+'"><div><h4>'+esc(r.title)+'</h4><p>'+esc(p.date)+' · '+p.servings+' servings · '+r.minutes+' min</p>'+ (p.note?'<p>'+esc(p.note)+'</p>':'')+'</div>'+
      '<div class="kitchen-plan-actions"><button type="button" data-plan-toggle="'+esc(p.id)+'">'+(p.done?'Reopen':'Cooked')+'</button>'+
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
    return [p.date+" · "+recipe.title+" · "+p.servings+" servings",...recipeIngredients(recipe,p.servings).map(s=>"  [ ] "+s),""];
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
  $("kitchenRecipeCards").addEventListener("click",e=>{
    const btn=e.target.closest("button[data-open-recipe]");
    if(btn)openRecipe(btn.dataset.openRecipe);
  });
  $("kitchenRecipeDialogClose").addEventListener("click",()=>$("kitchenRecipeDialog").close());
  $("kitchenRecipeDialog").addEventListener("click",e=>{if(e.target===$("kitchenRecipeDialog"))$("kitchenRecipeDialog").close()});
  $("kitchenRecipeDialogBody").addEventListener("change",e=>{if(e.target.id==="recipeServings")renderRecipeIngredients()});
  $("kitchenRecipeDialogBody").addEventListener("click",e=>{
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
    const toggle=e.target.closest("[data-plan-toggle]"),remove=e.target.closest("[data-plan-remove]");
    if(toggle){const p=plans.find(x=>x.id===toggle.dataset.planToggle);if(p)p.done=!p.done;}
    else if(remove){if(!window.confirm("Remove this meal from your plan?"))return;plans=plans.filter(x=>x.id!==remove.dataset.planRemove);}
    else return;
    savePlans();renderPlan();
  });
  $("kitchenPlanExport").addEventListener("click",()=>saveDownload("almanacphi-meals-"+todayLocal()+".json",JSON.stringify({app:"AlmanacPhi",kind:"kitchen-meal-plan",version:1,exportedAt:new Date().toISOString(),plans},null,2),"application/json"));
  $("kitchenShoppingDownload").addEventListener("click",downloadShoppingList);
}
