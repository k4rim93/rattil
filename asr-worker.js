// Rattil Zipformer streaming worker — all model inference stays off the UI thread.
import * as ort from "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.2/dist/ort.min.mjs";
import { createRecognitionSession } from "https://cdn.jsdelivr.net/npm/@tilawa/core@0.4.0/+esm";

const MODEL_URL="https://github.com/yazinsai/tilawa/releases/download/zipformer-a0w-ep1-a0.5/zipformer_a0w_ep1_a05.int8.onnx";
const CORPUS_URL="https://github.com/yazinsai/tilawa/releases/download/v0.3.0/zipformer_quran.json";
const QURAN_URL="https://github.com/yazinsai/tilawa/releases/download/v0.2.0/quran.json";
const DB_NAME="rattil-zipformer-assets",DB_VERSION=1;
const KEYS={model:"zipformer-a0w-ep1-a05-int8",corpus:"zipformer-quran-v03",quran:"quran-display-v02"};
let session=null,queue=Promise.resolve(),selectedSurah=0;
function post(type,data={}){self.postMessage({type,...data});}
function dbOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains("assets"))r.result.createObjectStore("assets");};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error("IndexedDB unavailable"));});}
async function dbGet(key){const db=await dbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction("assets","readonly"),r=tx.objectStore("assets").get(key);r.onsuccess=()=>resolve(r.result??null);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();tx.onerror=()=>{db.close();reject(tx.error);};});}
async function dbPut(key,value){const db=await dbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction("assets","readwrite");tx.objectStore("assets").put(value,key);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{const e=tx.error;db.close();reject(e||Error("Cache write failed"));};});}
async function fetchJson(url,key){let value=await dbGet(key).catch(()=>null);if(value)return value;const r=await fetch(url);if(!r.ok)throw Error("Asset download failed ("+r.status+"): "+url);value=await r.json();await dbPut(key,value).catch(e=>console.warn("Asset cache write failed",e));return value;}
async function fetchModel(){
 let value=await dbGet(KEYS.model).catch(()=>null);if(value instanceof ArrayBuffer&&value.byteLength>0)return value;
 post("loading_status",{message:"تنزيل نموذج Zipformer لأول مرة (حوالي 66 ميجابايت)…"});
 const r=await fetch(MODEL_URL);if(!r.ok)throw Error("Model download failed: "+r.status);
 const total=Number(r.headers.get("content-length"))||0;
 if(!r.body){value=await r.arrayBuffer();post("loading",{percent:100});}
 else{const reader=r.body.getReader(),parts=[];let loaded=0;while(true){const {done,value:chunk}=await reader.read();if(done)break;parts.push(chunk);loaded+=chunk.byteLength;post("loading",{percent:total?Math.round(loaded/total*100):0});}
 const bytes=new Uint8Array(loaded);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}value=bytes.buffer;}
 await dbPut(KEYS.model,value).catch(e=>{console.warn("Model cache write failed",e);post("loading_status",{message:"تم التنزيل لكن تعذر حفظ النموذج محليًا؛ قد تحتاج لتنزيله مرة أخرى."});});
 return value;
}
async function init(){
 try{
  post("loading_status",{message:"تحميل مكتبة التعرف على التلاوة…"});
  ort.env.wasm.numThreads=1;
  ort.env.wasm.wasmPaths="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.2/dist/";
  const [model,corpus,quran]=await Promise.all([fetchModel(),fetchJson(CORPUS_URL,KEYS.corpus),fetchJson(QURAN_URL,KEYS.quran)]);
  if(navigator.storage?.persist)try{await navigator.storage.persist();}catch(e){}
  post("loading_status",{message:"تهيئة محرك Zipformer داخل Web Worker…"});
  session=await createRecognitionSession({ort,model:()=>model,corpus:()=>corpus,quran:()=>quran,executionProviders:["wasm"],onEvent:event=>post("event",{event})});
  post("ready");
 }catch(e){console.error("Rattil Zipformer init failed",e);post("error",{message:e?.message||String(e)});}
}
async function handle(m){
 if(m.type==="init"){await init();return;}
 if(m.type==="set_surah"){selectedSurah=Number(m.surah)||0;return;}
 if(m.type==="reset"){session?.reset();return;}
 if(m.type==="audio"&&session){await session.feed(m.samples);return;}
 if(m.type==="stop"&&session){await session.stop();return;}
}
self.onmessage=e=>{queue=queue.then(()=>handle(e.data||{})).catch(err=>post("error",{message:err?.message||String(err)}));};
