import {CROPS,CROP_BY_ID} from "./crop-data.js";
import {HARVEST_UNITS,HARVEST_USES,validHarvest,validAllocation,checkLedger,canAllocate,remainingBase,fromBase,formatHarvestAmount,cropAvailability} from "./harvest-data.js";
import {showHarvestKitchen} from "./kitchen-ui.js";

const $=id=>document.getElementById(id);
const KEY="almanacphi.harvest.v1";
const MAX_LOTS=500,MAX_ALLOCATIONS=2000;
const escapeHtml=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
let lots=[],allocations=[],plantings=[];
let storageError=false;
function status(message){$("harvestStatus").textContent=message;}
function load(){
  try{
    const stored=JSON.parse(localStorage.getItem(KEY)||"null");
    if(stored===null)return;
    if(!stored||!checkLedger(stored.lots,stored.allocations)||
      stored.lots.length>MAX_LOTS||stored.allocations.length>MAX_ALLOCATIONS){
      storageError=true;status("Saved harvest data could not be validated. Export the raw data before making changes; existing browser data is unchanged.");disableForms();return;
    }
    lots=stored.lots;allocations=stored.allocations;
  }catch(e){
    storageError=true;status("Harvest data could not be read. Export the raw data before making changes; existing browser data is unchanged.");
    disableForms();console.warn("Harvest records unavailable",e);
  }
}
function disableForms(){
  for(const id of ["harvestForm","harvestUseForm"])$(id).querySelectorAll("input,select,textarea,button").forEach(el=>el.disabled=true);
}
function save(){
  if(storageError||!checkLedger(lots,allocations))return false;
  let saved=true;
  try{localStorage.setItem(KEY,JSON.stringify({version:1,lots,allocations}));}
  catch(e){console.warn("Unable to save harvest records",e);saved=false;}
  window.dispatchEvent(new CustomEvent("almanacphi:harvest-updated"));
  return saved;
}
function cropOptions(){
  $("harvestCrop").innerHTML=CROPS.map(c=>'<option value="'+c.id+'">'+escapeHtml(c.name)+'</option>').join("");
  $("harvestUnit").innerHTML=Object.entries(HARVEST_UNITS).map(([key,unit])=>'<option value="'+key+'">'+escapeHtml(unit.label)+' ('+key+')</option>').join("");
  $("harvestUnit").value="lb";
  $("harvestUsePurpose").innerHTML=Object.entries(HARVEST_USES).map(([key,value])=>'<option value="'+key+'">'+escapeHtml(value)+'</option>').join("");
}
function plantOptions(){
  const selected=$("harvestSourcePlant").value;
  const crop=$("harvestCrop").value,matching=plantings.filter(p=>p.crop===crop);
  $("harvestSourcePlant").innerHTML='<option value="">Unlinked / independent harvest</option>'+
    matching.map(p=>'<option value="'+escapeHtml(p.id)+'">'+escapeHtml(p.date)+(p.bed?' · '+escapeHtml(p.bed):'')+'</option>').join("");
  if(matching.some(p=>p.id===selected))$("harvestSourcePlant").value=selected;
}
export function setHarvestPlantings(entries){
  plantings=Array.isArray(entries)?entries.filter(p=>p&&CROP_BY_ID[p.crop]&&typeof p.id==="string"&&typeof p.date==="string"):[];
  plantOptions();
}
export function showPlantHarvest(plant){
  if(!plant||!CROP_BY_ID[plant.crop])return;
  $("harvestCrop").value=plant.crop;
  plantOptions();
  $("harvestSourcePlant").value=plant.id;
  $("harvestBed").value=plant.bed||"";
  $("harvest").scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  $("harvestAmount").focus({preventScroll:true});
}
function renderLotSelect(){
  const selected=$("harvestUseLot").value;
  const remaining=lots.filter(lot=>remainingBase(lot,allocations)>0.00001);
  $("harvestUseLot").innerHTML=remaining.map(lot=>
    '<option value="'+escapeHtml(lot.id)+'">'+escapeHtml(CROP_BY_ID[lot.crop].name)+' · '+
    escapeHtml(lot.date)+' · '+escapeHtml(formatHarvestAmount(fromBase(remainingBase(lot,allocations),lot.unit),lot.unit))+' available</option>').join("");
  if(remaining.some(lot=>lot.id===selected))$("harvestUseLot").value=selected;
  $("harvestUseSave").disabled=!remaining.length||storageError;
  updateUsePreview();
}
function updateUsePreview(){
  const lot=lots.find(x=>x.id===$("harvestUseLot").value);
  const avail=lot?fromBase(remainingBase(lot,allocations),lot.unit):0;
  $("harvestUseUnit").textContent=lot?'Unit: '+lot.unit+' · '+formatHarvestAmount(avail,lot.unit)+' remaining':"Record a harvest lot first";
  $("harvestUseAmount").step=lot?.unit==="each"?"1":"any";
  $("harvestUseAmount").min=lot?.unit==="each"?"1":"0.001";
  $("harvestUseAmount").max=lot?String(avail):"";
}
function renderStock(){
  const rows=cropAvailability(lots,allocations);
  $("harvestStockCount").textContent=String(new Set(rows.map(x=>x.crop)).size);
  if(!rows.length){$("harvestStock").innerHTML='<div class="empty-state">Nothing available yet. Record a harvest to build your homegrown inventory.</div>';return;}
  const groups=new Map();
  for(const row of rows){
    if(!groups.has(row.crop))groups.set(row.crop,[]);
    const amount=row.kind==="mass"?
      formatHarvestAmount(row.amount/453.59237,"lb")+" (approximate weight)":
      formatHarvestAmount(row.amount,"each");
    groups.get(row.crop).push(amount);
  }
  $("harvestStock").innerHTML=[...groups].map(([crop,values])=>
    '<div class="harvest-stock-item"><span>'+CROP_BY_ID[crop].emoji+' '+escapeHtml(CROP_BY_ID[crop].name)+'</span><b>'+values.join(" · ")+'</b></div>'
  ).join("");
}
function renderLots(){
  $("harvestLotCount").textContent=String(lots.length);
  $("harvestLots").innerHTML=lots.length?
    [...lots].sort((a,b)=>b.date.localeCompare(a.date)).map(lot=>{
      const remaining=fromBase(remainingBase(lot,allocations),lot.unit);
      const allocationsForLot=allocations.filter(x=>x.lotId===lot.id);
      return '<article class="harvest-lot"><div><h4>'+CROP_BY_ID[lot.crop].emoji+' '+escapeHtml(CROP_BY_ID[lot.crop].name)+'</h4>'+
        '<p><b>Picked:</b> '+escapeHtml(lot.date)+' · '+escapeHtml(formatHarvestAmount(lot.amount,lot.unit))+(lot.bed?' · '+escapeHtml(lot.bed):'')+'</p>'+
        '<p><b>Available:</b> '+escapeHtml(formatHarvestAmount(remaining,lot.unit))+' · '+allocationsForLot.length+' allocations</p>'+
        (lot.note?'<p>'+escapeHtml(lot.note)+'</p>':'')+
        '</div><div class="harvest-lot-actions"><button type="button" data-harvest-allocate="'+escapeHtml(lot.id)+'" '+(remaining<=0?'disabled':'')+'>Use some</button>'+
        '<button type="button" data-harvest-delete="'+escapeHtml(lot.id)+'" '+(allocationsForLot.length?'disabled title="Remove allocations before deleting the lot"':'')+'>Delete</button></div></article>';
    }).join(""):'<div class="empty-state">Your first harvested crop will appear here.</div>';
}
function renderAllocations(){
  $("harvestAllocationCount").textContent=String(allocations.length);
  $("harvestAllocations").innerHTML=allocations.length?
    [...allocations].sort((a,b)=>b.date.localeCompare(a.date)).map(a=>{
      const lot=lots.find(x=>x.id===a.lotId);
      return '<article class="harvest-activity"><div><b>'+escapeHtml(HARVEST_USES[a.purpose])+'</b> · '+
        escapeHtml(CROP_BY_ID[lot.crop].name)+' · '+escapeHtml(formatHarvestAmount(a.amount,a.unit))+
        '<p>'+escapeHtml(a.date)+(a.note?' · '+escapeHtml(a.note):'')+'</p></div>'+
        '<button type="button" data-harvest-undo="'+escapeHtml(a.id)+'" aria-label="Undo allocation">Undo</button></article>';
    }).join(""):'<p class="subtle">No allocations recorded. Available quantities only change when you explicitly log a use.</p>';
}
function renderAll(){renderStock();renderLots();renderAllocations();renderLotSelect();}
function download(name,body){
  const blob=new Blob([body],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportLedger(){
  download("almanacphi-harvest-"+today()+".json",
    JSON.stringify({app:"AlmanacPhi",kind:"harvest-ledger",version:1,exportedAt:new Date().toISOString(),lots,allocations},null,2));
}
export function initHarvest(){
  cropOptions();plantOptions();
  $("harvestDate").value=today();$("harvestUseDate").value=today();
  load();
  $("harvestCrop").addEventListener("change",()=>{plantOptions();const p=plantings.find(x=>x.id===$("harvestSourcePlant").value);if(p)$("harvestBed").value=p.bed||"";});
  $("harvestSourcePlant").addEventListener("change",()=>{const p=plantings.find(x=>x.id===$("harvestSourcePlant").value);if(p)$("harvestBed").value=p.bed||"";});
  $("harvestUseLot").addEventListener("change",updateUsePreview);
  $("harvestForm").addEventListener("submit",e=>{
    e.preventDefault();if(storageError)return;
    if(lots.length>=MAX_LOTS){status("Harvest limit reached. Export data and remove unused lots first.");return;}
    const amount=Number($("harvestAmount").value),unit=$("harvestUnit").value;
    const entry={id:crypto.randomUUID(),crop:$("harvestCrop").value,date:$("harvestDate").value,
      amount,unit,sourcePlantId:$("harvestSourcePlant").value,
      bed:$("harvestBed").value.trim().slice(0,100),note:$("harvestNote").value.trim().slice(0,400)};
    if(!validHarvest(entry)){status("Choose a valid crop, date, and positive quantity. Each counts must be whole numbers.");return;}
    lots.push(entry);
    status(save()?"Harvest recorded on this device.":"Harvest added for this session; browser storage is unavailable.");
    $("harvestAmount").value="";$("harvestNote").value="";renderAll();
  });
  $("harvestUseForm").addEventListener("submit",e=>{
    e.preventDefault();if(storageError)return;
    if(allocations.length>=MAX_ALLOCATIONS){status("Allocation limit reached. Export records before making changes.");return;}
    const lot=lots.find(x=>x.id===$("harvestUseLot").value),amount=Number($("harvestUseAmount").value);
    if(!lot||!canAllocate(lot,allocations,amount,lot.unit)){
      status("Quantity is invalid or exceeds what remains in the harvest lot. Each counts must be whole numbers.");return;
    }
    const entry={id:crypto.randomUUID(),lotId:lot.id,amount,unit:lot.unit,date:$("harvestUseDate").value,
      purpose:$("harvestUsePurpose").value,note:$("harvestUseNote").value.trim().slice(0,400)};
    if(!validAllocation(entry)||!checkLedger(lots,[...allocations,entry])){status("Allocation could not be validated.");return;}
    allocations.push(entry);
    status(save()?"Use recorded. Available harvest updated.":"Allocation added for this session; browser storage is unavailable.");
    $("harvestUseAmount").value="";$("harvestUseNote").value="";renderAll();
  });
  $("harvestLots").addEventListener("click",e=>{
    const allocationButton=e.target.closest("[data-harvest-allocate]");
    if(allocationButton){$("harvestUseLot").value=allocationButton.dataset.harvestAllocate;updateUsePreview();$("harvestUseAmount").focus();return;}
    const deleteButton=e.target.closest("[data-harvest-delete]");if(!deleteButton||storageError)return;
    const id=deleteButton.dataset.harvestDelete;
    if(allocations.some(x=>x.lotId===id)){status("Undo allocations before deleting this lot.");return;}
    if(!window.confirm("Remove this harvest lot?"))return;
    lots=lots.filter(x=>x.id!==id);save();renderAll();status("Harvest lot removed.");
  });
  $("harvestAllocations").addEventListener("click",e=>{
    const button=e.target.closest("[data-harvest-undo]");if(!button||storageError)return;
    if(!window.confirm("Undo this harvest use and restore its quantity?"))return;
    allocations=allocations.filter(x=>x.id!==button.dataset.harvestUndo);
    save();renderAll();status("Allocation undone; quantity returned to its lot.");
  });
  $("harvestExport").addEventListener("click",exportLedger);
  $("harvestRawBackup").addEventListener("click",()=>{
    let raw="";try{raw=localStorage.getItem(KEY)||"";}catch(e){status("Raw browser storage is unavailable.");return;}
    if(!raw){status("No saved raw harvest data found.");return;}
    download("almanacphi-harvest-raw-"+today()+".json",raw);
  });
  $("harvestCookSuggestions").addEventListener("click",showHarvestKitchen);
  renderAll();
}
