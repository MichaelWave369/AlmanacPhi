// Read-only recipe-to-pantry hints. Never converts jars to ingredient quantities
// or assumes that a preserved crop can replace a fresh ingredient.
import {CROP_BY_ID} from "./crop-data.js";
import {validPantryEntry} from "./preservation-data.js";
import {checkLedger,linkedPantryBatches} from "./harvest-data.js";
import {validCalendarDate,validPantryStock,remainingContainers} from "./pantry-stock.js";

export const INEDIBLE_STOCK_METHODS=new Set(["seed-saving"]);
export function pantryCandidates(standalone,harvest){
  const records=[];
  if(Array.isArray(standalone)){
    for(const batch of standalone){
      if(validPantryEntry(batch)&&validCalendarDate(batch.date))
        records.push({...batch,origin:"standalone"});
    }
  }
  if(harvest&&checkLedger(harvest.lots,harvest.allocations)){
    for(const batch of linkedPantryBatches(harvest.lots,harvest.allocations))
      if(validPantryEntry(batch)&&validCalendarDate(batch.date))
        records.push({...batch,origin:"linked"});
  }
  return records.filter(batch=>!INEDIBLE_STOCK_METHODS.has(batch.method)&&
    Object.hasOwn(CROP_BY_ID,batch.crop)).map(batch=>{
    const tracked=batch.stock!==undefined&&validPantryStock(batch.stock);
    const count=tracked?remainingContainers(batch.stock):null;
    return {
      origin:batch.origin,id:batch.id,crop:batch.crop,method:batch.method,
      quantity:batch.quantity,location:batch.location,date:batch.date,
      remaining:count,tracked,reference:batch.recipe||""
    };
  }).filter(batch=>batch.remaining===null||batch.remaining>0);
}
export function pantryCandidatesForRecipe(recipe,candidates,{trackedOnly=false}={}){
  if(!recipe||!Array.isArray(recipe.crops)||!Array.isArray(candidates))return [];
  const ids=new Set(recipe.crops);
  return candidates.filter(batch=>ids.has(batch.crop)&&(!trackedOnly||batch.remaining!==null))
    .sort((a,b)=>(b.remaining!==null)-(a.remaining!==null)||b.date.localeCompare(a.date));
}
export function matchedTrackedPantryCrops(recipe,candidates){
  return new Set(pantryCandidatesForRecipe(recipe,candidates,{trackedOnly:true}).map(batch=>batch.crop));
}
export function pantrySummary(candidates){
  if(!Array.isArray(candidates))return {trackedBatches:0,unknownBatches:0,crops:0};
  const tracked=candidates.filter(b=>b.remaining!==null&&b.remaining>0);
  return {
    trackedBatches:tracked.length,
    unknownBatches:candidates.filter(b=>b.remaining===null).length,
    crops:new Set(tracked.map(b=>b.crop)).size
  };
}
