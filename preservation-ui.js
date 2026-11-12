import {CROPS,CROP_BY_ID} from "./crop-data.js";
import {PRESERVATION_GUIDES,PRESERVATION_BY_ID,preservationForCrop,validPantryEntry} from "./preservation-data.js";
import {linkedPantryBatches} from "./harvest-data.js";
import {createPantryStock,validPantryStock} from "./pantry-stock.js";
import {renderBatchStockControls,installPantryStockEvents} from "./pantry-stock-ui.js";
const $=id=>document.getElementById(id);
const STORAGE="almanacphi.pantry.v1",LIMIT=500;
const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const localDate=()=>{const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`};
let pantry=[];
function showMessage(text){$("pantryMessage").textContent=text}
function trustedHttps(value){
  try{const u=new URL(value);return u.protocol==="https:"&&Boolean(u.hostname)&&!u.username&&!u.password?u.href:null}
  catch{return null}
}
function loadPantry(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE)||"[]");
    pantry=Array.isArray(saved)?saved.filter(validPantryEntry).filter(x=>realISODate(x.date)).slice(0,LIMIT):[];
  }catch(e){pantry=[];console.warn("Pantry storage is unavailable",e)}
}
function realISODate(text){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(text||""))return false;
  const [year,month,day]=text.split("-").map(Number);
  const d=new Date(Date.UTC(year,month-1,day));
  return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day;
}
function savePantry(){
  try{localStorage.setItem(STORAGE,JSON.stringify(pantry));window.dispatchEvent(new CustomEvent("almanacphi:pantry-updated"));return true}
  catch(e){console.warn("Could not save pantry records",e);return false}
}
function populateCrops(){
  const options=CROPS.map(c=>`<option value="${c.id}">${safe(c.name)}</option>`).join("");
  $("preserveCrop").innerHTML=options;$("pantryCrop").innerHTML=options;
}
function fillMethods(){
  const chosen=$("pantryCrop").value,info=preservationForCrop(chosen);
  const previous=$("pantryMethod").value;
  $("pantryMethod").innerHTML=(info?.guides||[]).map(g=>`<option value="${g.id}">${safe(g.name)}</option>`).join("");
  if(info?.methods.includes(previous))$("pantryMethod").value=previous;
  syncCanningField();
}
function syncCanningField(){
  const canning=["water-bath","pressure"].includes($("pantryMethod").value);
  $("pantryRecipe").required=canning;
  $("pantryRecipe").placeholder=canning?"https://nchfp.uga.edu/... (required)":"Optional source link";
}
function renderPaths(){
  const crop=CROP_BY_ID[$("preserveCrop").value],info=preservationForCrop(crop?.id);
  $("preserveCropNotes").textContent=info?`${crop.name}: ${info.note}`:"Choose a crop.";
  $("preserveCropPaths").innerHTML=info?info.guides.map(g=>`<button type="button" data-method="${g.id}" aria-label="Read ${safe(g.name)} guide">${safe(g.icon)} ${safe(g.name)} ↗</button>`).join(""):"";
}
function renderGuides(){
  $("preserveGuides").innerHTML=PRESERVATION_GUIDES.map(g=>`<button class="preserve-card" type="button" data-method="${g.id}" aria-label="Open ${safe(g.name)} guide">
    <span class="preserve-symbol" aria-hidden="true">${safe(g.icon)}</span><strong>${safe(g.name)}</strong>
    <span class="method-tag">${safe(g.tag)}</span><span class="method-summary">${safe(g.summary)}</span><span class="crop-link">OPEN FIELD GUIDE ↗</span></button>`).join("");
}
function openGuide(id){
  const g=PRESERVATION_BY_ID[id];if(!g)return;
  $("preserveDialogBody").innerHTML=`<div class="preserve-dialog-header"><span class="preserve-symbol" aria-hidden="true">${safe(g.icon)}</span><div><h2 id="preserveDialogTitle">${safe(g.name)}</h2><p>${safe(g.tag)}</p></div></div>
    <p>${safe(g.summary)}</p><div class="preserve-warning"><b>Safety boundary:</b> ${safe(g.alert)}</div>
    <h3>Practical steps</h3><ol class="preserve-steps">${g.steps.map(step=>`<li>${safe(step)}</li>`).join("")}</ol>
    <div class="detail-section"><h3>Authoritative guidance & exact recipes</h3><ul class="preserve-source-links">${g.sources.map(link=>`<li><a href="${safe(link.url)}" target="_blank" rel="noopener noreferrer">${safe(link.label)} ↗</a></li>`).join("")}</ul>
    <p>No canning processing times or pressures are supplied here. Always follow the full official process for your specific food, recipe, jar, equipment, and elevation.</p></div>`;
  $("preserveDialog").showModal();
}
function readLinkedPantry(){
  try{
    const saved=JSON.parse(localStorage.getItem("almanacphi.harvest.v1")||"null");
    return saved?linkedPantryBatches(saved.lots,saved.allocations):[];
  }catch(e){console.warn("Linked harvest data unavailable",e);return [];}
}
function writeStandaloneStock(id,nextStock){
  if(!validPantryStock(nextStock))return {ok:false,message:"Invalid container count or removal history."};
  const index=pantry.findIndex(x=>x.id===id);
  if(index<0)return {ok:false,message:"Standalone batch not found."};
  const next=pantry.map((x,i)=>i===index?{...x,stock:nextStock}:x);
  if(next.some(x=>!validPantryEntry(x)))return {ok:false,message:"Updated pantry records did not pass validation."};
  try{
    localStorage.setItem(STORAGE,JSON.stringify(next));
    pantry=next;
    window.dispatchEvent(new CustomEvent("almanacphi:pantry-updated"));
    return {ok:true};
  }catch(e){console.warn("Pantry stock update could not be persisted",e);return {ok:false,message:"Browser storage could not save this change. The previous count was preserved."};}
}
function currentPantryRecords(){
  return [...pantry.map(x=>({...x,origin:"standalone"})),
    ...readLinkedPantry().map(x=>({...x,origin:"linked"}))];
}
function renderPantry(){
  const entries=currentPantryRecords();
  $("pantryCount").textContent=String(entries.length);
  if(!entries.length){$("pantryList").innerHTML=`<div class="empty-state">No preserved batches logged yet. The pantry awaits its first harvest.</div>`;return}
  $("pantryList").innerHTML=entries.sort((a,b)=>b.date.localeCompare(a.date)).map(x=>{
    const c=CROP_BY_ID[x.crop],method=PRESERVATION_BY_ID[x.method];
    const url=trustedHttps(x.recipe);
    return `<article class="pantry-entry ${x.origin==="linked"?"linked-pantry-entry":""}" data-pantry-origin="${safe(x.origin)}" data-pantry-id="${safe(x.id)}" tabindex="-1"><div><h5>${safe(c.emoji)} ${safe(c.name)} · ${safe(x.quantity)}</h5>
      <p><b>${safe(method.name)}</b> · ${safe(x.date)} · ${safe(x.location)}</p>${x.origin==="linked"?`<p class="pantry-link-tag">Linked from harvest · ${safe(x.harvestAmount)} ${safe(x.harvestUnit)} transferred</p>`:`<p class="pantry-link-tag">Standalone batch · no harvest deduction</p>`}${x.note?`<p>${safe(x.note)}</p>`:""}
      ${url?`<a href="${safe(url)}" target="_blank" rel="noopener noreferrer">Recorded recipe source ↗</a>`:""}
      ${renderBatchStockControls(x)}</div>
      ${x.origin==="linked"?`<a class="pantry-harvest-link" href="#harvest">Manage in Harvest ↗</a>`:`<button type="button" class="link-button danger" data-pantry-delete="${safe(x.id)}" aria-label="Remove ${safe(c.name)} batch">Remove</button>`}</article>`;
  }).join("");
}
export function showCropPreservation(cropId){
  if(!CROP_BY_ID[cropId])return;
  $("preserveCrop").value=cropId;
  $("pantryCrop").value=cropId;
  fillMethods();renderPaths();
  $("cropDialog")?.close();
  $("preserve").scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
}
export function initPreservation(){
  populateCrops();$("pantryDate").value=localDate();fillMethods();renderGuides();loadPantry();renderPaths();renderPantry();
  $("preserveCrop").addEventListener("change",renderPaths);
  $("pantryCrop").addEventListener("change",fillMethods);
  $("pantryMethod").addEventListener("change",syncCanningField);
  window.addEventListener("almanacphi:harvest-updated",renderPantry);
  window.addEventListener("storage",e=>{
    if(e.key===STORAGE){loadPantry();renderPantry();window.dispatchEvent(new CustomEvent("almanacphi:pantry-updated"));}
    else if(e.key==="almanacphi.harvest.v1")renderPantry();
  });
  window.addEventListener("almanacphi:pantry-focus",e=>{
    const origin=e.detail?.origin,id=e.detail?.id;
    if(!["linked","standalone"].includes(origin)||typeof id!=="string")return;
    renderPantry();
    const target=[...$("pantryList").querySelectorAll(".pantry-entry[data-pantry-id]")].find(
      el=>el.dataset.pantryId===id&&el.dataset.pantryOrigin===origin);
    if(!target){$("pantryStockMessage").textContent="That pantry batch is no longer recorded. Refresh its recipe suggestions.";return;}
    $("pantryList").querySelectorAll(".pantry-focused").forEach(el=>el.classList.remove("pantry-focused"));
    target.classList.add("pantry-focused");
    target.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});
    target.focus({preventScroll:true});
    $("pantryStockMessage").textContent="Review the highlighted pantry batch. Nothing has been deducted automatically.";
  });
  for(const id of ["preserveGuides","preserveCropPaths"]){
    $(id).addEventListener("click",e=>{const target=e.target.closest("button[data-method]");if(target)openGuide(target.dataset.method)});
  }
  $("preserveDialogClose").addEventListener("click",()=>$("preserveDialog").close());
  $("preserveDialog").addEventListener("click",e=>{if(e.target===$("preserveDialog"))$("preserveDialog").close()});
  $("pantryForm").addEventListener("submit",e=>{
    e.preventDefault();
    if(pantry.length>=LIMIT){showMessage("Pantry limit reached. Export a backup and remove entries before adding more.");return}
    const crop=$("pantryCrop").value,method=$("pantryMethod").value,date=$("pantryDate").value,recipe=$("pantryRecipe").value.trim();
    if(!realISODate(date)){showMessage("Use a valid preparation date.");return}
    if(recipe&&!trustedHttps(recipe)){showMessage("Use a valid HTTPS recipe URL or leave the optional field blank.");return}
    if(["water-bath","pressure"].includes(method)&&!trustedHttps(recipe)){
      showMessage("Canning batches require an HTTPS link to your tested recipe. A link is not proof of safety.");return;
    }
    let stock;
    const countText=$("pantryOpeningCount").value.trim();
    if(countText){
      try{stock=createPantryStock(Number(countText));}
      catch(e){showMessage("Container count must be a positive whole number up to 100,000.");return;}
    }
    const item={id:crypto.randomUUID(),crop,method,date,quantity:$("pantryQuantity").value.trim().slice(0,80),location:$("pantryLocation").value.trim().slice(0,100),note:$("pantryNote").value.trim().slice(0,500),recipe:recipe.slice(0,500),...(stock?{stock}:{})};
    if(!item.quantity||!item.location||!validPantryEntry(item)){showMessage("Choose a crop/method and fill in the batch details.");return}
    pantry.push(item);
    showMessage(savePantry()?"Batch recorded on this device. Recording never certifies a canning process.":"Batch added for this session; browser storage could not save it.");
    $("pantryQuantity").value="";$("pantryOpeningCount").value="";$("pantryNote").value="";$("pantryRecipe").value="";renderPantry();
  });
  $("pantryList").addEventListener("click",e=>{
    const button=e.target.closest("[data-pantry-delete]");if(!button)return;
    if(!window.confirm("Remove this entry from the pantry log?"))return;
    pantry=pantry.filter(x=>x.id!==button.dataset.pantryDelete);
    savePantry();renderPantry();
  });
  installPantryStockEvents($("pantryList"),{getRecords:currentPantryRecords,updateStandalone:writeStandaloneStock,refresh:renderPantry,notify:text=>$("pantryStockMessage").textContent=text});
  $("pantryExport").addEventListener("click",()=>{
    const payload={app:"AlmanacPhi",kind:"preservation-pantry",version:2,exportedAt:new Date().toISOString(),pantry,linkedPantry:readLinkedPantry()};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=`almanacphi-pantry-${localDate()}.json`;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
}
