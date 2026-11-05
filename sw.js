const CACHE='rattil-live-recitation-v2';
const RUNTIME='rattil-asr-runtime-v1';
const CORE=['./','./index.html','./manifest.webmanifest','./app.js','./asr-worker.js'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(CORE);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('rattil-')&&k!==CACHE&&k!==RUNTIME).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 event.respondWith((async()=>{
  const cached=await caches.match(event.request);if(cached)return cached;
  const response=await fetch(event.request);
  if(response.ok&&(url.origin===self.location.origin||url.hostname==='cdn.jsdelivr.net')){
   const cache=await caches.open(url.origin===self.location.origin?CACHE:RUNTIME);
   try{await cache.put(event.request,response.clone());}catch(e){console.warn('Rattil cache skipped',url.href,e);}
  }
  return response;
 })());
});
