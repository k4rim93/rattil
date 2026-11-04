(() => {
const API='https://api.alquran.cloud/v1', $=id=>document.getElementById(id);
const views={mushaf:'mushafView',memorize:'memorizeView',recite:'reciteView',achievements:'achievementsView',settings:'settingsView'};
let currentScreen='home';
function renderScreen(name){
 currentScreen=views[name]?name:'home';
 const isHome=currentScreen==='home';
 $('homeView').hidden=!isHome;
 document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',!isHome&&v.id===views[currentScreen]));
 document.body.classList.toggle('screen-open',!isHome);
 window.scrollTo({top:0,behavior:'instant'});
}
function navigate(name){
 if(!views[name])return;
 history.pushState({rattilScreen:name},'', '#'+name);
 renderScreen(name);
}
function goBack(){
 if(currentScreen==='home')return;
 if(history.state?.rattilScreen){history.back();return;}
 renderScreen('home');
}
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const key=a.getAttribute('href').slice(1);navigate(key);}));
$('openSettings').addEventListener('click',()=>navigate('settings'));
document.querySelectorAll('[data-home]').forEach(b=>b.addEventListener('click',()=>goBack()));
window.addEventListener('popstate',e=>renderScreen(e.state?.rattilScreen||'home'));
$('prayerCountdown').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
// iOS-style edge swipe: start within the left 28px, finish with a deliberate rightward drag.
let touchStart=null;
document.addEventListener('touchstart',e=>{if(currentScreen!=='home'&&e.touches.length===1&&e.touches[0].clientX<=28)touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
document.addEventListener('touchend',e=>{if(!touchStart)return;const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=Math.abs(t.clientY-touchStart.y);if(dx>85&&dy<90)goBack();touchStart=null;},{passive:true});
renderScreen(location.hash.slice(1));
async function json(url){const r=await fetch(url);if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();if(j.code!==200)throw Error(j.status||'API error');return j.data;}let activeMushafPage=1,selectedVerseKey=null,surahCatalog=[],pageTurnLock=false;
function applyTheme(mode){const m=["auto","dark","light"].includes(mode)?mode:"auto";localStorage.setItem("rattil-theme",m);document.body.dataset.theme=m==="auto"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;document.querySelectorAll("[data-theme-choice]").forEach(b=>b.classList.toggle("selected",b.dataset.themeChoice===m));const status=$("themeStatus");if(status)status.textContent="المظهر الحالي: "+({auto:"تلقائي حسب إعدادات الجهاز",light:"نهاري",dark:"ليلي"}[m]);}
applyTheme(localStorage.getItem("rattil-theme")||"auto");
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{if((localStorage.getItem("rattil-theme")||"auto")==="auto")applyTheme("auto");});
document.querySelectorAll("[data-theme-choice]").forEach(b=>b.addEventListener("click",()=>applyTheme(b.dataset.themeChoice)));
const pageMetaCache=new Map(),pageSvgCache=new Map(),surahDataCache=new Map();
let readerReturnScreen="mushaf";
function showReader(){ $("mushafReader").hidden=false; document.body.classList.add("reader-open"); }
function closeReader(){ $("mushafReader").hidden=true; $("readerIndexPanel").hidden=true; $("selectedAyahPanel").hidden=true; document.body.classList.remove("reader-open"); }
function getPageMeta(page){if(!pageMetaCache.has(page))pageMetaCache.set(page,json(API+"/page/"+page+"/quran-uthmani"));return pageMetaCache.get(page);}
function getPageSvg(page){if(!pageSvgCache.has(page))pageSvgCache.set(page,fetch("https://cdn.quran.ws/svg/pages/v1.1.1/hafs-kfqc/"+String(page).padStart(3,"0")+".svg").then(r=>{if(!r.ok)throw Error("SVG HTTP "+r.status);return r.text();}));return pageSvgCache.get(page);}
function verseKey(ayah){return ayah.surah.number+":"+ayah.numberInSurah;}
function renderReaderMeta(data){const a=data.ayahs?.[0];if(!a)throw Error("Empty Mushaf page");$("readerSurah").textContent=a.surah.name;$("readerSurahName").textContent=a.surah.name;$("readerJuz").textContent="الجزء "+(a.juz||"—");$("readerHizb").textContent="الحزب "+(a.hizbQuarter||"—");$("readerPageNumber").textContent=activeMushafPage;}
function selectReaderAyah(key,meta,poly){selectedVerseKey=key;const [sn,an]=key.split(":").map(Number);const ayah=meta.ayahs.find(a=>a.surah.number===sn&&a.numberInSurah===an);const panel=$("selectedAyahPanel");if(ayah){panel.innerHTML="<strong>"+ayah.surah.name+" · الآية "+an+"</strong><div>"+ayah.text+"</div>";panel.hidden=false;localStorage.setItem("rattil-last-ayah",key);}const root=$("readerAyahs").querySelector("svg");root?.querySelectorAll(".ayahPolygon").forEach(p=>p.setAttribute("fill-opacity",p===poly?"0.42":"0"));}
async function openMushafPage(page,key,direction){const target=Math.max(1,Math.min(604,+page||1));if(pageTurnLock)return;pageTurnLock=true;activeMushafPage=target;if(key)selectedVerseKey=key;showReader();$("readerAyahs").setAttribute("aria-busy","true");$("readerPageNumber").textContent=target;try{const [meta,svgText]=await Promise.all([getPageMeta(target),getPageSvg(target)]);if(activeMushafPage!==target)return;const parsed=new DOMParser().parseFromString(svgText,"image/svg+xml");if(parsed.querySelector("parsererror")||parsed.documentElement.localName!=="svg")throw Error("Invalid page SVG");parsed.querySelectorAll("script,foreignObject").forEach(n=>n.remove());parsed.querySelectorAll("*").forEach(n=>[...n.attributes].forEach(a=>{if(/^on/i.test(a.name))n.removeAttribute(a.name);}));const host=$("readerAyahs");host.replaceChildren(document.importNode(parsed.documentElement,true));const root=host.querySelector("svg");root.setAttribute("preserveAspectRatio","xMidYMid meet");root.setAttribute("role","img");root.setAttribute("aria-label","صفحة المصحف رقم "+target);root.style.cssText="display:block;width:100%;height:100%;max-width:100%;background:var(--mushaf-page)";root.querySelectorAll("#content path:not(.ayahPolygon),#ayah_markers path:not(.ayahPolygon)").forEach(p=>p.style.setProperty("fill","var(--mushaf-ink)","important"));const content=root.querySelector("#content");if(content)content.style.pointerEvents="none";root.querySelectorAll(".ayahPolygon").forEach(poly=>{poly.style.pointerEvents="all";poly.style.cursor="pointer";poly.setAttribute("fill","#d9b65e");poly.setAttribute("fill-opacity","0");poly.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();const sn=Number(poly.getAttribute("surah")),an=Number(poly.getAttribute("ayah"));if(sn&&an)selectReaderAyah(sn+":"+an,meta,poly);});});renderReaderMeta(meta);if(selectedVerseKey){const [sn,an]=selectedVerseKey.split(":").map(Number);const hit=[...root.querySelectorAll(".ayahPolygon")].find(p=>Number(p.getAttribute("surah"))===sn&&Number(p.getAttribute("ayah"))===an);if(hit)selectReaderAyah(selectedVerseKey,meta,hit);}else $("selectedAyahPanel").hidden=true;localStorage.setItem("rattil-last-page",target);$("mushafPaper").classList.remove("page-turn-next","page-turn-prev");void $("mushafPaper").offsetWidth;if(direction)$("mushafPaper").classList.add(direction==="next"?"page-turn-next":"page-turn-prev");}catch(e){$("readerAyahs").textContent="تعذر تحميل صفحة المصحف. تحقق من الاتصال وحاول مرة أخرى.";$("readerPageNumber").textContent=target;console.error(e);}finally{$("readerAyahs").removeAttribute("aria-busy");pageTurnLock=false;}}
$("closeMushafReader").onclick=closeReader;
$("previousMushafPage").onclick=()=>openMushafPage(activeMushafPage-1,null,"prev");
$("nextMushafPage").onclick=()=>openMushafPage(activeMushafPage+1,null,"next");
const paper=$("mushafPaper");let swipeStart=null;
paper.addEventListener("touchstart",e=>{if(e.touches.length===1)swipeStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
paper.addEventListener("touchend",e=>{if(!swipeStart)return;const t=e.changedTouches[0],dx=t.clientX-swipeStart.x,dy=Math.abs(t.clientY-swipeStart.y);swipeStart=null;if(Math.abs(dx)>55&&Math.abs(dx)>dy*1.2)openMushafPage(activeMushafPage+(dx>0?1:-1),null,dx>0?"next":"prev");},{passive:true});
$("openSurahIndex").onclick=async()=>{showReader();$("readerIndexPanel").hidden=false;const host=$("readerSurahList");host.textContent="جارٍ تحميل فهرس السور…";try{if(!surahCatalog.length)await loadChapters();populateReciteSurahs();renderReaderSurahIndex();}catch(e){host.textContent="تعذر تحميل الفهرس. تحقق من الاتصال.";console.error(e);}};
$("readerOpenIndex").onclick=()=>$("openSurahIndex").click();
function renderReaderSurahIndex(filter=""){const host=$("readerSurahList");host.replaceChildren();surahCatalog.filter(s=>(s.name+" "+s.number+" "+s.englishName).toLowerCase().includes(filter.toLowerCase())).forEach(s=>{const b=document.createElement("button");b.type="button";b.className="reader-surah-row";b.innerHTML="<span class='reader-surah-number'>"+s.number+"</span><span class='reader-surah-name'>"+s.name+"</span><small>"+s.numberOfAyahs+" آية</small>";b.onclick=async()=>{b.disabled=true;try{if(!surahDataCache.has(s.number))surahDataCache.set(s.number,json(API+"/surah/"+s.number+"/quran-uthmani"));const data=await surahDataCache.get(s.number);const first=data.ayahs[0];$("readerIndexPanel").hidden=true;$("surahSelect").value=String(s.number);selectedVerseKey=s.number+":1";await openMushafPage(first.page||1,selectedVerseKey);}catch(e){b.disabled=false;host.insertAdjacentText("afterbegin","تعذر فتح السورة. حاول مرة أخرى. ");console.error(e);}};host.append(b);});}
$("readerSurahSearch").addEventListener("input",e=>renderReaderSurahIndex(e.target.value));
$("closeReaderIndex").onclick=()=>$("readerIndexPanel").hidden=true;
function opt(s){return '<option value="'+s.number+'">'+s.number+'. '+s.name+' — '+s.englishName+'</option>';}
async function loadChapters(){try{const list=await json(API+'/surah');if(!Array.isArray(list)||list.length!==114)throw Error("Expected all 114 surahs");surahCatalog=list;['surahSelect','memorizeSurah'].forEach(id=>$(id).innerHTML=list.map(opt).join(''));$('surahMeta').textContent='114 سورة • النص بالرسم العثماني';return list;}catch(e){$('quranContent').textContent='تعذر تحميل قائمة السور كاملة. تحقق من الاتصال ثم أعد المحاولة.';throw e;}}
async function loadSurah(){const n=$('surahSelect').value;if(!n)return;const out=$('quranContent');out.className='empty';out.textContent='جارٍ تحميل السورة…';try{const [textVerses,tafsirVerses]=await Promise.all([json(API+'/surah/'+n+'/quran-uthmani'),json(API+'/surah/'+n+'/ar.muyassar').catch(()=>null)]);out.className='';$('surahMeta').textContent=textVerses.name+' • '+textVerses.englishName+' • '+textVerses.numberOfAyahs+' آية';out.innerHTML=textVerses.ayahs.map((a,i)=>{const taf=tafsirVerses?.ayahs?.[i]?.text;return '<article class="ayah"><div class="ayahText" role="button" tabindex="0" data-open-page="'+(a.page||1)+'" data-verse-key="'+n+':'+a.numberInSurah+'">'+a.text+' <span class="ayahNum">'+a.numberInSurah+'</span></div><div class="ayahActions"><button type="button" data-tafsir="'+i+'">التفسير الميسر</button><button type="button" data-bookmark="'+a.number+'">حفظ علامة</button></div><div class="verseTafsir" id="tafsir-'+i+'" hidden>'+(taf?taf.replace(/</g,'&lt;'):'التفسير الميسر غير متاح حاليًا لهذه الآية من المصدر.')+'</div></article>';}).join('');out.querySelectorAll('[data-tafsir]').forEach(b=>b.addEventListener('click',()=>{const el=$('tafsir-'+b.dataset.tafsir);el.hidden=!el.hidden;}));out.querySelectorAll('[data-open-page]').forEach(el=>{const go=()=>openMushafPage(el.dataset.openPage,el.dataset.verseKey);el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};});out.querySelectorAll('[data-bookmark]').forEach(b=>b.addEventListener('click',()=>{
 const globalAyah=+b.dataset.bookmark,localAyah=+b.closest('.ayah').querySelector('.ayahNum').textContent;
 const items=getBookmarks(),id=n+':'+localAyah;
 if(items.some(x=>x.id===id)){b.textContent='محفوظة ✓';return;}
 const surahName=$('surahSelect').selectedOptions[0]?.textContent?.split(' — ')[0]||('السورة '+n);
 items.push({id,surah:+n,ayah:localAyah,globalAyah,surahName,savedAt:Date.now()});
 localStorage.setItem(BOOKMARKS_KEY,JSON.stringify(items));b.textContent='تم الحفظ ✓';renderBookmarks();stats();
}));localStorage.setItem('rattil-last-surah',n);}catch(e){out.className='empty';out.textContent='تعذر تحميل السورة أو التفسير. حاول مرة أخرى عند توفر الإنترنت.';}}
$("loadSurah").addEventListener("click",async()=>{const n=Number($("surahSelect").value);if(!n)return;try{if(!surahDataCache.has(n))surahDataCache.set(n,json(API+"/surah/"+n+"/quran-uthmani"));const d=await surahDataCache.get(n);await openMushafPage(d.ayahs[0].page||1,n+":1");}catch(e){console.error(e);$("surahMeta").textContent="تعذر فتح السورة. تحقق من الاتصال.";}});
$('savePlan').addEventListener('click',()=>{const p={surah:+$('memorizeSurah').value,from:+$('memorizeFrom').value,to:+$('memorizeTo').value};if(!p.surah||p.from<1||p.to<p.from){$('planStatus').textContent='راجع أرقام السورة والآيات.';return;}localStorage.setItem('rattil-plan',JSON.stringify(p));$('planStatus').textContent='تم حفظ خطة الحفظ على هذا الجهاز. السورة '+p.surah+'، من الآية '+p.from+' إلى '+p.to+'.';});
const BOOKMARKS_KEY='rattil-bookmarks-v1';
function getBookmarks(){
 try{
  const saved=JSON.parse(localStorage.getItem(BOOKMARKS_KEY)||'[]');
  if(Array.isArray(saved))return saved;
  return [];
 }catch{return [];}
}
function saveBookmarks(items){localStorage.setItem(BOOKMARKS_KEY,JSON.stringify(items));renderBookmarks();stats();}
function renderBookmarks(){
 const host=$('bookmarkList');if(!host)return;
 const items=getBookmarks();
 if(!items.length){host.textContent='لا توجد علامات محفوظة بعد.';return;}
 host.innerHTML='';
 items.slice().reverse().forEach(item=>{
  const row=document.createElement('div');row.className='bookmark-item';
  const label=document.createElement('span');label.textContent=(item.surahName||('السورة '+item.surah))+' — الآية '+item.ayah;
  const actions=document.createElement('span');
  const open=document.createElement('button');open.textContent='فتح';open.addEventListener('click',async()=>{ $('surahSelect').value=String(item.surah);await loadSurah();const target=document.querySelector('[data-bookmark="'+item.globalAyah+'"]');target?.scrollIntoView({behavior:'smooth',block:'center'});});
  const remove=document.createElement('button');remove.className='remove-bookmark';remove.textContent='حذف';remove.addEventListener('click',()=>saveBookmarks(getBookmarks().filter(x=>x.id!==item.id)));
  actions.append(open,remove);row.append(label,actions);host.append(row);
 });
}
function stats(){
 const p=JSON.parse(localStorage.getItem('rattil-plan')||'null');
 const b=getBookmarks();
 $('achievementStats').textContent='خطة الحفظ: '+(p?'السورة '+p.surah+'، الآيات '+p.from+'–'+p.to:'لم تُحدد بعد')+' • العلامات المحفوظة: '+b.length;
}
loadChapters();renderBookmarks();stats();

 // Cairo prayer times (Egyptian General Authority of Survey calculation).
 const prayerNames=[['Fajr','الفجر','☼'],['Sunrise','الشروق','☼'],['Dhuhr','الظهر','☀'],['Asr','العصر','◉'],['Maghrib','المغرب','☼'],['Isha','العشاء','☾']];
 let prayerDate=new Date(),prayerSchedule=null,prayerTick=null;
 const dateLabel=d=>new Intl.DateTimeFormat('ar-EG',{weekday:'long',day:'numeric',month:'long'}).format(d);
 async function loadPrayerTimes(){
  const d=prayerDate,ds=[String(d.getDate()).padStart(2,'0'),String(d.getMonth()+1).padStart(2,'0'),d.getFullYear()].join('-');
  $('date').textContent=dateLabel(d);
  const grid=$('prayerTimes'); if(grid)grid.querySelectorAll('b').forEach(x=>x.textContent='…');
  try{
   const url='https://api.aladhan.com/v1/timings/'+ds+'?latitude=30.0444&longitude=31.2357&method=5&timezonestring=Africa%2FCairo';
   const res=await fetch(url);if(!res.ok)throw Error('HTTP '+res.status);
   const payload=await res.json();if(payload.code!==200)throw Error('Prayer API unavailable');
   prayerSchedule=payload.data.timings;
   prayerNames.forEach(([key,label],i)=>{const el=$('prayer-'+key);if(el)el.textContent=String(prayerSchedule[key]||'--:--').slice(0,5);});
   $('prayerSource').textContent='القاهرة • حساب الهيئة المصرية العامة للمساحة';
   updatePrayerCountdown();
  }catch(e){
   prayerSchedule=null;$('prayerSource').textContent='تعذر تحميل المواقيت — تحقق من الاتصال وحاول تحديث الصفحة';
   $('nextPrayer').textContent='مواقيت الصلاة غير متاحة';$('prayerCountdown').textContent='--:--:--';
  }
 }
 function updatePrayerCountdown(){
  if(!prayerSchedule)return;
  const now=new Date(),keys=['Fajr','Dhuhr','Asr','Maghrib','Isha'];
  let upcoming=null,upcomingAt=null,previous=null;
  for(const key of keys){
   const [hh,mm]=String(prayerSchedule[key]).split(':').map(Number);
   const at=new Date(now);at.setHours(hh,mm,0,0);
   if(at>now&&!upcoming){upcoming=key;upcomingAt=at;}
   if(at<=now)previous=key;
  }
  if(!upcoming){upcoming='Fajr';upcomingAt=new Date(now);upcomingAt.setDate(now.getDate()+1);const [hh,mm]=String(prayerSchedule.Fajr).split(':').map(Number);upcomingAt.setHours(hh,mm,0,0);}
  const label=prayerNames.find(x=>x[0]===upcoming)?.[1]||'الفجر';
  $('nextPrayer').textContent='الصلاة القادمة: '+label;
  const secs=Math.max(0,Math.floor((upcomingAt-now)/1000)),h=Math.floor(secs/3600),m=Math.floor(secs%3600/60),s=secs%60;
  $('prayerCountdown').textContent=[h,m,s].map(x=>String(x).padStart(2,'0')).join(':');
  $('previousPrayer').textContent=previous?prayerNames.find(x=>x[0]===previous)[1]:'—';
  $('upcomingPrayer').textContent=label;
  const activeKey=upcoming;
  prayerNames.forEach(([key])=>{const el=$('prayer-'+key)?.closest('.time');if(el)el.classList.toggle('active',key===activeKey);});
 }
 $('previousDate').addEventListener('click',()=>{prayerDate.setDate(prayerDate.getDate()-1);loadPrayerTimes();});
 $('nextDate').addEventListener('click',()=>{prayerDate.setDate(prayerDate.getDate()+1);loadPrayerTimes();});
 loadPrayerTimes();prayerTick=setInterval(updatePrayerCountdown,1000);


// Local-only ASR: microphone recording -> 16 kHz mono -> ONNX -> conservative Quran matcher.
const MODEL='https://huggingface.co/muhdur/tilawi-fastconformer-quran/resolve/main/fastconformer_full_mixed.onnx';
const ASSETS='https://huggingface.co/muhdur/tilawi-fastconformer-quran/resolve/main/';
const ASR_DB='rattil-asr-assets',ASR_DB_VERSION=1,ASR_MODEL_KEY='tilawi-fastconformer-quran-v1';
let asrSession=null,ort=null,recorder=null,stream=null,chunks=[],assets=null;
function asrStatus(s){$('asrStatus').textContent=s;}
function openAsrDb(){return new Promise((resolve,reject)=>{if(!('indexedDB'in window))return reject(Error('التخزين المحلي غير مدعوم في هذا المتصفح'));const req=indexedDB.open(ASR_DB,ASR_DB_VERSION);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('files'))req.result.createObjectStore('files');};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('تعذر فتح التخزين المحلي'));});}
async function asrDbGet(key){const db=await openAsrDb();return new Promise((resolve,reject)=>{const tx=db.transaction('files','readonly'),req=tx.objectStore('files').get(key);req.onsuccess=()=>resolve(req.result??null);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();tx.onerror=()=>{db.close();reject(tx.error);};});}
async function asrDbPut(key,value){const db=await openAsrDb();return new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(value,key);tx.oncomplete=()=>{db.close();resolve(true);};tx.onerror=()=>{const e=tx.error;db.close();reject(e||Error('تعذر حفظ ملفات التسميع'));};tx.onabort=()=>{const e=tx.error;db.close();reject(e||Error('تم إلغاء حفظ ملفات التسميع'));};});}
async function asrDbDelete(){const db=await openAsrDb();return new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').clear();tx.oncomplete=()=>{db.close();resolve(true);};tx.onerror=()=>{const e=tx.error;db.close();reject(e);};});}
async function fetchAsrFile(url,type){const r=await fetch(url);if(!r.ok)throw Error('تعذر تنزيل ملف مساعد: '+r.status);return type==='json'?r.json():r.arrayBuffer();}
async function getAsrAssets(){
 const keys=['vocab','tokens','quran'],urls=[ASSETS+'vocab.json',ASSETS+'quran_ctc_tokens.json',ASSETS+'quran.json'];
 const cached=await Promise.all(keys.map(k=>asrDbGet(k).catch(()=>null)));
 const missing=keys.map((k,i)=>cached[i]===null?i:-1).filter(i=>i>=0);
 if(missing.length){asrStatus('تنزيل ملفات القرآن المساعدة…');const values=await Promise.all(missing.map(i=>fetchAsrFile(urls[i],'json')));await Promise.all(missing.map((i,j)=>asrDbPut(keys[i],values[j]).catch(e=>console.warn('Could not persist ASR helper',keys[i],e))));missing.forEach((i,j)=>cached[i]=values[j]);}
 return {vocab:cached[0],tokens:cached[1],quran:cached[2]};
}
async function getAsrModel(){
 let model=await asrDbGet(ASR_MODEL_KEY).catch(()=>null);
 if(model instanceof ArrayBuffer&&model.byteLength>0){asrStatus('النموذج موجود على الجهاز — لا حاجة لإعادة تنزيله.');return model;}
 asrStatus('تنزيل نموذج التسميع لأول مرة (حوالي 100 ميجابايت)…');
 model=await fetchAsrFile(MODEL,'buffer');
 try{await asrDbPut(ASR_MODEL_KEY,model);asrStatus('تم تنزيل النموذج وحفظه على الجهاز.');}
 catch(e){console.warn('ASR model persistence failed',e);asrStatus('تم التنزيل، لكن المتصفح لم يسمح بحفظ النموذج بشكل دائم؛ قد تحتاج لإعادة تنزيله لاحقًا.');}
 return model;
}
async function refreshAsrStorageStatus(){try{const model=await asrDbGet(ASR_MODEL_KEY);const b=$('clearAsrCache');if(b)b.disabled=!(model instanceof ArrayBuffer);if(model instanceof ArrayBuffer)asrStatus('نموذج التسميع محفوظ على الجهاز ('+(model.byteLength/1048576).toFixed(0)+' ميجابايت).');}catch(e){console.warn('ASR storage check failed',e);}}
async function clearAsrStorage(){if(asrSession){asrStatus('أغلق محرك التسميع أولًا بإعادة تحميل الصفحة قبل حذف النموذج.');return;}const b=$('clearAsrCache');b.disabled=true;try{await asrDbDelete();asrStatus('تم حذف ملفات التسميع المحفوظة من هذا الجهاز.');}catch(e){asrStatus('تعذر حذف الملفات: '+(e.message||e));b.disabled=false;}}
async function loadAsr(){
 const btn=$('loadAsr');btn.disabled=true;
 try{
  asrStatus('تحميل مكتبات التشغيل…');
  ort=await import('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.2/dist/ort.min.mjs');
  ort.env.wasm.wasmPaths='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.2/dist/';
  ort.env.wasm.numThreads=1;
  const core=await import('https://esm.sh/@tilawi/quran-asr@0.1.0');
  const [model,files]=await Promise.all([getAsrModel(),getAsrAssets()]);
  if(navigator.storage?.persist){try{await navigator.storage.persist();}catch(e){console.info('Persistent storage request unavailable',e);}}
  asrStatus('تهيئة النموذج المحفوظ على الجهاز…');
  const session=await ort.InferenceSession.create(model,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
  const audioName=session.inputNames.find(n=>/audio|signal|input/i.test(n))||session.inputNames[0];
  const lengthName=session.inputNames.find(n=>/len/i.test(n))||session.inputNames[1];
  const outputName=session.outputNames[0];
  const runner={async run(audio){
   const input=new ort.Tensor('float32',audio,[1,audio.length]);
   const length=new ort.Tensor('int64',BigInt64Array.from([BigInt(audio.length)]),[1]);
   const result=await session.run({[audioName]:input,[lengthName]:length});
   const out=result[outputName],dims=out.dims;
   return {logprobs:out.data,timeSteps:Number(dims[dims.length-2]),vocabSize:Number(dims[dims.length-1])};
  }};
  asrSession=core.createAsrSession(runner,{vocab:files.vocab,quranCtcTokens:files.tokens,quran:files.quran,blankId:1024});
  assets={quran:files.quran,judgeAttempt:core.judgeAttempt};
  $('startRec').disabled=false;
  btn.disabled=true;
  const size=(model.byteLength/1048576).toFixed(0);
  asrStatus('محرك التسميع جاهز. النموذج محفوظ على الجهاز ('+size+' ميجابايت) — المرة القادمة لن تحتاج تنزيله.');
  await refreshAsrStorageStatus();
 }catch(e){console.error(e);asrStatus('لم يكتمل تحميل المحرك: '+(e?.message||'خطأ غير معروف')+'. جرّب شبكة مستقرة ثم أعد المحاولة.');btn.disabled=false;}
}
$('loadAsr').addEventListener('click',loadAsr);$('clearAsrCache').addEventListener('click',clearAsrStorage);refreshAsrStorageStatus();
let liveAudioContext=null,liveMediaStream=null,liveSource=null,liveProcessor=null,liveSamples=[],liveSampleCount=0,lastLiveInference=0,liveInferenceBusy=false,liveExpectedSurah=0,liveLastVerse=0,liveWordStates=[];
const LIVE_WINDOW_SECONDS=8,LIVE_HOP_SECONDS=2.5;
function populateReciteSurahs(){const s=$('reciteSurahSelect');if(!s||!surahCatalog.length)return;s.replaceChildren();surahCatalog.forEach(ch=>{const o=document.createElement('option');o.value=ch.number;o.textContent=ch.number+' — '+ch.name;s.append(o);});}
function renderLiveVerse(verse,judged){const host=$('liveRecitationText');host.replaceChildren();const title=document.createElement('strong');title.className='live-verse-title';title.textContent=verse.surahName+' · الآية '+verse.ayah;host.append(title,document.createElement('br'));const statuses=new Map((judged?.words||[]).filter(w=>w.expectedIndex!=null).map(w=>[w.expectedIndex,w.judgment]));const words=String(verse.text).split(/\s+/).filter(Boolean);words.forEach((word,i)=>{const span=document.createElement('span');span.className='rec-word '+(({correct:'correct','apparent-error':'error',uncertain:'uncertain',unattempted:'unattempted'})[statuses.get(i)]||'unattempted');span.textContent=word+' ';span.dataset.wordIndex=i;host.append(span);});if(!host.classList.contains('is-hidden')){const current=host.querySelector('.rec-word.correct:last-of-type,.rec-word.error:last-of-type,.rec-word.uncertain:last-of-type');current?.scrollIntoView({block:'nearest',behavior:'smooth'});}}
function resampleTo16k(input,rate){if(rate===16000)return input.slice();const outLength=Math.floor(input.length*16000/rate),out=new Float32Array(outLength),ratio=rate/16000;for(let i=0;i<outLength;i++){const p=i*ratio,l=Math.floor(p),f=p-l;out[i]=(input[l]||0)*(1-f)+(input[Math.min(l+1,input.length-1)]||0)*f;}return out;}
function appendLiveSamples(data){const next=resampleTo16k(data,liveAudioContext.sampleRate);for(let i=0;i<next.length;i++)liveSamples.push(next[i]);const max=16000*LIVE_WINDOW_SECONDS*2;if(liveSamples.length>max)liveSamples.splice(0,liveSamples.length-max);liveSampleCount+=next.length;}
async function processLiveWindow(){if(liveInferenceBusy||!asrSession||liveSamples.length<16000*3)return;liveInferenceBusy=true;try{const audio=Float32Array.from(liveSamples.slice(-16000*LIVE_WINDOW_SECONDS));const result=await asrSession.transcribe(audio);if(!result.surah||!result.ayah||!result.transcript)return;const verse=assets.quran.find(v=>Number(v.surah)===result.surah&&Number(v.ayah)===result.ayah);if(!verse)return;const expected=String(verse.text_uthmani||verse.text||'').split(/\s+/).filter(Boolean);const heard=String(result.transcript).split(/\s+/).filter(Boolean);const judged=assets.judgeAttempt(expected,heard);const name=surahCatalog.find(s=>s.number===result.surah)?.name||('سورة '+result.surah);renderLiveVerse({surahName:name,ayah:result.ayah,text:verse.text_uthmani||verse.text},judged);$('asrResult').textContent='متابعة مباشرة · '+name+' · الآية '+result.ayah+' · '+Math.round(result.score*100)+'٪ ثقة في تحديد الموضع. الأحمر = اختلاف محتمل، الأصفر = غير مؤكد.';if(result.surah!==liveLastVerse||result.ayah!==liveLastVerse){liveLastVerse=result.ayah;localStorage.setItem('rattil-last-recitation',JSON.stringify({surah:result.surah,ayah:result.ayah,score:Math.round(result.score*100),at:Date.now()}));}}catch(e){console.warn('Live ASR window failed',e);}finally{liveInferenceBusy=false;}}
async function startRecording(){if(!navigator.mediaDevices?.getUserMedia||!window.AudioContext&&!window.webkitAudioContext){asrStatus('المتصفح لا يدعم التقاط الصوت المباشر. افتح رَتِّل من Safari على HTTPS.');return;}try{liveMediaStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:false}});const Ctx=window.AudioContext||window.webkitAudioContext;liveAudioContext=new Ctx();await liveAudioContext.resume();liveSource=liveAudioContext.createMediaStreamSource(liveMediaStream);liveProcessor=liveAudioContext.createScriptProcessor(4096,1,1);liveSamples=[];liveSampleCount=0;lastLiveInference=0;liveLastVerse=0;liveInferenceBusy=false;liveExpectedSurah=Number($('reciteSurahSelect').value)||0;liveProcessor.onaudioprocess=e=>{if(!liveAudioContext)return;appendLiveSamples(e.inputBuffer.getChannelData(0));if(liveSampleCount-lastLiveInference>=16000*LIVE_HOP_SECONDS){lastLiveInference=liveSampleCount;processLiveWindow();}};liveSource.connect(liveProcessor);liveProcessor.connect(liveAudioContext.destination);$('startRec').disabled=true;$('stopRec').disabled=false;$('reciteSurahSelect').disabled=true;asrStatus('التسميع المباشر يعمل على الجهاز. اقرأ باستمرار؛ قد يتأخر التحديث عدة ثوانٍ حسب سرعة الآيفون.');}catch(e){asrStatus('تعذر فتح الميكروفون: '+(e?.message||'تحقق من إذن الميكروفون.'));stopLiveRecording();}}
async function stopLiveRecording(){if(liveProcessor){liveProcessor.onaudioprocess=null;try{liveProcessor.disconnect();}catch(e){}}if(liveSource){try{liveSource.disconnect();}catch(e){}}if(liveMediaStream){liveMediaStream.getTracks().forEach(t=>t.stop());}if(liveAudioContext){try{await liveAudioContext.close();}catch(e){}}liveProcessor=liveSource=liveMediaStream=liveAudioContext=null;$('startRec').disabled=!asrSession;$('stopRec').disabled=true;$('reciteSurahSelect').disabled=false;asrStatus('تم إيقاف التسميع المباشر. الصوت لم يغادر جهازك.');}
$('toggleReciteText').addEventListener('click',()=>{const h=$('liveRecitationText'),hidden=h.classList.toggle('is-hidden'),b=$('toggleReciteText');b.textContent=hidden?'إظهار النص':'إخفاء النص';b.setAttribute('aria-pressed',String(hidden));});
$('reciteSurahSelect').addEventListener('change',()=>{liveExpectedSurah=Number($('reciteSurahSelect').value)||0;});
$('startRec').addEventListener('click',startRecording);$('stopRec').addEventListener('click',stopLiveRecording);
$('startRec').addEventListener('click',startRecording);$('stopRec').addEventListener('click',stopRecording);
})();