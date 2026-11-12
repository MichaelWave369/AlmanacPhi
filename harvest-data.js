// Offline-first harvest arithmetic. Weight units may be converted; piece counts never convert to weight.
import {CROP_BY_ID} from "./crop-data.js";
import {validPantryEntry} from "./preservation-data.js";
export const HARVEST_UNITS=Object.freeze({
  g:{label:"grams",kind:"mass",factor:1},
  kg:{label:"kilograms",kind:"mass",factor:1000},
  oz:{label:"ounces",kind:"mass",factor:28.349523125},
  lb:{label:"pounds",kind:"mass",factor:453.59237},
  each:{label:"individual items",kind:"count",factor:1}
});
export const HARVEST_USES=Object.freeze({
  cooked:"Cooked or eaten",preserved:"Preserved or stored",shared:"Shared or donated",
  composted:"Composted or spoiled",other:"Other use"
});
const EPS=0.00001,ROUND=1e6;
const round=n=>Math.round(n*ROUND)/ROUND;
export function isRealDate(value){
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const [year,month,day]=value.split("-").map(Number);
  const d=new Date(Date.UTC(year,month-1,day));
  return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day;
}
export function validQuantity(amount,unit){
  return typeof amount==="number"&&Number.isFinite(amount)&&amount>0&&amount<=1000000&&
    Object.hasOwn(HARVEST_UNITS,unit)&&
    (unit!=="each"||Number.isSafeInteger(amount));
}
export function toBase(amount,unit){
  if(!validQuantity(amount,unit))throw new RangeError("Invalid harvest quantity or unit");
  return amount*HARVEST_UNITS[unit].factor;
}
export function fromBase(amount,unit){
  if(!Number.isFinite(amount)||amount<0||!Object.hasOwn(HARVEST_UNITS,unit))throw new RangeError("Invalid base quantity");
  return round(amount/HARVEST_UNITS[unit].factor);
}
export function compatibleUnits(a,b){
  return !!HARVEST_UNITS[a]&&!!HARVEST_UNITS[b]&&HARVEST_UNITS[a].kind===HARVEST_UNITS[b].kind;
}
export function validHarvest(entry){
  return !!entry&&typeof entry.id==="string"&&entry.id.length>0&&entry.id.length<=90&&
    typeof entry.crop==="string"&&Object.hasOwn(CROP_BY_ID,entry.crop)&&
    isRealDate(entry.date)&&validQuantity(entry.amount,entry.unit)&&
    typeof entry.sourcePlantId==="string"&&entry.sourcePlantId.length<=90&&
    typeof entry.bed==="string"&&entry.bed.length<=100&&
    typeof entry.note==="string"&&entry.note.length<=400;
}
export function validAllocation(entry){
  return !!entry&&typeof entry.id==="string"&&entry.id.length>0&&entry.id.length<=90&&
    typeof entry.lotId==="string"&&entry.lotId.length>0&&entry.lotId.length<=90&&
    isRealDate(entry.date)&&validQuantity(entry.amount,entry.unit)&&
    Object.hasOwn(HARVEST_USES,entry.purpose)&&
    typeof entry.note==="string"&&entry.note.length<=400;
}
// A linked pantry batch lives inside its harvest allocation, giving both views
// one durable source of truth and avoiding two independent localStorage writes.
// A link is a RECORD, never evidence that processing or a product is food-safe.
export function safeRecipeSource(value){
  if(typeof value!=="string")return false;
  if(value==="")return true;
  try{
    const link=new URL(value);
    return link.protocol==="https:"&&!!link.hostname&&!link.username&&!link.password;
  }catch{return false;}
}
export function linkedPantryEntry(allocation,lot){
  if(!allocation?.pantry||!lot)return null;
  return {
    id:allocation.id,crop:lot.crop,method:allocation.pantry.method,date:allocation.date,
    quantity:allocation.pantry.quantity,location:allocation.pantry.location,
    note:allocation.pantry.note,recipe:allocation.pantry.recipe,
    sourceAllocationId:allocation.id,sourceHarvestLotId:lot.id,
    harvestAmount:allocation.amount,harvestUnit:allocation.unit
  };
}
export function validLinkedPantry(allocation,lot){
  if(!allocation?.pantry)return true;
  if(allocation.purpose!=="preserved"||!lot)return false;
  const p=allocation.pantry;
  if(!p||typeof p!=="object"||Array.isArray(p))return false;
  const entry=linkedPantryEntry(allocation,lot);
  return validPantryEntry(entry)&&entry.quantity.trim().length>0&&entry.location.trim().length>0&&
    safeRecipeSource(entry.recipe)&&
    (!["water-bath","pressure"].includes(entry.method)||entry.recipe!=="");
}
export function linkedPantryBatches(lots,allocations){
  if(!checkLedger(lots,allocations))return [];
  const map=new Map(lots.map(l=>[l.id,l]));
  return allocations.filter(a=>a.pantry).map(a=>linkedPantryEntry(a,map.get(a.lotId)));
}
export function usedBase(lot,allocations){
  if(!validHarvest(lot)||!Array.isArray(allocations))throw new TypeError("Invalid lot or allocations");
  let used=0;
  for(const allocation of allocations){
    if(allocation.lotId!==lot.id)continue;
    if(!validAllocation(allocation)||!compatibleUnits(allocation.unit,lot.unit))throw new TypeError("Invalid allocation for lot");
    used+=toBase(allocation.amount,allocation.unit);
  }
  return used;
}
export function remainingBase(lot,allocations){
  return Math.max(0,toBase(lot.amount,lot.unit)-usedBase(lot,allocations));
}
export function canAllocate(lot,allocations,amount,unit){
  return validHarvest(lot)&&Array.isArray(allocations)&&validQuantity(amount,unit)&&
    compatibleUnits(lot.unit,unit)&&
    toBase(amount,unit)<=remainingBase(lot,allocations)+EPS;
}
export function checkLedger(lots,allocations){
  if(!Array.isArray(lots)||!Array.isArray(allocations))return false;
  const ids=new Set(),allocIds=new Set(),map=new Map();
  for(const lot of lots){
    if(!validHarvest(lot)||ids.has(lot.id))return false;
    ids.add(lot.id);map.set(lot.id,lot);
  }
  for(const allocation of allocations){
    if(!validAllocation(allocation)||allocIds.has(allocation.id))return false;
    allocIds.add(allocation.id);
    const lot=map.get(allocation.lotId);
    if(!lot||!compatibleUnits(lot.unit,allocation.unit)||!validLinkedPantry(allocation,lot))return false;
  }
  for(const lot of lots)if(usedBase(lot,allocations)>toBase(lot.amount,lot.unit)+EPS)return false;
  return true;
}
export function cropAvailability(lots,allocations){
  if(!checkLedger(lots,allocations))return [];
  const aggregate=new Map();
  for(const lot of lots){
    const balance=remainingBase(lot,allocations);
    if(balance<EPS)continue;
    const kind=HARVEST_UNITS[lot.unit].kind,key=lot.crop+"|"+kind;
    aggregate.set(key,(aggregate.get(key)||0)+balance);
  }
  return [...aggregate].map(([key,amount])=>{
    const [crop,kind]=key.split("|");
    return {crop,kind,amount:round(amount)};
  }).sort((a,b)=>a.crop.localeCompare(b.crop)||a.kind.localeCompare(b.kind));
}
export function formatHarvestAmount(value,unit){
  if(!Number.isFinite(value)||value<0||!Object.hasOwn(HARVEST_UNITS,unit))throw new RangeError("Invalid display quantity");
  return (Math.round(value*100)/100).toLocaleString("en-US",{maximumFractionDigits:2})+" "+unit;
}
export function availableCropIds(lots,allocations){
  return new Set(cropAvailability(lots,allocations).map(x=>x.crop));
}
