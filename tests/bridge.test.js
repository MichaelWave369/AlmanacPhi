import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {checkLedger,linkedPantryBatches,safeRecipeSource,validLinkedPantry,canAllocate,remainingBase,fromBase} from "../harvest-data.js";

const lot=(over={})=>({
  id:"lot-tomato-1",crop:"tomato",date:"2026-08-12",amount:6,unit:"lb",
  sourcePlantId:"plant-1",bed:"Raised bed",note:"Ripe",...over
});
const allocation=(over={})=>({
  id:"transfer-1",lotId:"lot-tomato-1",date:"2026-08-13",amount:4,unit:"lb",
  purpose:"preserved",note:"Preserved from home garden",
  pantry:{method:"freezing",quantity:"4 freezer bags",location:"Freezer shelf 2",recipe:"",note:"Blanched as directed"},
  ...over
});

test("legacy harvest allocations and independent pantry records remain valid",()=>{
  assert.equal(checkLedger([lot()],[{id:"old",lotId:"lot-tomato-1",date:"2026-08-13",amount:2,unit:"lb",purpose:"cooked",note:"soup"}]),true);
  assert.deepEqual(linkedPantryBatches([lot()],[]),[]);
  assert.equal(validLinkedPantry({purpose:"cooked",pantry:undefined},lot()),true);
});
test("one linked harvest transfer creates a traceable pantry projection",()=>{
  const lots=[lot()],uses=[allocation()];
  assert.equal(checkLedger(lots,uses),true);
  assert.equal(validLinkedPantry(uses[0],lots[0]),true);
  const linked=linkedPantryBatches(lots,uses);
  assert.equal(linked.length,1);
  assert.deepEqual(linked[0],{
    id:"transfer-1",crop:"tomato",method:"freezing",date:"2026-08-13",
    quantity:"4 freezer bags",location:"Freezer shelf 2",recipe:"",note:"Blanched as directed",
    sourceAllocationId:"transfer-1",sourceHarvestLotId:"lot-tomato-1",
    harvestAmount:4,harvestUnit:"lb"
  });
  assert.ok(Math.abs(fromBase(remainingBase(lots[0],uses),"lb")-2)<0.000001);
  assert.equal(canAllocate(lots[0],uses,3,"lb"),false);
  assert.equal(canAllocate(lots[0],uses,2,"lb"),true);
  // The read-only pantry projection is derived, never stored independently.
  assert.deepEqual(linkedPantryBatches(lots,[]),[]);
});
test("canning links require an HTTPS recipe source and crop-compatible method",()=>{
  const canned=allocation({pantry:{method:"water-bath",quantity:"3 pint jars",location:"Pantry",recipe:"https://nchfp.uga.edu/how/can/",note:"Tested procedure followed"}});
  assert.equal(checkLedger([lot()],[canned]),true);
  for(const source of ["","http://example.com/foo","javascript:alert(1)","file:///tmp/recipe","https://user:pass@example.com/recipe","not a url"]){
    assert.equal(checkLedger([lot()],[allocation({pantry:{...canned.pantry,recipe:source}})]),false,source);
  }
  assert.equal(checkLedger([lot({crop:"corn"})],[canned]),false,"Corn must not inherit tomato water-bath method");
  assert.equal(checkLedger([lot()],[allocation({pantry:{...canned.pantry,method:"pressure"}})]),true);
  assert.equal(safeRecipeSource(""),true);
  assert.equal(safeRecipeSource("https://nchfp.uga.edu/"),true);
  assert.equal(safeRecipeSource("https://user@example.com/"),false);
});
test("malformed or inconsistent linked records are rejected and older balances are protected",()=>{
  assert.equal(checkLedger([lot()],[allocation({purpose:"cooked"})]),false);
  assert.equal(checkLedger([lot()],[allocation({pantry:{...allocation().pantry,quantity:""}})]),false);
  assert.equal(checkLedger([lot()],[allocation({pantry:{...allocation().pantry,location:""}})]),false);
  assert.equal(checkLedger([lot()],[allocation({pantry:{...allocation().pantry,method:"__proto__"}})]),false);
  assert.equal(checkLedger([lot()],[allocation({pantry:{...allocation().pantry,recipe:"https://host.com/",note:"x".repeat(501)}})]),false);
  assert.equal(checkLedger([lot()],[allocation({amount:7})]),false);
  assert.equal(checkLedger([lot()],[allocation({amount:1,unit:"each"})]),false);
  assert.equal(checkLedger([lot()],[allocation({pantry:{method:"freezing",quantity:"1 bag",location:"Freezer",recipe:"",note:""}}),allocation({id:"transfer-1"})]),false);
  assert.equal(linkedPantryBatches([lot()],[allocation({amount:7})]).length,0);
});
test("new harvest-to-pantry controls and local storage integration are present",()=>{
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const harvest=readFileSync(new URL("../harvest-ui.js",import.meta.url),"utf8");
  const pantry=readFileSync(new URL("../preservation-ui.js",import.meta.url),"utf8");
  const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
  for(const id of ["harvestPantryLinkBox","harvestLinkPantry","harvestPantryFields","harvestPantryMethod",
    "harvestPantryQuantity","harvestPantryLocation","harvestPantryRecipe","harvestPantryNote"])
    assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(harvest,/validLinkedPantry/);
  assert.match(harvest,/entry\.pantry/);
  assert.match(harvest,/remove its linked pantry batch/);
  assert.match(pantry,/linkedPantryBatches/);
  assert.match(pantry,/almanacphi:harvest-updated/);
  assert.match(pantry,/linkedPantry:readLinkedPantry\(\)/);
  assert.match(sw,/almanacphi-v5/);
});
