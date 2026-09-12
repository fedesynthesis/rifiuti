/* Rifiuti Mazzano — service worker */
const CACHE = 'rifiuti-v7';
const ASSETS = ["./","./index.html","./manifest.json","./icon-b.svg","./icon-180-b.png","./icon-192-b.png","./icon-512-b.png"];
self.addEventListener("install", e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())); });
self.addEventListener("activate", e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch", e=>{
  const req=e.request;
  if(req.method!=="GET") return;
  try{ if(new URL(req.url).pathname.startsWith("/hub/")) return; }catch(_){}
  if(req.mode==="navigate"){
    e.respondWith(
      fetch(new Request(req.url,{cache:"no-store",credentials:"same-origin"}))
        .catch(()=>fetch(req)).catch(()=>caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(caches.match(req).then(hit=> hit || fetch(req).then(res=>{
    const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{}); return res;
  }).catch(()=>hit)));
});

/* ---- Notifiche push (lo scheduler di TEMPO manda un webpush alle 21; qui lo mostro) ---- */
self.addEventListener("push", e=>{
  let d={};
  try{ d = e.data ? e.data.json() : {}; }catch(_){ try{ d={notification:{body:e.data.text()}}; }catch(__){ d={}; } }
  const n = d.notification || (d.data||{});
  const title = n.title || "♻️ Rifiuti";
  const body  = n.body  || "Stasera esponi i rifiuti";
  e.waitUntil(self.registration.showNotification(title, {
    body, icon:"./icon-192-b.png", badge:"./icon-192-b.png", tag: n.tag || "rifiuti",
    data:{ link:(d.fcmOptions&&d.fcmOptions.link) || "./" }, vibrate:[80,40,80]
  }));
});
self.addEventListener("notificationclick", e=>{
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || "./";
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(ws=>{
    for(const w of ws){ if("focus" in w) return w.focus(); }
    if(clients.openWindow) return clients.openWindow(link);
  }));
});
