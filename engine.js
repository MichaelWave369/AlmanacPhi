// AlmanacPhi's date and astronomy logic. All date arithmetic is UTC to avoid DST drift.
export const DAY = 86400000;
export const DEFAULT_SETTINGS = Object.freeze({name:"My garden",lastFrost:"04-15",firstFrost:"10-15",latitude:40});
export const PRESETS = Object.freeze({
  temperate:{lastFrost:"04-15",firstFrost:"10-15",latitude:40},
  mild:{lastFrost:"03-01",firstFrost:"12-01",latitude:35},
  short:{lastFrost:"05-15",firstFrost:"09-15",latitude:45}
});
export function parseISO(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso||"")) return null;
  const [y,m,d]=iso.split("-").map(Number);
  const date=new Date(Date.UTC(y,m-1,d));
  return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?date:null;
}
export function iso(date){return date.toISOString().slice(0,10)}
export function mmddToDate(year,value){
  if(!/^\d{2}-\d{2}$/.test(value||""))return null;
  const [month,day]=value.split("-").map(Number);
  const d=new Date(Date.UTC(year,month-1,day));
  return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day?d:null;
}
export function addDays(date,n){return new Date(date.getTime()+Math.round(n)*DAY)}
export function formatted(date,options={month:"short",day:"numeric"}){
  return new Intl.DateTimeFormat("en-US",{timeZone:"UTC",...options}).format(date);
}
export function datesValid(settings){
  if(!settings||!mmddToDate(2028,settings.lastFrost)||!mmddToDate(2028,settings.firstFrost))return false;
  const a=mmddToDate(2028,settings.lastFrost),b=mmddToDate(2028,settings.firstFrost);
  return b>a&&Number.isFinite(Number(settings.latitude))&&Number(settings.latitude)>=0&&Number(settings.latitude)<=70;
}
export function cropWindows(crop,year,settings){
  if(!datesValid(settings))return [];
  return crop.schedule.flatMap(item=>{
    const anchor=mmddToDate(year,item.anchor==="last"?settings.lastFrost:settings.firstFrost);
    if(!anchor)return [];
    return [{crop,year,kind:item.kind,action:item.action,anchor:item.anchor,
      start:addDays(anchor,item.from*7),end:addDays(anchor,item.to*7)}];
  });
}
export function monthEvents(crops,year,month,settings){
  if(month<0||month>11)return [];
  const first=new Date(Date.UTC(year,month,1));
  const last=new Date(Date.UTC(year,month+1,0));
  return crops.flatMap(c=>[year-1,year,year+1].flatMap(y=>cropWindows(c,y,settings)))
    .filter(e=>e.start<=last&&e.end>=first)
    .sort((a,b)=>a.start-b.start||a.crop.name.localeCompare(b.crop.name));
}
export function seasonFor(date){
  const m=date.getUTCMonth()+1,d=date.getUTCDate();
  if(m<3||(m===3&&d<20)||(m===12&&d>=21))return "Winter";
  if(m<6||(m===6&&d<21))return "Spring";
  if(m<9||(m===9&&d<22))return "Summer";
  return "Autumn";
}
// Approximation of geometric daylight including standard atmospheric refraction.
// Assumes a level horizon; not sunrise/sunset clock times or a terrain forecast.
export function daylightHours(latitude,date){
  const start=Date.UTC(date.getUTCFullYear(),0,1);
  const day=Math.floor((date.getTime()-start)/DAY)+1;
  const phi=latitude*Math.PI/180;
  const decl=23.44*Math.PI/180*Math.sin(2*Math.PI*(day-80)/365.2422);
  const zen=90.833*Math.PI/180;
  const cosH=(Math.cos(zen)-Math.sin(phi)*Math.sin(decl))/(Math.cos(phi)*Math.cos(decl));
  if(cosH>=1)return 0;
  if(cosH<=-1)return 24;
  return 24*Math.acos(cosH)/Math.PI;
}
export function daylightDisplay(hours){
  const mins=Math.round(hours*60);
  return `${Math.floor(mins/60)}h ${String(mins%60).padStart(2,"0")}m`;
}
// Mean synodic month. This is a phase approximation, not a full orbital ephemeris.
const SYNODIC=29.530588853;
const NEW_MOON_REF=Date.UTC(2000,0,6,18,14);
export function moonPhase(date){
  const phase=((date.getTime()-NEW_MOON_REF)/DAY/SYNODIC%1+1)%1;
  const illumination=(1-Math.cos(2*Math.PI*phase))/2;
  const names=["New moon","Waxing crescent","First quarter","Waxing gibbous","Full moon","Waning gibbous","Last quarter","Waning crescent"];
  const index=Math.floor((phase+1/16)*8)%8;
  return {phase,illumination,age:phase*SYNODIC,name:names[index],waxing:phase<.5};
}
export function monthShift(year,month,delta){
  const d=new Date(Date.UTC(year,month+delta,1));
  return {year:d.getUTCFullYear(),month:d.getUTCMonth()};
}
export function seasonTip(season){
  return ({Winter:"Protect roots, tend soil, and plan the coming season.",
    Spring:"Check frost risk, start seeds, and prepare healthy beds.",
    Summer:"Watch heat, moisture, pests, and harvest timing.",
    Autumn:"Sow cool crops, restore soil, and prepare for frost."})[season];
}
export function lunarTradition(phase){
  if(phase<.5)return "Traditional lunar planting suggests sowing above-ground crops during the waxing Moon. This is a cultural practice, not a scientifically established yield advantage.";
  return "Traditional lunar planting suggests roots and bulbs during the waning Moon. This is a cultural practice, not a scientifically established yield advantage.";
}
