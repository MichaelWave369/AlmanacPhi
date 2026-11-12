// Cooking sessions are human-entered notes. Their ingredient activity is
// projected from authoritative harvest allocations and pantry stock actions.
// No ingredient conversion, food safety decision, or automatic deduction.
import {RECIPE_BY_ID,SERVINGS_OPTIONS} from "./recipe-data.js";
import {CROP_BY_ID} from "./crop-data.js";
import {validCalendarDate,validPantryStock,remainingContainers} from "./pantry-stock.js";
import {checkLedger,remainingBase,fromBase} from "./harvest-data.js";
import {validPantryEntry} from "./preservation-data.js";
import {pantryCandidates} from "./pantry-kitchen.js";

export const COOKING_KEY="almanacphi.cooking.v1";
export const MAX_SESSIONS=300;
export function validCookingSession(s){
  return !!s&&typeof s==="object"&&!Array.isArray(s)&&
    typeof s.id==="string"&&s.id.length>0&&s.id.length<=90&&
    typeof s.recipeId==="string"&&Object.hasOwn(RECIPE_BY_ID,s.recipeId)&&
    SERVINGS_OPTIONS.includes(s.servings)&&validCalendarDate(s.date)&&
    typeof s.note==="string"&&s.note.length<=300&&
    (s.planId===undefined||(typeof s.planId==="string"&&s.planId.length<=90))&&
    typeof s.done==="boolean";
}
export function validCookingSessions(sessions){
  return Array.isArray(sessions)&&sessions.length<=MAX_SESSIONS&&
    new Set(sessions.map(s=>s?.id)).size===sessions.length&&sessions.every(validCookingSession);
}
export function eligibleCookingSources(recipe,harvest,standalone){
  if(!recipe||!Array.isArray(recipe.crops))return [];
  const crops=new Set(recipe.crops),sources=[];
  if(harvest&&checkLedger(harvest.lots,harvest.allocations)){
    for(const lot of harvest.lots){
      if(!crops.has(lot.crop))continue;
      const remaining=fromBase(remainingBase(lot,harvest.allocations),lot.unit);
      if(remaining>0.00001)sources.push({kind:"harvest",id:lot.id,crop:lot.crop,
        unit:lot.unit,remaining,detail:lot.bed||"Garden",date:lot.date});
    }
  }
  const pantry=pantryCandidates(standalone,harvest);
  for(const batch of pantry){
    if(!crops.has(batch.crop)||batch.remaining===null||batch.remaining<=0)continue;
    sources.push({kind:batch.origin==="linked"?"pantry-linked":"pantry-standalone",
      id:batch.id,crop:batch.crop,unit:"containers",remaining:batch.remaining,
      detail:batch.location+" · "+batch.method,date:batch.date});
  }
  return sources.sort((a,b)=>a.crop.localeCompare(b.crop)||a.kind.localeCompare(b.kind));
}
export function cookingActivity(session,harvest,standalone){
  if(!validCookingSession(session))return [];
  const list=[];
  if(harvest&&checkLedger(harvest.lots,harvest.allocations)){
    const lotById=new Map(harvest.lots.map(l=>[l.id,l]));
    for(const a of harvest.allocations){
      if(a.sessionId!==session.id||a.purpose!=="cooked")continue;
      const lot=lotById.get(a.lotId);
      if(lot&&Object.hasOwn(CROP_BY_ID,lot.crop))
        list.push({id:a.id,kind:"harvest",crop:lot.crop,amount:a.amount,unit:a.unit,date:a.date,note:a.note});
    }
    for(const a of harvest.allocations){
      if(!a.pantry?.stock||!validPantryStock(a.pantry.stock))continue;
      const lot=lotById.get(a.lotId);
      if(!lot)continue;
      for(const u of a.pantry.stock.uses){
        if(u.sessionId===session.id&&u.reason==="used")
          list.push({id:u.id,kind:"pantry-linked",crop:lot.crop,amount:u.count,unit:"containers",date:u.date,note:u.note});
      }
    }
  }
  if(Array.isArray(standalone)){
    for(const batch of standalone){
      if(!validPantryEntry(batch)||!validPantryStock(batch.stock))continue;
      for(const u of batch.stock.uses){
        if(u.sessionId===session.id&&u.reason==="used")
          list.push({id:u.id,kind:"pantry-standalone",crop:batch.crop,amount:u.count,unit:"containers",date:u.date,note:u.note});
      }
    }
  }
  return list.sort((a,b)=>a.date.localeCompare(b.date)||a.kind.localeCompare(b.kind));
}
export function cookingTotals(session,harvest,standalone){
  const activities=cookingActivity(session,harvest,standalone);
  return {actions:activities.length,crops:new Set(activities.map(x=>x.crop)).size};
}
