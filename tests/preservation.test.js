import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CROPS} from "../crop-data.js";
import {PRESERVATION_GUIDES,PRESERVATION_BY_ID,CROP_PRESERVATION,preservationForCrop,validPantryEntry} from "../preservation-data.js";

test("all growing crops have curated, defined harvest pathways",()=>{
  assert.equal(PRESERVATION_GUIDES.length,8);
  assert.equal(new Set(PRESERVATION_GUIDES.map(x=>x.id)).size,8);
  for(const crop of CROPS){
    const info=preservationForCrop(crop.id);
    assert.ok(info,`No preservation pathway for ${crop.id}`);
    assert.ok(info.guides.length>0,`No preservation guide for ${crop.id}`);
    assert.equal(info.methods.length,info.guides.length);
    assert.ok(info.note.length>30);
    for(const method of info.methods)assert.ok(PRESERVATION_BY_ID[method],`Unknown method ${method}`);
  }
  assert.equal(preservationForCrop("not-a-crop"),null);
});

test("each preservation guide has multi-step guidance, warnings and HTTPS original sources",()=>{
  for(const guide of PRESERVATION_GUIDES){
    assert.ok(guide.name&&guide.summary&&guide.tag&&guide.alert);
    assert.ok(guide.steps.length>=5,`Insufficient instructions: ${guide.id}`);
    assert.ok(guide.sources.length>=1);
    for(const src of guide.sources){
      assert.equal(new URL(src.url).protocol,"https:");
      assert.ok(src.label.length>5);
    }
  }
});

test("no incorrect water-bath path for low-acid crops without a specific tested acidified route",()=>{
  assert.ok(!CROP_PRESERVATION.beans.methods.includes("water-bath"));
  assert.ok(!CROP_PRESERVATION.corn.methods.includes("water-bath"));
  assert.ok(!CROP_PRESERVATION.peas.methods.includes("water-bath"));
  assert.ok(!CROP_PRESERVATION.zucchini.methods.includes("pressure"));
  assert.ok(!CROP_PRESERVATION.zucchini.methods.includes("water-bath"));
  assert.ok(CROP_PRESERVATION.beets.note.includes("Pickled"));
  assert.ok(CROP_PRESERVATION.tomato.note.includes("acidification"));
  assert.match(PRESERVATION_BY_ID["refrigerator-pickles"].alert,/NOT canned|NOT shelf-stable/i);
});

test("pantry validation rejects unknown methods, invalid crops, and canning without recipe link",()=>{
  const sample={id:"sample",crop:"tomato",method:"freezing",date:"2026-11-11",quantity:"3 bags",location:"Freezer",note:"",recipe:""};
  assert.ok(validPantryEntry(sample));
  assert.equal(validPantryEntry({...sample,method:"pressure"}),false);
  assert.equal(validPantryEntry({...sample,method:"pressure",recipe:"https://nchfp.uga.edu/how/can/"}),true);
  assert.equal(validPantryEntry({...sample,method:"water-bath",recipe:"file:///recipe.txt"}),false);
  assert.equal(validPantryEntry({...sample,method:"water-bath",recipe:"javascript:alert(1)"}),false);
  assert.equal(validPantryEntry({...sample,crop:"lettuce",method:"pressure"}),false);
  assert.equal(validPantryEntry({...sample,crop:"__proto__"}),false);
  assert.equal(validPantryEntry({...sample,quantity:"x".repeat(81)}),false);
});

test("static site includes its preservation source, UI and bumped offline cache",()=>{
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const js=readFileSync(new URL("../app.js",import.meta.url),"utf8");
  const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
  assert.match(html,/id="preserve"/);
  assert.match(html,/id="pantryForm"/);
  assert.match(html,/id="preserveDialog"/);
  assert.match(js,/initPreservation\(\)/);
  assert.match(sw,/almanacphi-v2/);
  assert.match(sw,/preservation-data\.js/);
  assert.match(sw,/preservation-ui\.js/);
});
