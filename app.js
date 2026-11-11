import {CROPS,CROP_BY_ID} from "./crop-data.js";
import {initPreservation,showCropPreservation} from "./preservation-ui.js";
import {DEFAULT_SETTINGS,PRESETS,parseISO,iso,addDays,formatted,datesValid,cropWindows,monthEvents,daylightHours,daylightDisplay,moonPhase,monthShift,seasonFor,seasonTip,lunarTradition,moonIlluminatedPath} from "./engine.js";
const $=id=>document.getElementById(id);
const STORAGE_SETTINGS="almanacphi.settings.v1",STORAGE_GARDEN="almanacphi.garden.v1";
const seasonMonths=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function localToday(){
  const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
const today=parseISO(localToday());
let settings={...DEFAULT_SETTINGS};
let garden=[];
let chosenYear=today.getUTCFullYear(), chosenMonth=today.getUTCMonth();
let storageAvailable=true;
function load(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_SETTINGS)||"null");
    if(saved&&datesValid(saved))settings={name:String(saved.name||"My garden").slice(0,60),lastFrost:saved.lastFrost,firstFrost:saved.firstFrost,latitude:Number(saved.latitude)};
    const log=JSON.parse(localStorage.getItem(STORAGE_GARDEN)||"[]");
    if(Array.isArray(log)) garden=log.filter(x=>x&&CROP_BY_ID[x.crop]&&parseISO(x.date)&&typeof x.id==="string").slice(0,500).map(x=>({id:x.id,crop:x.crop,date:x.date,bed:String(x.bed||"").slice(0,70),note:String(x.note||"").slice(0,500),done:Boolean(x.done)}));
  }catch(e){storageAvailable=false;console.warn("Local storage unavailable:",e);}
}
function saveSettings(){try{localStorage.setItem(STORAGE_SETTINGS,JSON.stringify(settings));return true}catch(e){storageAvailable=false;return false}}
function saveGarden(){try{localStorage.setItem(STORAGE_GARDEN,JSON.stringify(garden));return true}catch(e){storageAvailable=false;return false}}
function safe(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function windowText(start,end){
  const sameYear=start.getUTCFullYear()===end.getUTCFullYear();
  return `${formatted(start)} – ${formatted(end)}${sameYear?"":` ${end.getUTCFullYear()}`}`;
}
function moonSVG(phase){
  const path=moonIlluminatedPath(phase);
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><circle cx="50" cy="50" r="47" fill="#1c3027"/><path d="${path}" fill="#f5edc8"/><circle cx="50" cy="50" r="47" fill="none" stroke="#a7a18b" stroke-width="1"/></svg>`;
}
function renderSky(){
  const moon=moonPhase(today),light=daylightHours(settings.latitude,today),season=seasonFor(today);
  $("dateLabel").textContent=formatted(today,{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  $("moonName").textContent=moon.name;
  $("moonDetail").textContent=`${Math.round(moon.illumination*100)}% lit · day ${moon.age.toFixed(1)} of ~29.5`;
  $("moonVisual").innerHTML=moonSVG(moon.phase);
  $("daylightValue").textContent=daylightDisplay(light);
  $("daylightBar").style.width=`${100*light/24}%`;
  $("daylightNote").textContent=`Approximate day length at ${settings.latitude.toFixed(1)}° N; actual sun exposure depends on shade and terrain.`;
  $("seasonValue").textContent=season;
  $("seasonAdvice").textContent=seasonTip(season);
  $("traditionNote").textContent=lunarTradition(moon.phase);
}
function setFormValues(){
  $("gardenName").value=settings.name;
  $("lastFrost").value=settings.lastFrost;
  $("firstFrost").value=settings.firstFrost;
  $("latitude").value=String(settings.latitude);
  $("preset").value="custom";
}
function renderCalendar(){
  $("monthPicker").value=`${chosenYear}-${String(chosenMonth+1).padStart(2,"0")}`;
  $("calendarTitle").textContent=`${seasonMonths[chosenMonth]} ${chosenYear} · What to plant`;
  $("calendarSubtitle").textContent=`From ${settings.name}'s editable frost dates`;
  $("seasonStrip").replaceChildren();
  seasonMonths.forEach((m,i)=>{
    const button=document.createElement("button");
    button.type="button";button.textContent=m;button.className=chosenMonth===i?"active":"";
    button.setAttribute("aria-pressed",String(chosenMonth===i));
    button.setAttribute("aria-label",`${m} ${chosenYear}`);
    button.addEventListener("click",()=>{chosenMonth=i;renderCalendar()});
    $("seasonStrip").append(button);
  });
  const items=monthEvents(CROPS,chosenYear,chosenMonth,settings);
  $("calendarResults").innerHTML=items.length?items.map(item=>`<div class="calendar-row">
    <div class="crop-emoji" aria-hidden="true">${item.crop.emoji}</div>
    <div><h4>${safe(item.crop.name)} <span class="pill ${item.kind}">${item.kind==="indoor"?"INDOORS":item.kind==="direct"?"SOW":"SET OUT"}</span></h4><p>${safe(item.action)}</p></div>
    <span class="calendar-date">${windowText(item.start,item.end)}</span>
  </div>`).join(""):`<div class="empty-state">No broad planting windows listed for this month. Use the time to prepare beds, watch weather, and check crop-specific regional advice.</div>`;
}
function renderCrops(){
  const term=$("cropSearch").value.trim().toLowerCase(),filter=$("cropFilter").value;
  const list=CROPS.filter(c=>(filter==="all"||c.category===filter)&&[c.name,c.summary,c.family].some(s=>s.toLowerCase().includes(term)));
  $("cropGrid").innerHTML=list.map(c=>`<button type="button" class="crop-card" data-crop="${c.id}" aria-label="Open ${safe(c.name)} growing guide">
    <span class="crop-emoji" aria-hidden="true">${c.emoji}</span><strong>${safe(c.name)}</strong>
    <span class="crop-meta"><span>${c.category==="warm"?"WARM SEASON":"COOL SEASON"}</span><span>${c.days} DAYS*</span></span>
    <span class="summary">${safe(c.summary)}</span><span class="crop-link">VIEW GROWING GUIDE ↗</span>
  </button>`).join("");
  $("cropCount").textContent=`${list.length} of ${CROPS.length} crop guides · *Days to harvest are cultivar-dependent estimates`;
}
function openCrop(crop){
  const windows=cropWindows(crop,chosenYear,settings);
  $("dialogBody").innerHTML=`<div class="dialog-heading"><span class="crop-emoji" aria-hidden="true">${crop.emoji}</span>
    <div><h2 id="dialogTitle">${safe(crop.name)}</h2><p>${safe(crop.family)} family · ${crop.category==="warm"?"Warm season":"Cool season"}</p></div></div>
    <p style="margin:20px 0 0;font-size:14px;color:#506255">${safe(crop.summary)}</p>
    <div class="detail-facts">
      <div class="fact"><b>Approach</b><span>${safe(crop.method)}</span></div>
      <div class="fact"><b>Seed depth</b><span>${safe(crop.depth)}</span></div>
      <div class="fact"><b>Spacing</b><span>${safe(crop.spacing)}</span></div>
      <div class="fact"><b>Sunlight</b><span>${safe(crop.light)}</span></div>
      <div class="fact"><b>Soil / planting</b><span>${safe(crop.soilTemp)}</span></div>
      <div class="fact"><b>Harvest estimate</b><span>${crop.days} days*</span></div>
    </div>
    <div class="detail-section"><h3>When to plant · ${chosenYear}</h3><p>Frost-relative windows derived from your current garden settings. Verify weather and soil temperature.</p><div class="detail-calendar">${windows.map(w=>`<p><b>${safe(w.action)}:</b> ${windowText(w.start,w.end)}</p>`).join("")}</div></div>
    <div class="detail-section"><h3>Soil & preparation</h3><p>${safe(crop.soil)}</p></div>
    <div class="detail-section"><h3>Water & feeding</h3><p>${safe(crop.water)} ${safe(crop.feed)}</p></div>
    <div class="detail-section"><h3>Harvesting</h3><p>${safe(crop.harvest)}</p></div>
    <div class="detail-section"><h3>Watch for</h3><p>${safe(crop.issues)}</p></div>
    <div class="detail-section"><h3>Field wisdom</h3><p>${safe(crop.extra)}</p><p style="margin-top:10px;font-size:11px">*Days to maturity are rough variety-dependent reference figures. Seed packets may count from transplant rather than sowing.</p></div>
    <button type="button" class="button dark full" data-open-preservation>How to preserve this harvest ↗</button>`;
  $("dialogBody").querySelector("[data-open-preservation]")?.addEventListener("click",()=>showCropPreservation(crop.id));
  $("cropDialog").showModal();
}
function renderJournal(){
  $("gardenCount").textContent=String(garden.length);
  if(!garden.length){$("journalList").innerHTML=`<div class="empty-state">Nothing planted in the journal yet. Give the soil a job.</div>`;return}
  $("journalList").innerHTML=[...garden].sort((a,b)=>b.date.localeCompare(a.date)).map(x=>{
    const c=CROP_BY_ID[x.crop],date=parseISO(x.date),harvest=addDays(date,c.days);
    return `<article class="journal-entry ${x.done?"done":""}"><div><h4>${c.emoji} ${safe(c.name)} ${x.done?"✓":""}</h4><p><b>Planted:</b> ${formatted(date,{month:"short",day:"numeric",year:"numeric"})} ${x.bed?`· ${safe(x.bed)}`:""}</p><p><b>Rough maturity:</b> ${formatted(harvest,{month:"short",day:"numeric",year:"numeric"})} (variety-dependent)</p>${x.note?`<p>${safe(x.note)}</p>`:""}</div>
      <div class="journal-btns"><button type="button" data-action="toggle" data-id="${safe(x.id)}" aria-label="${x.done?"Mark growing":"Mark harvested"}">${x.done?"Reopen":"Harvested"}</button><button type="button" data-action="delete" data-id="${safe(x.id)}" aria-label="Delete planting">×</button></div></article>`;
  }).join("");
}
function renderAll(){renderSky();renderCalendar();renderCrops();renderJournal()}
function message(id,text){$(id).textContent=text}
function init(){
  load();
  setFormValues();
  $("plantDate").value=iso(today);
  $("plantCrop").innerHTML=CROPS.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  $("settingsForm").addEventListener("submit",e=>{
    e.preventDefault();
    const proposal={name:$("gardenName").value.trim().slice(0,60)||"My garden",lastFrost:$("lastFrost").value.trim(),firstFrost:$("firstFrost").value.trim(),latitude:Number($("latitude").value)};
    if(!datesValid(proposal)){message("settingsMessage","Use valid MM-DD dates, with fall frost after spring frost, and latitude 0–70° N.");return}
    settings=proposal;$("preset").value="custom";message("settingsMessage",saveSettings()?"Saved to this browser.":"Updated for this session. Browser storage is unavailable.");renderAll();
  });
  $("preset").addEventListener("change",e=>{
    const p=PRESETS[e.target.value];if(!p)return;
    $("lastFrost").value=p.lastFrost;$("firstFrost").value=p.firstFrost;$("latitude").value=p.latitude;
    message("settingsMessage","Example dates loaded. Press Save to apply; verify them for your actual garden.");
  });
  $("prevMonth").addEventListener("click",()=>{({year:chosenYear,month:chosenMonth}=monthShift(chosenYear,chosenMonth,-1));renderCalendar()});
  $("nextMonth").addEventListener("click",()=>{({year:chosenYear,month:chosenMonth}=monthShift(chosenYear,chosenMonth,1));renderCalendar()});
  $("monthPicker").addEventListener("change",e=>{
    if(!/^\d{4}-\d{2}$/.test(e.target.value))return;
    const [y,m]=e.target.value.split("-").map(Number);
    if(y<1900||y>2100||m<1||m>12)return;
    chosenYear=y;chosenMonth=m-1;renderCalendar();
  });
  $("cropSearch").addEventListener("input",renderCrops);
  $("cropFilter").addEventListener("change",renderCrops);
  $("cropGrid").addEventListener("click",e=>{const card=e.target.closest("[data-crop]");if(card&&CROP_BY_ID[card.dataset.crop])openCrop(CROP_BY_ID[card.dataset.crop])});
  $("dialogClose").addEventListener("click",()=>$("cropDialog").close());
  $("cropDialog").addEventListener("click",e=>{if(e.target===$("cropDialog"))$("cropDialog").close()});
  $("journalForm").addEventListener("submit",e=>{
    e.preventDefault();
    const crop=$("plantCrop").value,date=$("plantDate").value;
    if(!CROP_BY_ID[crop]||!parseISO(date)){message("journalMessage","Choose a crop and valid planting date.");return}
    if(garden.length>=500){message("journalMessage","Journal limit reached (500 entries). Export or clear some entries.");return}
    garden.push({id:`${Date.now()}${Math.random().toString(36).slice(2)}`,crop,date,bed:$("plantBed").value.trim().slice(0,70),note:$("plantNote").value.trim().slice(0,500),done:false});
    message("journalMessage",saveGarden()?"Added to this browser.":"Added for this session; local storage is unavailable.");
    $("plantNote").value="";renderJournal();
  });
  $("journalList").addEventListener("click",e=>{
    const b=e.target.closest("button[data-action]");if(!b)return;
    const x=garden.find(g=>g.id===b.dataset.id);if(!x)return;
    if(b.dataset.action==="toggle")x.done=!x.done;
    if(b.dataset.action==="delete"){if(!window.confirm("Delete this journal entry?"))return;garden=garden.filter(g=>g.id!==x.id)}
    saveGarden();renderJournal();
  });
  $("exportJournal").addEventListener("click",()=>{
    const payload={app:"AlmanacPhi",version:1,exportedAt:new Date().toISOString(),settings,garden};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`almanacphi-garden-${localToday()}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $("clearJournal").addEventListener("click",()=>{
    if(!garden.length||!window.confirm("Permanently clear every locally saved garden entry? Export first if you want a backup."))return;
    garden=[];saveGarden();renderJournal();message("journalMessage","Journal cleared.");
  });
  renderAll();
  initPreservation();
  if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
}
init();
