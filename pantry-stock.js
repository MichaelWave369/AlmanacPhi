// Explicit, local-only counts of *user-defined packages/containers*.
// These numbers never imply food safety, freshness, servings, or weight.
export const PANTRY_ACTIONS=Object.freeze({used:"Used",shared:"Shared or donated",discarded:"Discarded"});
export const MAX_CONTAINERS=100000, MAX_STOCK_EVENTS=1000;
export function validCalendarDate(value){
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const [y,m,d]=value.split("-").map(Number),date=new Date(Date.UTC(y,m-1,d));
  return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d;
}
export function validContainerCount(value){
  return typeof value==="number"&&Number.isSafeInteger(value)&&value>=1&&value<=MAX_CONTAINERS;
}
export function createPantryStock(count){
  if(!validContainerCount(count))throw new RangeError("Enter a positive whole package count");
  return {opening:count,uses:[]};
}
export function validPantryUse(action){
  return !!action&&typeof action==="object"&&!Array.isArray(action)&&
    typeof action.id==="string"&&action.id.length>0&&action.id.length<=90&&
    validCalendarDate(action.date)&&validContainerCount(action.count)&&
    typeof action.reason==="string"&&Object.hasOwn(PANTRY_ACTIONS,action.reason)&&
    typeof action.note==="string"&&action.note.length<=200;
}
export function validPantryStock(stock){
  if(!stock||typeof stock!=="object"||Array.isArray(stock)||!validContainerCount(stock.opening)||
    !Array.isArray(stock.uses)||stock.uses.length>MAX_STOCK_EVENTS)return false;
  const seen=new Set();
  let used=0;
  for(const action of stock.uses){
    if(!validPantryUse(action)||seen.has(action.id))return false;
    seen.add(action.id);
    used+=action.count;
    if(used>stock.opening)return false;
  }
  return true;
}
export function remainingContainers(stock){
  if(!validPantryStock(stock))throw new TypeError("Invalid pantry stock record");
  return stock.opening-stock.uses.reduce((n,action)=>n+action.count,0);
}
export function canRemoveContainers(stock,count){
  return validPantryStock(stock)&&validContainerCount(count)&&count<=remainingContainers(stock)&&
    stock.uses.length<MAX_STOCK_EVENTS;
}
export function addPantryUse(stock,action){
  if(!validPantryUse(action)||!canRemoveContainers(stock,action.count)||
    stock.uses.some(existing=>existing.id===action.id))
    throw new RangeError("Invalid, duplicate, or excessive package removal");
  const next={opening:stock.opening,uses:[...stock.uses,action]};
  if(!validPantryStock(next))throw new TypeError("New stock record failed validation");
  return next;
}
export function undoLastPantryUse(stock){
  if(!validPantryStock(stock)||stock.uses.length===0)throw new RangeError("No stock action to undo");
  return {opening:stock.opening,uses:stock.uses.slice(0,-1)};
}
