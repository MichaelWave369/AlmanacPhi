const CACHE="almanacphi-v8";
const CORE=["./","./index.html","./styles.css","./app.js","./engine.js","./crop-data.js",
  "./preservation-data.js","./preservation-ui.js","./pantry-stock.js","./pantry-stock-ui.js","./recipe-data.js","./kitchen-ui.js","./pantry-kitchen.js","./cooking-data.js","./cooking-ui.js","./harvest-data.js","./harvest-ui.js"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("almanacphi-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
  // Network first avoids stale pages/modules after a new GitHub Pages release.
  // Cached files remain usable when the network is down.
  event.respondWith(fetch(request).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}
    return response;
  }).catch(async()=>await caches.match(request)||Response.error()));
});
