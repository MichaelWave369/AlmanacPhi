import {CROPS,CROP_BY_ID} from "./crop-data.js";
import {RECIPES,RECIPE_BY_ID,SERVINGS_OPTIONS} from "./recipe-data.js";
import {validCookingSession,validCookingSessions,eligibleCookingSources,cookingActivity,cookingTotals,COOKING_KEY,MAX_SESSIONS} from "./cooking-data.js";
import {checkLedger,canAllocate,validAllocation} from "./harvest-data.js";
import {validPantryEntry} from "./preservation-data.js";
import {validPantryStock,addPantryUse} from "./pantry-stock.js";

const $=id=>document.getElementById(id),HARVEST_KEY="almanacphi.harvest.v1",PANTRY_KEY="almanacphi.pantry.v1";
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
let sessions=[],selectedId="",planToLink="",storageError=false;
function message(text){$("cookingMessage").textContent=text;}
function readRecords(){
  let harvest=null,pantry=[];
  const rawHarvest=localStorage.getItem(HARVEST_KEY);
  if(rawHarvest!==null){
    harvest=JSON.parse(rawHarvest);
    if(!harvest||!checkLedger(harvest.lots,harvest.allocations))throw new Error("Harvest ledger failed validation.");
  }
  const rawPantry=localStorage.getItem(PANTRY_KEY);
  if(rawPantry!==null){
    pantry=JSON.parse(rawPantry);
    if(!Array.isArray(pantry)||pantry.some(x=>!validPantryEntry(x)))throw new Error("Pantry ledger failed validation.");
  }
  return {harvest,pantry};
}
function loadSessions(){
  try{
    const raw=localStorage.getItem(COOKING_KEY);
    const parsed=raw===null?[]:JSON.parse(raw);
    if(!validCookingSessions(parsed))throw new Error("Invalid session data");
    sessions=parsed;
  }catch(e){
    storageError=true;
    message("Cooking session records need review. Existing browser data was not overwritten. Export a backup before making changes.");
    console.warn("Cooking sessions unavailable",e);
  }
}
function saveSessions(next){
  if(storageError||!validCookingSessions(next))return false;
  try{localStorage.setItem(COOKING_KEY,JSON.stringify(next));sessions=next;return true;}
  catch(e){console.warn("Could not save cooking sessions",e);return false;}
}
function showSourceOptions(){
  const session=sessions.find(s=>s.id===selectedId);
  const select=$("cookingSource");
  if(!session){select.innerHTML="";return;}
  try{
    const {harvest,pantry}=readRecords();
    const sources=eligibleCookingSources(RECIPE_BY_ID[session.recipeId],harvest,pantry);
    const chosen=select.value;
    select.innerHTML=sources.map(s=>{
      const crop=CROP_BY_ID[s.crop];
      const suffix=s.kind==="harvest"?s.remaining.toFixed(2)+" "+s.unit:s.remaining+" container(s)";
      return '<option value="'+esc(s.kind+":"+s.id)+'">'+esc(crop.name)+" · "+esc(s.kind)+" · "+esc(suffix)+" available · "+esc(s.detail)+'</option>';
    }).join("");
    if(sources.some(s=>s.kind+":"+s.id===chosen))select.value=chosen;
    $("cookingSourceHelp").textContent=sources.length?
      "Enter the exact quantity used from the selected source. For pantry batches, count whole containers only; no recipe-to-jar conversion is assumed.":
      "No matching, counted pantry containers or available harvest lots. Record inventory in Harvest or Preserve first.";
    $("cookingUseSubmit").disabled=!sources.length||storageError;
    const source=sources.find(s=>s.kind+":"+s.id===select.value);
    $("cookingAmount").step=source?.unit==="containers"||source?.unit==="each"?"1":"any";
    $("cookingAmount").min=source?.unit==="containers"||source?.unit==="each"?"1":"0.001";
    $("cookingAmount").max=source?String(source.remaining):"";
    $("cookingAmountLabel").textContent=source?"Amount used ("+source.unit+")":"Amount used";
  }catch(e){
    select.innerHTML="";$("cookingUseSubmit").disabled=true;
    $("cookingSourceHelp").textContent="Stored pantry or harvest data needs review. Nothing has been changed.";
    console.warn("Cooking sources unavailable",e);
  }
}
function render(){
  $("cookingSessionCount").textContent=String(sessions.length);
  $("cookingSessionList").innerHTML=sessions.length?
    [...sessions].sort((a,b)=>b.date.localeCompare(a.date)).map(s=>{
      const r=RECIPE_BY_ID[s.recipeId];
      return '<button type="button" class="cooking-session-card'+(s.id===selectedId?" active":"")+'" data-session-open="'+esc(s.id)+'">'+
        '<strong>'+esc(r.title)+'</strong><span>'+esc(s.date)+' · '+s.servings+' servings · '+(s.done?"Finished":"Open")+'</span></button>';
    }).join(""):'<p class="subtle">No cooking sessions yet. Start one from a recipe or planned meal.</p>';
  const session=sessions.find(s=>s.id===selectedId);
  $("cookingWorking").hidden=!session;
  if(!session)return;
  $("cookingActiveTitle").textContent=RECIPE_BY_ID[session.recipeId].title+" · "+session.date;
  $("cookingFinish").textContent=session.done?"Reopen session":"Mark session finished";
  $("cookingUseForm").hidden=session.done;
  $("cookingSourceHelp").textContent="";
  try{
    const {harvest,pantry}=readRecords();
    const activity=cookingActivity(session,harvest,pantry);
    const totals=cookingTotals(session,harvest,pantry);
    $("cookingTotals").textContent=totals.actions+" recorded ingredient actions across "+totals.crops+" crops. Recorded quantities are source-specific and never added together across different units.";
    $("cookingActivity").innerHTML=activity.length?
      activity.map(a=>'<article class="cooking-activity-row"><div><b>'+esc(CROP_BY_ID[a.crop].name)+'</b> · '+esc(a.kind)+
        '<p>'+a.amount+' '+esc(a.unit)+' · '+esc(a.date)+(a.note?" · "+esc(a.note):"")+'</p></div></article>').join(""):
      '<p class="subtle">No ingredient use recorded. Cooking or finishing a session never spends inventory on its own.</p>';
  }catch(e){
    $("cookingTotals").textContent="Source ledger validation failed. No quantities were modified.";
    $("cookingActivity").innerHTML='<p class="subtle">Inspect Harvest and Pantry records before continuing.</p>';
  }
  showSourceOptions();
}
function saveUse(session,kind,sourceId,amount,note){
  // Each action changes ONE authoritative localStorage key. No mirrored balance
  // or separate session activity record is written. Failures leave all
  // previously saved session and ingredient records untouched.
  const {harvest,pantry}=readRecords(),date=session.date, id=crypto.randomUUID();
  if(kind==="harvest"){
    if(!harvest)throw new Error("No harvest ledger");
    const lot=harvest.lots.find(x=>x.id===sourceId);
    if(!lot||!RECIPE_BY_ID[session.recipeId].crops.includes(lot.crop)||
      !canAllocate(lot,harvest.allocations,amount,lot.unit))throw new Error("Harvest amount is unavailable.");
    const use={id,lotId:lot.id,date,amount,unit:lot.unit,purpose:"cooked",note,sessionId:session.id};
    if(!validAllocation(use))throw new Error("Invalid harvest use");
    const allocations=[...harvest.allocations,use];
    if(!checkLedger(harvest.lots,allocations))throw new Error("Harvest would exceed the recorded balance.");
    localStorage.setItem(HARVEST_KEY,JSON.stringify({...harvest,allocations}));
    return "harvest";
  }
  if(!["pantry-standalone","pantry-linked"].includes(kind)||!Number.isSafeInteger(amount)||amount<1)
    throw new Error("Enter a positive whole container count.");
  const usage={id,date,count:amount,reason:"used",note,sessionId:session.id};
  if(kind==="pantry-standalone"){
    const index=pantry.findIndex(x=>x.id===sourceId);
    const batch=pantry[index];
    if(!batch||!RECIPE_BY_ID[session.recipeId].crops.includes(batch.crop)||!validPantryStock(batch.stock))
      throw new Error("Counted pantry batch unavailable.");
    const stock=addPantryUse(batch.stock,usage),next=pantry.map((x,i)=>i===index?{...x,stock}:x);
    if(next.some(x=>!validPantryEntry(x)))throw new Error("Pantry integrity check failed.");
    localStorage.setItem(PANTRY_KEY,JSON.stringify(next));
    return "pantry";
  }
  if(!harvest)throw new Error("Linked harvest ledger unavailable.");
  const index=harvest.allocations.findIndex(x=>x.id===sourceId);
  const allocation=harvest.allocations[index],lot=harvest.lots.find(l=>l.id===allocation?.lotId);
  if(!allocation?.pantry||!lot||!RECIPE_BY_ID[session.recipeId].crops.includes(lot.crop)||
    !validPantryStock(allocation.pantry.stock))throw new Error("Linked counted pantry batch unavailable.");
  const stock=addPantryUse(allocation.pantry.stock,usage);
  const allocations=harvest.allocations.map((a,i)=>i===index?{...a,pantry:{...a.pantry,stock}}:a);
  if(!checkLedger(harvest.lots,allocations))throw new Error("Linked pantry integrity check failed.");
  localStorage.setItem(HARVEST_KEY,JSON.stringify({...harvest,allocations}));
  return "harvest";
}
function selectSession(id){
  if(!sessions.some(s=>s.id===id))return;
  selectedId=id;render();
  $("cookingWorking").scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
}
export function startCookingFromRecipe({recipeId,servings=4,date=today(),planId=""}={}){
  if(!Object.hasOwn(RECIPE_BY_ID,recipeId))return;
  $("cookingRecipe").value=recipeId;
  $("cookingServings").value=String(SERVINGS_OPTIONS.includes(servings)?servings:4);
  $("cookingDate").value=date;
  planToLink=typeof planId==="string"?planId:"";
  $("cooking").scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  $("cookingNote").focus({preventScroll:true});
}
export function initCooking(){
  $("cookingRecipe").innerHTML=RECIPES.map(r=>'<option value="'+r.id+'">'+esc(r.title)+'</option>').join("");
  $("cookingServings").innerHTML=SERVINGS_OPTIONS.map(n=>'<option value="'+n+'">'+n+' servings</option>').join("");
  $("cookingServings").value="4";$("cookingDate").value=today();
  loadSessions();
  if(storageError){$("cookingForm").querySelectorAll("input,select,textarea,button").forEach(el=>el.disabled=true);}
  $("cookingForm").addEventListener("submit",event=>{
    event.preventDefault();if(storageError)return;
    if(sessions.length>=MAX_SESSIONS){message("Session limit reached. Export your cooking history before proceeding.");return;}
    const s={id:crypto.randomUUID(),recipeId:$("cookingRecipe").value,
      servings:Number($("cookingServings").value),date:$("cookingDate").value,
      note:$("cookingNote").value.trim().slice(0,300),done:false,planId:planToLink};
    if(!validCookingSession(s)){message("Choose a valid recipe, date and serving count.");return;}
    if(!saveSessions([...sessions,s])){message("Could not save the new cooking session. No inventory was modified.");return;}
    selectedId=s.id;planToLink="";
    $("cookingNote").value="";message("Cooking session started. Select exact ingredients to record usage; none have been deducted.");
    render();
  });
  $("cookingSessionList").addEventListener("click",e=>{
    const btn=e.target.closest("[data-session-open]");if(btn)selectSession(btn.dataset.sessionOpen);
  });
  $("cookingSource").addEventListener("change",showSourceOptions);
  $("cookingUseForm").addEventListener("submit",event=>{
    event.preventDefault();if(storageError)return;
    const session=sessions.find(s=>s.id===selectedId);
    if(!session||session.done){message("Select an open cooking session.");return;}
    const [kind,...rest]=$("cookingSource").value.split(":"),sourceId=rest.join(":");
    const amountText=$("cookingAmount").value.trim(),amount=Number(amountText),note=$("cookingUseNote").value.trim().slice(0,200);
    if(!sourceId||!amountText||!Number.isFinite(amount)||amount<=0){message("Select an available source and a positive quantity.");return;}
    try{
      const updated=saveUse(session,kind,sourceId,amount,note);
      window.dispatchEvent(new CustomEvent("almanacphi:cooking-source-updated"));
      window.dispatchEvent(new CustomEvent(updated==="harvest"?"almanacphi:harvest-updated":"almanacphi:pantry-updated"));
      $("cookingAmount").value="";$("cookingUseNote").value="";
      message("Ingredient use saved in its original ledger. Review the recorded entry below.");
      render();
    }catch(error){console.warn("Cooking allocation rejected",error);message("Nothing deducted: "+error.message);}
  });
  $("cookingFinish").addEventListener("click",()=>{
    const session=sessions.find(s=>s.id===selectedId);if(!session||storageError)return;
    const next=sessions.map(s=>s.id===selectedId?{...s,done:!s.done}:s);
    if(!saveSessions(next)){message("Status could not be saved. No inventory was modified.");return;}
    message("Session status updated. Marking a meal finished never deducts inventory.");
    render();
  });
  $("cookingExport").addEventListener("click",()=>{
    let harvested=null,pantry=[];
    try{({harvest:harvested,pantry}=readRecords());}catch(e){message("Source records could not be validated; export their original ledgers separately.");return;}
    const payload={app:"AlmanacPhi",kind:"cooking-sessions",version:1,exportedAt:new Date().toISOString(),
      sessions:sessions.map(s=>({...s,activity:cookingActivity(s,harvested,pantry)})),
      note:"Activity is a read-only snapshot. Original Harvest and Pantry ledgers remain the authoritative records."};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="almanacphi-cooking-"+today()+".json";document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  window.addEventListener("almanacphi:cooking-start",e=>startCookingFromRecipe(e.detail));
  window.addEventListener("almanacphi:harvest-updated",()=>{if(selectedId)render();});
  window.addEventListener("almanacphi:pantry-updated",()=>{if(selectedId)render();});
  window.addEventListener("storage",e=>{
    if(e.key===COOKING_KEY){loadSessions();render();}
    else if([HARVEST_KEY,PANTRY_KEY].includes(e.key)&&selectedId)render();
  });
  render();
}
