import test from "node:test";
import assert from "node:assert/strict";
import {CROPS,CROP_BY_ID} from "../crop-data.js";
import {DEFAULT_SETTINGS,parseISO,iso,addDays,mmddToDate,datesValid,cropWindows,monthEvents,daylightHours,daylightDisplay,moonPhase,seasonFor,monthShift} from "../engine.js";
test("all crop IDs and schedule windows are usable",()=>{
  assert.equal(CROPS.length,19);
  assert.equal(new Set(CROPS.map(x=>x.id)).size,CROPS.length);
  for(const crop of CROPS){
    assert.equal(CROP_BY_ID[crop.id],crop);
    assert.ok(crop.days>0);
    assert.ok(crop.schedule.length>0);
    for(const e of crop.schedule){
      assert.ok(["last","first"].includes(e.anchor));
      assert.ok(["direct","indoor","transplant"].includes(e.kind));
      assert.ok(e.from<=e.to);
    }
    assert.ok(cropWindows(crop,2026,DEFAULT_SETTINGS).length>0);
  }
});
test("UTC calendar math survives month, year, and daylight-saving transitions",()=>{
  assert.equal(iso(addDays(parseISO("2026-12-31"),1)),"2027-01-01");
  assert.equal(iso(addDays(parseISO("2026-03-08"),7)),"2026-03-15");
  assert.equal(iso(addDays(parseISO("2028-02-28"),1)),"2028-02-29");
  assert.equal(parseISO("2026-02-29"),null);
  assert.equal(mmddToDate(2026,"02-30"),null);
});
test("frost dates must be real Northern Hemisphere dates in order",()=>{
  assert.ok(datesValid(DEFAULT_SETTINGS));
  assert.equal(datesValid({...DEFAULT_SETTINGS,lastFrost:"11-10",firstFrost:"03-10"}),false);
  assert.equal(datesValid({...DEFAULT_SETTINGS,lastFrost:"99-10"}),false);
  assert.equal(datesValid({...DEFAULT_SETTINGS,latitude:-42}),false);
  assert.equal(datesValid({...DEFAULT_SETTINGS,latitude:71}),false);
});
test("tomato windows fall on expected days for sample frost calendar",()=>{
  const windows=cropWindows(CROP_BY_ID.tomato,2026,DEFAULT_SETTINGS);
  assert.equal(iso(windows[0].start),"2026-02-18");
  assert.equal(iso(windows[0].end),"2026-03-04");
  assert.equal(iso(windows[1].start),"2026-04-22");
});
test("month results include windows that overlap but begin outside month",()=>{
  const march=monthEvents(CROPS,2026,2,DEFAULT_SETTINGS);
  assert.ok(march.some(x=>x.crop.id==="tomato"&&x.kind==="indoor"));
  const october=monthEvents(CROPS,2026,9,DEFAULT_SETTINGS);
  assert.ok(october.some(x=>x.crop.id==="garlic"));
});
test("solar day length changes with seasons and latitude",()=>{
  const summer=daylightHours(40,parseISO("2026-06-21"));
  const winter=daylightHours(40,parseISO("2026-12-21"));
  const equinox=daylightHours(0,parseISO("2026-03-20"));
  assert.ok(summer>14&&winter<10);
  assert.ok(Math.abs(equinox-12)<.3);
  assert.match(daylightDisplay(summer),/^\d+h \d\dm$/);
});
test("moon cycle is bounded, physically plausible and continuous",()=>{
  const newish=moonPhase(new Date("2000-01-06T18:14:00Z"));
  assert.ok(newish.illumination<.001);
  for(let i=0;i<365;i++){
    const p=moonPhase(addDays(parseISO("2026-01-01"),i));
    assert.ok(p.phase>=0&&p.phase<1);
    assert.ok(p.illumination>=0&&p.illumination<=1);
  }
});
test("seasons and month navigation wrap correctly",()=>{
  assert.equal(seasonFor(parseISO("2026-04-01")),"Spring");
  assert.equal(seasonFor(parseISO("2026-08-01")),"Summer");
  assert.equal(seasonFor(parseISO("2026-10-01")),"Autumn");
  assert.equal(seasonFor(parseISO("2026-01-01")),"Winter");
  assert.deepEqual(monthShift(2026,11,1),{year:2027,month:0});
  assert.deepEqual(monthShift(2026,0,-1),{year:2025,month:11});
});
