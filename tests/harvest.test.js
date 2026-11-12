import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CROPS} from "../crop-data.js";
import {
  HARVEST_UNITS,HARVEST_USES,isRealDate,validQuantity,toBase,fromBase,
  compatibleUnits,validHarvest,validAllocation,canAllocate,remainingBase,
  checkLedger,cropAvailability,availableCropIds,formatHarvestAmount
} from "../harvest-data.js";

const lot=(props={})=>({id:"lot-1",crop:"tomato",date:"2026-08-15",amount:6,unit:"lb",sourcePlantId:"plant-1",bed:"Raised bed A",note:"Ripe",...props});
const use=(props={})=>({id:"used-1",lotId:"lot-1",date:"2026-08-16",amount:2,unit:"lb",purpose:"cooked",note:"Fresh tomato pasta",...props});

test("harvest amounts, dates, units and actions are validated",()=>{
  assert.equal(isRealDate("2028-02-29"),true);
  assert.equal(isRealDate("2026-02-29"),false);
  assert.equal(validQuantity(6,"lb"),true);
  assert.equal(validQuantity(2.3,"each"),false);
  assert.equal(validQuantity(-1,"lb"),false);
  assert.equal(validQuantity(Number.POSITIVE_INFINITY,"oz"),false);
  assert.equal(validQuantity(3,"stones"),false);
  assert.equal(validHarvest(lot()),true);
  assert.equal(validHarvest(lot({crop:"__proto__"})),false);
  assert.equal(validHarvest(lot({amount:-2})),false);
  assert.equal(validHarvest(lot({unit:"each",amount:1.5})),false);
  assert.equal(validAllocation(use()),true);
  assert.equal(validAllocation(use({purpose:"__proto__"})),false);
  assert.equal(validAllocation(use({date:"2026-02-30"})),false);
  assert.equal(Object.keys(HARVEST_UNITS).length,5);
  assert.equal(Object.keys(HARVEST_USES).length,5);
});
test("weight conversion works and piece counts never silently convert into mass",()=>{
  assert.ok(Math.abs(toBase(1,"lb")-453.59237)<1e-7);
  assert.ok(Math.abs(toBase(16,"oz")-toBase(1,"lb"))<1e-6);
  assert.ok(Math.abs(fromBase(toBase(1,"kg"),"lb")-2.204623)<1e-5);
  assert.equal(compatibleUnits("lb","kg"),true);
  assert.equal(compatibleUnits("each","oz"),false);
  assert.equal(compatibleUnits("each","each"),true);
  assert.equal(formatHarvestAmount(1.5,"lb"),"1.5 lb");
  assert.throws(()=>toBase(0,"kg"),RangeError);
});
test("ledger forbids double allocation and overspending after unit conversion",()=>{
  const entries=[lot()],first=[use()];
  assert.equal(checkLedger(entries,first),true);
  assert.ok(Math.abs(fromBase(remainingBase(entries[0],first),"lb")-4)<1e-6);
  assert.equal(canAllocate(entries[0],first,4,"lb"),true);
  assert.equal(canAllocate(entries[0],first,4.01,"lb"),false);
  assert.equal(canAllocate(entries[0],first,64,"oz"),true);
  assert.equal(canAllocate(entries[0],first,5,"each"),false);
  const tooMuch=use({id:"used-2",amount:5,unit:"lb",purpose:"shared"});
  assert.equal(checkLedger(entries,[...first,tooMuch]),false);
  const exact=use({id:"used-2",amount:64,unit:"oz",purpose:"preserved"});
  assert.equal(checkLedger(entries,[...first,exact]),true);
  assert.ok(remainingBase(entries[0],[...first,exact])<0.00001);
  assert.equal(checkLedger(entries,[first[0],first[0]]),false);
  assert.equal(checkLedger(entries,[use({lotId:"missing"})]),false);
  assert.equal(checkLedger([lot(),lot()],[use()]),false);
});
test("crop inventory aggregates weights separately from item counts",()=>{
  const lots=[
    lot(),
    lot({id:"tomato-piece",unit:"each",amount:7}),
    lot({id:"carrot",crop:"carrot",amount:2,unit:"kg",sourcePlantId:""})
  ];
  const allocations=[use(),use({id:"used-2",lotId:"tomato-piece",amount:2,unit:"each",purpose:"shared"})];
  assert.equal(checkLedger(lots,allocations),true);
  const stock=cropAvailability(lots,allocations);
  assert.equal(stock.length,3);
  assert.equal(stock.find(x=>x.crop==="tomato"&&x.kind==="count").amount,5);
  assert.equal(stock.find(x=>x.crop==="tomato"&&x.kind==="mass").amount>1800,true);
  assert.ok(availableCropIds(lots,allocations).has("carrot"));
  assert.ok(availableCropIds(lots,allocations).has("tomato"));
  assert.equal(cropAvailability([lot()],[use({amount:6})]).length,0);
  assert.equal(cropAvailability([lot()],[use({amount:7})]).length,0);
  assert.equal(new Set(CROPS.map(c=>c.id)).size,CROPS.length);
});
test("harvest ledger UI and service worker are included in the static app",()=>{
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
  const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
  const kitchen=readFileSync(new URL("../kitchen-ui.js",import.meta.url),"utf8");
  for(const id of ["harvest","harvestForm","harvestUseForm","harvestUseLot","harvestStock","harvestLots","harvestAllocations","harvestExport","harvestRawBackup","recipeFromHarvest"])
    assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(app,/showPlantHarvest/);
  assert.match(app,/setHarvestPlantings\(garden\)/);
  assert.match(app,/initHarvest\(\)/);
  assert.match(kitchen,/showHarvestKitchen/);
  assert.match(kitchen,/availableCropIds/);
  assert.ok(Number(sw.match(/almanacphi-v(\d+)/)?.[1])>=4);
  assert.match(sw,/harvest-data\.js/);
  assert.match(sw,/harvest-ui\.js/);
});
