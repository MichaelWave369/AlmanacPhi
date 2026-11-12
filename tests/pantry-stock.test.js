import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validPantryEntry} from "../preservation-data.js";
import {checkLedger,linkedPantryBatches} from "../harvest-data.js";
import {
  PANTRY_ACTIONS,validCalendarDate,validContainerCount,createPantryStock,
  validPantryUse,validPantryStock,remainingContainers,canRemoveContainers,
  addPantryUse,undoLastPantryUse,MAX_CONTAINERS
} from "../pantry-stock.js";
const use=(over={})=>({id:"use-1",date:"2026-11-11",count:1,reason:"used",note:"Lunch",...over});
const batch=(over={})=>({id:"batch-1",crop:"tomato",method:"freezing",date:"2026-11-11",quantity:"4 freezer bags",location:"Freezer",note:"",recipe:"",...over});
const harvest=(over={})=>({id:"lot-1",crop:"tomato",date:"2026-11-10",amount:6,unit:"lb",sourcePlantId:"",bed:"Garden",note:"",...over});
const transfer=(over={})=>({id:"transfer-1",lotId:"lot-1",date:"2026-11-11",amount:2,unit:"lb",purpose:"preserved",note:"",pantry:{method:"freezing",quantity:"4 freezer bags",location:"Freezer",recipe:"",note:""},...over});

test("legacy pantry batches and linked transfers without counts remain valid",()=>{
  assert.equal(validPantryEntry(batch()),true);
  assert.equal(checkLedger([harvest()],[transfer()]),true);
  assert.equal(linkedPantryBatches([harvest()],[transfer()])[0].stock,undefined);
});
test("opening a count is explicit and must be a positive whole number",()=>{
  assert.equal(validCalendarDate("2028-02-29"),true);
  assert.equal(validCalendarDate("2026-02-29"),false);
  assert.equal(validContainerCount(4),true);
  assert.equal(validContainerCount(0),false);
  assert.equal(validContainerCount(1.5),false);
  assert.equal(validContainerCount(MAX_CONTAINERS+1),false);
  assert.throws(()=>createPantryStock(0),RangeError);
  assert.deepEqual(createPantryStock(4),{opening:4,uses:[]});
  assert.equal(remainingContainers(createPantryStock(4)),4);
});
test("one-by-one use, sharing and discarding are tracked without overdraw",()=>{
  const start=createPantryStock(4),first=addPantryUse(start,use());
  assert.equal(remainingContainers(start),4,"Source record is not mutated");
  assert.equal(remainingContainers(first),3);
  const second=addPantryUse(first,use({id:"use-2",count:2,reason:"shared"}));
  assert.equal(remainingContainers(second),1);
  const third=addPantryUse(second,use({id:"use-3",count:1,reason:"discarded"}));
  assert.equal(remainingContainers(third),0);
  assert.equal(canRemoveContainers(third,1),false);
  assert.throws(()=>addPantryUse(third,use({id:"use-4"})),RangeError);
  assert.throws(()=>addPantryUse(second,use({id:"use-4",count:2})),RangeError);
  assert.deepEqual(Object.keys(PANTRY_ACTIONS),["used","shared","discarded"]);
});
test("duplicate IDs and invalid stock records cannot be committed",()=>{
  const first=addPantryUse(createPantryStock(3),use());
  assert.throws(()=>addPantryUse(first,use()),RangeError);
  assert.equal(validPantryUse(use({reason:"__proto__"})),false);
  assert.equal(validPantryUse(use({count:0})),false);
  assert.equal(validPantryUse(use({count:0.5})),false);
  assert.equal(validPantryUse(use({date:"2026-02-30"})),false);
  assert.equal(validPantryStock({opening:2,uses:[use(),use({id:"use-2",count:2})]}),false);
  assert.equal(validPantryStock({opening:2,uses:[use(),use()]}),false);
  assert.equal(validPantryStock({opening:1,uses:"oops"}),false);
  assert.equal(validPantryEntry(batch({stock:{opening:1,uses:[use({count:2})]}})),false);
  assert.equal(validPantryEntry(batch({stock:first})),true);
});
test("undoing latest removal corrects only the record and restores numeric balance",()=>{
  const after=addPantryUse(createPantryStock(3),use());
  const undone=undoLastPantryUse(after);
  assert.equal(remainingContainers(undone),3);
  assert.equal(remainingContainers(after),2);
  assert.equal(undone.uses.length,0);
  assert.throws(()=>undoLastPantryUse(undone),RangeError);
});
test("linked pantry counts are validated in the same harvest allocation",()=>{
  const initial=createPantryStock(3);
  const next=addPantryUse(initial,use());
  const t=transfer({pantry:{...transfer().pantry,stock:next}});
  assert.equal(checkLedger([harvest()],[t]),true);
  const linked=linkedPantryBatches([harvest()],[t]);
  assert.equal(linked.length,1);
  assert.deepEqual(linked[0].stock,next);
  assert.equal(linked[0].sourceAllocationId,"transfer-1");
  assert.equal(linked[0].harvestAmount,2);
  assert.equal(checkLedger([harvest()],[transfer({pantry:{...transfer().pantry,stock:{opening:1,uses:[use({count:2})]}}})]),false);
  assert.equal(checkLedger([harvest()],[transfer({pantry:{...transfer().pantry,stock:initial}})]),true);
});
test("static page, cache and interfaces include optional container tracking",()=>{
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
  const preservation=readFileSync(new URL("../preservation-ui.js",import.meta.url),"utf8");
  const harvestUI=readFileSync(new URL("../harvest-ui.js",import.meta.url),"utf8");
  const ui=readFileSync(new URL("../pantry-stock-ui.js",import.meta.url),"utf8");
  for(const id of ["pantryOpeningCount","harvestPantryOpeningCount","pantryStockMessage"])assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(sw,/almanacphi-v6/);
  assert.match(sw,/pantry-stock\.js/);
  assert.match(sw,/pantry-stock-ui\.js/);
  assert.match(preservation,/renderBatchStockControls/);
  assert.match(preservation,/installPantryStockEvents/);
  assert.match(harvestUI,/updateLinkedPantryStock/);
  assert.match(ui,/data-pantry-undo/);
  assert.match(ui,/data-pantry-use/);
  assert.match(ui,/data-pantry-start/);
});
