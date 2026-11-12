import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {RECIPES,RECIPE_BY_ID} from "../recipe-data.js";
import {createPantryStock,addPantryUse} from "../pantry-stock.js";
import {
  pantryCandidates,pantryCandidatesForRecipe,matchedTrackedPantryCrops,
  pantrySummary,INEDIBLE_STOCK_METHODS
} from "../pantry-kitchen.js";

const batch=(over={})=>({
  id:"standalone-1",crop:"tomato",method:"freezing",date:"2026-11-11",
  quantity:"3 freezer bags",location:"Freezer",note:"",recipe:"",stock:createPantryStock(3),...over
});
const lot=()=>({id:"lot-1",crop:"corn",date:"2026-11-10",amount:6,unit:"lb",
  sourcePlantId:"",bed:"Garden",note:""});
const transfer=(over={})=>({
  id:"allocation-1",lotId:"lot-1",date:"2026-11-11",amount:2,unit:"lb",
  purpose:"preserved",note:"",pantry:{
    method:"freezing",quantity:"2 freezer bags",location:"Freezer 2",note:"",recipe:"",
    stock:createPantryStock(2)
  },...over
});
test("read-only pantry candidates merge standalone and linked records without duplicating provenance",()=>{
  const results=pantryCandidates([batch()],{lots:[lot()],allocations:[transfer()]});
  assert.equal(results.length,2);
  assert.equal(results.find(b=>b.origin==="standalone").remaining,3);
  assert.equal(results.find(b=>b.origin==="linked").remaining,2);
  assert.equal(results.find(b=>b.origin==="linked").crop,"corn");
  assert.equal(results.find(b=>b.origin==="linked").id,"allocation-1");
  assert.equal(pantrySummary(results).trackedBatches,2);
  assert.equal(pantrySummary(results).crops,2);
});
test("zero-count pantry batches and planting seed stock are not recipe candidates",()=>{
  const empty=addPantryUse(createPantryStock(2),{
    id:"used-1",date:"2026-11-11",count:2,reason:"used",note:""
  });
  const results=pantryCandidates([
    batch({stock:empty}),
    batch({id:"seeds-1",crop:"sunflower",method:"seed-saving",quantity:"packet",stock:createPantryStock(4)}),
    batch({id:"not-a-crop",crop:"bogus"}),
    batch({id:"bad-date",date:"2026-02-30"})
  ],null);
  assert.deepEqual(results,[]);
  assert.ok(INEDIBLE_STOCK_METHODS.has("seed-saving"));
});
test("legacy untracked batches remain visible as unknown, but never claim positive stock",()=>{
  const results=pantryCandidates([batch({stock:undefined})],null);
  assert.equal(results.length,1);
  assert.equal(results[0].remaining,null);
  assert.equal(results[0].tracked,false);
  assert.deepEqual(pantrySummary(results),{trackedBatches:0,unknownBatches:1,crops:0});
  const recipe=RECIPE_BY_ID["summer-pasta"];
  assert.equal(pantryCandidatesForRecipe(recipe,results).length,1);
  assert.equal(pantryCandidatesForRecipe(recipe,results,{trackedOnly:true}).length,0);
  assert.equal(matchedTrackedPantryCrops(recipe,results).size,0);
});
test("recipe hints only match crops by identity, never calculate portions or imply food safety",()=>{
  const results=pantryCandidates([
    batch({id:"tomato",crop:"tomato",stock:createPantryStock(1)}),
    batch({id:"garlic",crop:"garlic",method:"freezing",stock:createPantryStock(2)}),
    batch({id:"pepper",crop:"pepper",stock:createPantryStock(2)})
  ],null);
  const recipe=RECIPE_BY_ID["summer-pasta"];
  const matches=pantryCandidatesForRecipe(recipe,results,{trackedOnly:true});
  assert.equal(matches.length,2);
  assert.deepEqual([...matchedTrackedPantryCrops(recipe,results)].sort(),["garlic","tomato"]);
  assert.ok(matches.every(x=>!Object.hasOwn(x,"isSafe")&&!Object.hasOwn(x,"servingsAvailable")));
  assert.equal(pantryCandidatesForRecipe(RECIPE_BY_ID["broccoli-potato-soup"],results).length,1);
  assert.equal(pantryCandidatesForRecipe(null,results).length,0);
});
test("malformed linked harvest is ignored while valid standalone pantry entries remain available",()=>{
  const results=pantryCandidates([batch()],{lots:[lot()],allocations:[transfer({amount:10})]});
  assert.equal(results.length,1);
  assert.equal(results[0].origin,"standalone");
  assert.deepEqual(pantryCandidates(null,null),[]);
});
test("Kitchen UI links to precise Pantry batches without auto-subtracting stock",()=>{
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const kitchen=readFileSync(new URL("../kitchen-ui.js",import.meta.url),"utf8");
  const preserve=readFileSync(new URL("../preservation-ui.js",import.meta.url),"utf8");
  const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
  assert.match(html,/id="recipeFromPantry"/);
  assert.match(html,/id="kitchenPantrySummary"/);
  assert.match(kitchen,/data-review-pantry/);
  assert.match(kitchen,/data-plan-pantry/);
  assert.match(kitchen,/almanacphi:pantry-focus/);
  assert.match(kitchen,/almanacphi:pantry-updated/);
  assert.match(preserve,/data-pantry-origin/);
  assert.match(preserve,/data-pantry-id/);
  assert.match(preserve,/almanacphi:pantry-focus/);
  assert.match(preserve,/almanacphi:pantry-updated/);
  assert.ok(Number(sw.match(/almanacphi-v(\d+)/)?.[1])>=7);
  assert.match(sw,/pantry-kitchen\.js/);
  assert.equal(RECIPES.length,16);
});
