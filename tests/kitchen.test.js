import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CROPS,CROP_BY_ID} from "../crop-data.js";
import {RECIPES,RECIPE_BY_ID,SERVINGS_OPTIONS,kitchenCropsCoverage,formatQuantity,recipeIngredients,validateMealPlan} from "../recipe-data.js";

test("original kitchen recipes are complete, unique and cover all 19 crops",()=>{
  assert.equal(RECIPES.length,16);
  assert.equal(new Set(RECIPES.map(r=>r.id)).size,RECIPES.length);
  const used=new Set(kitchenCropsCoverage());
  for(const crop of CROPS)assert.ok(used.has(crop.id),"No cooking pathway for "+crop.id);
  for(const recipe of RECIPES){
    assert.ok(RECIPE_BY_ID[recipe.id]===recipe);
    assert.equal(recipe.baseServings,4);
    assert.ok(recipe.minutes>0&&recipe.minutes<=120);
    assert.ok(["spring","summer","fall","winter"].includes(recipe.season));
    assert.ok(["main","soup","quick","side"].includes(recipe.category));
    assert.ok(recipe.ingredients.length>=4);
    assert.ok(recipe.steps.length>=3);
    for(const c of recipe.crops)assert.ok(CROP_BY_ID[c],"Unknown crop "+c);
    for(const [quantity,unit,name] of recipe.ingredients){
      assert.ok(quantity===null||(Number.isFinite(quantity)&&quantity>0));
      assert.equal(typeof unit,"string");assert.ok(typeof name==="string"&&name.length>2);
    }
  }
});
test("serving scaling formats fractions without unbounded floating point noise",()=>{
  assert.equal(formatQuantity(0.125),"⅛");
  assert.equal(formatQuantity(0.5),"½");
  assert.equal(formatQuantity(1.75),"1 ¾");
  assert.equal(formatQuantity(2),"2");
  assert.throws(()=>formatQuantity(-1),RangeError);
  const pasta=RECIPE_BY_ID["summer-pasta"];
  assert.ok(recipeIngredients(pasta,2).includes("6 oz dry pasta"));
  assert.ok(recipeIngredients(pasta,4).includes("12 oz dry pasta"));
  assert.ok(recipeIngredients(pasta,8).includes("24 oz dry pasta"));
  assert.ok(recipeIngredients(pasta,2).includes("Salt and pepper to taste"));
  assert.deepEqual(SERVINGS_OPTIONS,[2,4,6,8]);
  assert.throws(()=>recipeIngredients(pasta,3),RangeError);
});
test("meal planner validates date, recipe identity, servings and note lengths",()=>{
  const sample={id:"test",recipeId:"summer-pasta",date:"2026-11-11",servings:4,note:"Use garden tomatoes",done:false};
  assert.equal(validateMealPlan(sample),true);
  assert.equal(validateMealPlan({...sample,date:"2026-02-30"}),false);
  assert.equal(validateMealPlan({...sample,date:"2028-02-29"}),true);
  assert.equal(validateMealPlan({...sample,recipeId:"__proto__"}),false);
  assert.equal(validateMealPlan({...sample,recipeId:"no-such-recipe"}),false);
  assert.equal(validateMealPlan({...sample,servings:100}),false);
  assert.equal(validateMealPlan({...sample,note:"x".repeat(201)}),false);
  assert.equal(validateMealPlan({...sample,done:"false"}),false);
});
test("static site, app initialization and service worker include kitchen modules",()=>{
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
  const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
  assert.match(html,/id="kitchen"/);
  assert.match(html,/id="kitchenRecipeDialog"/);
  assert.match(html,/id="kitchenPlanForm"/);
  assert.match(html,/id="kitchenShoppingDownload"/);
  assert.match(html,/Fresh cooking, not shelf-stable canning/);
  assert.match(app,/initKitchen\(\)/);
  assert.match(app,/data-open-kitchen/);
  assert.match(sw,/almanacphi-v3/);
  assert.match(sw,/recipe-data\.js/);
  assert.match(sw,/kitchen-ui\.js/);
  assert.match(sw,/fetch\(request\)/);
});
