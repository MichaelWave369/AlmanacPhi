import {PANTRY_ACTIONS,createPantryStock,validPantryStock,remainingContainers,addPantryUse,undoLastPantryUse} from "./pantry-stock.js";
import {updateLinkedPantryStock} from "./harvest-ui.js";

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const localDate=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
export function renderBatchStockControls(batch){
  const origin=esc(batch.origin),id=esc(batch.id);
  const attr='data-origin="'+origin+'"';
  if(batch.stock===undefined){
    return '<div class="pantry-stock-box"><p><b>Container count:</b> Not tracked. Existing batch quantities are never guessed.</p>'+
      '<form class="pantry-count-form" data-pantry-start="'+id+'" '+attr+'>'+
      '<label>Containers currently on hand <input name="opening" type="number" min="1" max="100000" step="1" required placeholder="Actual count today"></label>'+
      '<button type="submit">Start tracking</button></form></div>';
  }
  if(!validPantryStock(batch.stock))return '<p class="pantry-stock-error">Count history needs review. No new stock actions permitted.</p>';
  const remaining=remainingContainers(batch.stock),last=batch.stock.uses.at(-1);
  return '<div class="pantry-stock-box"><p><b>'+remaining+' of '+batch.stock.opening+' containers remaining</b></p>'+
    '<form class="pantry-count-form" data-pantry-use="'+id+'" '+attr+'>'+
    '<label>How many? <input name="count" type="number" min="1" max="'+remaining+'" step="1" required '+(remaining===0?'disabled':'')+'></label>'+
    '<label>Action <select name="reason" '+(remaining===0?'disabled':'')+'>'+Object.entries(PANTRY_ACTIONS).map(([value,label])=>'<option value="'+value+'">'+esc(label)+'</option>').join("")+'</select></label>'+
    '<label>Date <input type="date" name="date" value="'+localDate()+'" required '+(remaining===0?'disabled':'')+'></label>'+
    '<label>Note (optional) <input name="note" maxlength="200" placeholder="Meal, donation, or disposal details" '+(remaining===0?'disabled':'')+'></label>'+
    '<button type="submit" '+(remaining===0?'disabled':'')+'>Record removal</button></form>'+
    (last?'<div class="pantry-last-action"><span>Latest: '+esc(PANTRY_ACTIONS[last.reason])+' '+last.count+' on '+esc(last.date)+(last.note?' · '+esc(last.note):'')+'</span>'+
       '<button type="button" data-pantry-undo="'+id+'" '+attr+'>Undo latest</button></div>':'<p class="pantry-count-hint">No removals recorded yet.</p>')+
    '<p class="pantry-count-hint">A container count is not a freshness, safety, weight, or remaining-servings estimate.</p></div>';
}
function readPositiveInteger(value){
  if(typeof value!=="string"||!/^[1-9]\d*$/.test(value.trim()))return NaN;
  return Number(value);
}
export function installPantryStockEvents(root,{getRecords,updateStandalone,refresh,notify}){
  const update=(origin,id,next)=>{
    if(origin==="standalone")return updateStandalone(id,next);
    if(origin==="linked")return updateLinkedPantryStock(id,next);
    return {ok:false,message:"Unknown batch origin."};
  };
  const find=(origin,id)=>getRecords().find(x=>x.origin===origin&&x.id===id);
  root.addEventListener("submit",event=>{
    const form=event.target.closest("form[data-pantry-start], form[data-pantry-use]");
    if(!form)return;
    event.preventDefault();
    const origin=form.dataset.origin,id=form.dataset.pantryStart||form.dataset.pantryUse;
    const batch=find(origin,id);
    if(!batch){notify("Pantry batch was not found. Refresh and try again.");return;}
    let stock;
    try{
      if(form.hasAttribute("data-pantry-start")){
        if(batch.stock!==undefined)throw new RangeError("Batch is already tracked");
        stock=createPantryStock(readPositiveInteger(form.elements.opening.value));
      }else{
        if(!validPantryStock(batch.stock))throw new TypeError("No valid count history");
        stock=addPantryUse(batch.stock,{
          id:crypto.randomUUID(),date:form.elements.date.value,
          count:readPositiveInteger(form.elements.count.value),
          reason:form.elements.reason.value,note:form.elements.note.value.trim().slice(0,200)
        });
      }
    }catch(error){notify("Enter a valid whole number of containers; removals cannot exceed the balance.");return;}
    const result=update(origin,id,stock);
    if(!result.ok){notify(result.message||"Could not save stock activity.");return;}
    notify(form.hasAttribute("data-pantry-start")?"Container tracking enabled using your current count.":"Container removal recorded. This is not a food-safety assessment.");
    refresh();
  });
  root.addEventListener("click",event=>{
    const button=event.target.closest("button[data-pantry-undo]");
    if(!button)return;
    const origin=button.dataset.origin,id=button.dataset.pantryUndo,batch=find(origin,id);
    if(!batch||!validPantryStock(batch.stock)||!batch.stock.uses.length){notify("No action available to undo.");return;}
    if(!window.confirm("Undo the latest container removal in this batch? This corrects the record; it does not restore food that was physically used or discarded."))return;
    const result=update(origin,id,undoLastPantryUse(batch.stock));
    if(!result.ok){notify(result.message||"Could not undo stock activity.");return;}
    notify("Latest removal undone in the ledger.");
    refresh();
  });
}
