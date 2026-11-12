import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {RECIPE_BY_ID} from "../recipe-data.js";
import {validCookingSession,validCookingSessions,eligibleCookingSources,cookingActivity,cookingTotals,MAX_SESSIONS} from "../cooking-data.js";
import {checkLedger,canAllocate} from "../harvest-data.js";
import {createPantryStock,addPantryUse,remainingContainers} from "../pantry-stock.js";

const session=(over={})=>({
  id:"cook-1",recipeId:"summer-pasta",servings:4,date:"2026-11-11",
  note:"Family dinner",planId:"plan-1",done:false,...over
});
const lot=(over={})=>({id:"lot-tomato",crop:"tomato",date:"2026-11-09",amount:6,unit:"lb",
  sourcePlantId:"",bed:"Garden A",note:"",...over});
const allocation=(over={})=>({id:"used-tomato",lotId:"lot-tomato",date:"2026-11-11",
  amount:2,unit:"lb",purpose:"cooked",note:"Dinner sauce",sessionId:"cook-1",...over});
const stockUse=(over={})=>({id:"used-bag",date:"2026-11-11",count:1,reason:"used",
  note:"Dinner",sessionId:"cook-1",...over});
const pantryBatch=(over={})=>({id:"batch-tomato",crop:"tomato",method:"freezing",
  date:"2026-11-09",quantity:"3 freezer bags",location:"Freezer A",note:"",
  recipe:"",stock:addPantryUse(createPantryStock(3),stockUse()),...over});

test("cooking sessions validate recipes, servings, dates, unique IDs and bounded notes",()=>{
  assert.ok(validCookingSession(session()));
  assert.ok(validCookingSessions([session(),session({id:"cook-2"})]));
  assert.equal(validCookingSessions([session(),session()]),false);
  assert.equal(validCookingSession(session({recipeId:"__proto__"})),false);
  assert.equal(validCookingSession(session({date:"2026-02-30"})),false);
  assert.equal(validCookingSession(session({servings:3})),false);
  assert.equal(validCookingSession(session({note:"x".repeat(301)})),false);
  assert.equal(validCookingSession(session({done:"yes"})),false);
  assert.equal(validCookingSessions(Array.from({length:MAX_SESSIONS+1},(_,i)=>session({id:"cook-"+i}))),false);
});
test("old untagged allocations remain valid; source tags are strictly validated",()=>{
  assert.equal(checkLedger([lot()],[allocation({sessionId:undefined})]),true);
  assert.equal(checkLedger([lot()],[allocation({sessionId:"cook-1"})]),true);
  assert.equal(checkLedger([lot()],[allocation({sessionId:234})]),false);
  assert.equal(checkLedger([lot()],[allocation({sessionId:""})]),false);
  assert.equal(canAllocate(lot(),[allocation()],4,"lb"),true);
  assert.equal(canAllocate(lot(),[allocation()],5,"lb"),false);
  const original=createPantryStock(3);
  const modified=addPantryUse(original,stockUse());
  assert.equal(remainingContainers(original),3);
  assert.equal(remainingContainers(modified),2);
  assert.throws(()=>addPantryUse(modified,stockUse()),RangeError);
});
test("eligible sources include only recipe crops, positive harvest and positive tracked pantry counts",()=>{
  const harvest={lots:[lot(),lot({id:"other",crop:"corn",amount:2})],
    allocations:[allocation()]};
  const standalone=[
    pantryBatch(),
    pantryBatch({id:"unknown",crop:"basil",stock:undefined}),
    pantryBatch({id:"exhausted",crop:"garlic",stock:addPantryUse(createPantryStock(1),stockUse({count:1,id:"full"}))}),
    pantryBatch({id:"seeds",crop:"sunflower",method:"seed-saving",quantity:"packet",stock:createPantryStock(5)})
  ];
  const sources=eligibleCookingSources(RECIPE_BY_ID["summer-pasta"],harvest,standalone);
  assert.equal(sources.length,2);
  assert.deepEqual(new Set(sources.map(x=>x.kind)),new Set(["harvest","pantry-standalone"]));
  assert.equal(sources.find(x=>x.kind==="harvest").remaining,4);
  assert.equal(sources.find(x=>x.kind==="pantry-standalone").remaining,2);
  assert.ok(sources.every(x=>x.crop==="tomato"));
  assert.deepEqual(eligibleCookingSources(RECIPE_BY_ID["summer-pasta"],null,[]),[]);
});
test("cooking history is derived from source ledgers without double-counting",()=>{
  const harvest={lots:[lot(),lot({id:"lot-garlic",crop:"garlic",amount:2,unit:"lb"})],
    allocations:[
      allocation(),allocation({id:"other-meal",amount:1,sessionId:"cook-2"}),
      {id:"transfer",lotId:"lot-garlic",date:"2026-11-10",amount:1,unit:"lb",
       purpose:"preserved",note:"",pantry:{method:"freezing",quantity:"2 bags",
         location:"Freezer",recipe:"",note:"",
         stock:addPantryUse(createPantryStock(2),stockUse({id:"used-garlic"}))}}
    ]};
  assert.ok(checkLedger(harvest.lots,harvest.allocations));
  const entries=cookingActivity(session(),harvest,[pantryBatch()]);
  assert.equal(entries.length,3);
  assert.deepEqual(entries.map(x=>x.kind).sort(),["harvest","pantry-linked","pantry-standalone"]);
  assert.equal(entries.find(x=>x.kind==="harvest").amount,2);
  assert.equal(entries.find(x=>x.kind==="pantry-linked").amount,1);
  assert.deepEqual(cookingTotals(session(),harvest,[pantryBatch()]),{actions:3,crops:2});
  assert.equal(cookingActivity(session({id:"cook-2"}),harvest,[pantryBatch()]).length,1);
  assert.equal(cookingActivity(session(),null,[]).length,0);
});
test("completed session flags do not alter inventory history, and malformed ledgers are ignored",()=>{
  const harvest={lots:[lot()],allocations:[allocation()]};
  assert.deepEqual(cookingActivity(session({done:true}),harvest,[]),cookingActivity(session(),harvest,[]));
  assert.equal(cookingActivity(session(),{lots:[lot()],allocations:[allocation({amount:20})]},[]).length,0);
});
test("cooking UI and main app integrate with v8 offline build",()=>{
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
  const kitchen=readFileSync(new URL("../kitchen-ui.js",import.meta.url),"utf8");
  const ui=readFileSync(new URL("../cooking-ui.js",import.meta.url),"utf8");
  const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
  for(const id of ["cooking","cookingForm","cookingRecipe","cookingSource","cookingUseForm",
    "cookingActivity","cookingSessionList","cookingFinish","cookingExport"])
    assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(app,/initCooking\(\)/);
  assert.match(kitchen,/data-plan-cooking/);
  assert.match(kitchen,/data-cook-current/);
  assert.match(ui,/almanacphi:cooking-source-updated/);
  assert.match(ui,/checkLedger/);
  assert.match(ui,/addPantryUse/);
  assert.match(ui,/canAllocate/);
  assert.match(sw,/almanacphi-v8/);
  assert.match(sw,/cooking-ui\.js/);
  assert.match(sw,/cooking-data\.js/);
});
