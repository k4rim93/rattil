(() => {
const API='https://api.alquran.cloud/v1', $=id=>document.getElementById(id);
const views={mushaf:'mushafView',memorize:'memorizeView',recite:'reciteView',achievements:'achievementsView'};
function show(name){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));if(views[name])$(views[name]).classList.add('active');document.querySelector('.app').scrollIntoView({behavior:'smooth',block:'start'});}
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const h=a.getAttribute('href');show(h==='#mushaf'?'mushaf':h==='#memorize'?'memorize':h==='#recite'?'recite':'achievements');}));
document.querySelectorAll('[data-home]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));window.scrollTo({top:0,behavior:'smooth'});}));
async function json(url){const r=await fetch(url);if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();if(j.code!==200)throw Error(j.status||'API error');return j.data;}
function opt(s){return '<option value="'+s.number+'">'+s.number+'. '+s.name+' — '+s.englishName+'</option>';}
async function loadChapters(){try{const list=await json(API+'/surah');['surahSelect','memorizeSurah'].forEach(id=>$(id).innerHTML=list.map(opt).join(''));$('surahMeta').textContent='114 سورة • النص بالرسم العثماني';}catch(e){$('quranContent').textContent='تعذر تحميل قائمة السور. تحقق من الاتصال ثم أعد المحاولة.';}}
async function loadSurah(){const n=$('surahSelect').value;if(!n)return;const out=$('quranContent');out.className='empty';out.textContent='جارٍ تحميل السورة…';try{const [textVerses,tafsirVerses]=await Promise.all([json(API+'/surah/'+n+'/quran-uthmani'),json(API+'/surah/'+n+'/ar.muyassar').catch(()=>null)]);out.className='';$('surahMeta').textContent=textVerses.name+' • '+textVerses.englishName+' • '+textVerses.numberOfAyahs+' آية';out.innerHTML=textVerses.ayahs.map((a,i)=>{const taf=tafsirVerses?.ayahs?.[i]?.text;return '<article class="ayah"><div class="ayahText">'+a.text+' <span class="ayahNum">'+a.numberInSurah+'</span></div><div class="ayahActions"><button type="button" data-tafsir="'+i+'">التفسير الميسر</button><button type="button" data-bookmark="'+a.number+'">حفظ علامة</button></div><div class="verseTafsir" id="tafsir-'+i+'" hidden>'+(taf?taf.replace(/</g,'&lt;'):'التفسير الميسر غير متاح حاليًا لهذه الآية من المصدر.')+'</div></article>';}).join('');out.querySelectorAll('[data-tafsir]').forEach(b=>b.addEventListener('click',()=>{const el=$('tafsir-'+b.dataset.tafsir);el.hidden=!el.hidden;}));out.querySelectorAll('[data-bookmark]').forEach(b=>b.addEventListener('click',()=>{
 const globalAyah=+b.dataset.bookmark,localAyah=+b.closest('.ayah').querySelector('.ayahNum').textContent;
 const items=getBookmarks(),id=n+':'+localAyah;
 if(items.some(x=>x.id===id)){b.textContent='محفوظة ✓';return;}
 const surahName=$('surahSelect').selectedOptions[0]?.textContent?.split(' — ')[0]||('السورة '+n);
 items.push({id,surah:+n,ayah:localAyah,globalAyah,surahName,savedAt:Date.now()});
 localStorage.setItem(BOOKMARKS_KEY,JSON.stringify(items));b.textContent='تم الحفظ ✓';renderBookmarks();stats();
}));localStorage.setItem('rattil-last-surah',n);}catch(e){out.className='empty';out.textContent='تعذر تحميل السورة أو التفسير. حاول مرة أخرى عند توفر الإنترنت.';}}
$('loadSurah').addEventListener('click',loadSurah);
$('savePlan').addEventListener('click',()=>{const p={surah:+$('memorizeSurah').value,from:+$('memorizeFrom').value,to:+$('memorizeTo').value};if(!p.surah||p.from<1||p.to<p.from){$('planStatus').textContent='راجع أرقام السورة والآيات.';return;}localStorage.setItem('rattil-plan',JSON.stringify(p));$('planStatus').textContent='تم حفظ خطة الحفظ على هذا الجهاز. السورة '+p.surah+'، من الآية '+p.from+' إلى '+p.to+'.';});
const BOOKMARKS_KEY='rattil-bookmark-legacys-v1';
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
let asrSession=null,ort=null,recorder=null,stream=null,chunks=[],assets=null;
function asrStatus(s){$('asrStatus').textContent=s;}
async function loadAsr(){
 const btn=$('loadAsr');btn.disabled=true;
 try{
  asrStatus('تحميل مكتبات التشغيل…');
  ort=await import('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.2/dist/ort.min.mjs');
  ort.env.wasm.wasmPaths='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.2/dist/';
  ort.env.wasm.numThreads=1;
  const core=await import('https://esm.sh/@tilawi/quran-asr@0.1.0');
  asrStatus('تحميل ملفات التعرف والقرآن (حوالي 104 ميجابايت)…');
  const [model,vocab,tokens,quran]=await Promise.all([
   fetch(MODEL,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('تعذر تنزيل النموذج: '+r.status);return r.arrayBuffer();}),
   fetch(ASSETS+'vocab.json').then(r=>{if(!r.ok)throw Error('vocab download failed');return r.json();}),
   fetch(ASSETS+'quran_ctc_tokens.json').then(r=>{if(!r.ok)throw Error('token table download failed');return r.json();}),
   fetch(ASSETS+'quran.json').then(r=>{if(!r.ok)throw Error('Quran data download failed');return r.json();})
  ]);
  asrStatus('تهيئة النموذج على الجهاز…');
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
  asrSession=core.createAsrSession(runner,{vocab,quranCtcTokens:tokens,quran,blankId:1024});
  assets={quran,judgeAttempt:core.judgeAttempt};
  $('startRec').disabled=false;
  asrStatus('المحرك جاهز. يمكنك الآن بدء التسميع. يعمل التعرف محليًا على جهازك.');
 }catch(e){console.error(e);asrStatus('لم يكتمل تحميل المحرك: '+(e?.message||'خطأ غير معروف')+'. جرّب شبكة مستقرة ثم أعد المحاولة.');btn.disabled=false;}
}
$('loadAsr').addEventListener('click',loadAsr);
async function startRecording(){
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){asrStatus('المتصفح لا يدعم التسجيل المطلوب. افتح رَتِّل من Safari على HTTPS.');return;}
 try{
  stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
  const mime=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);chunks=[];
  recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
  recorder.onstop=analyseRecording;recorder.start();
  $('startRec').disabled=true;$('stopRec').disabled=false;asrStatus('جاري التسجيل… اقرأ بوضوح، ثم اضغط إيقاف وتحليل.');
 }catch(e){asrStatus('تعذر فتح الميكروفون: '+(e?.message||'تحقق من إذن الميكروفون في Safari.'));}
}
async function stopRecording(){
 if(!recorder||recorder.state==='inactive')return;
 $('stopRec').disabled=true;asrStatus('جارٍ إنهاء التسجيل وتحضير الصوت…');recorder.stop();
}
async function analyseRecording(){
 try{
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
  const blob=new Blob(chunks,{type:recorder.mimeType||'audio/mp4'});
  if(blob.size<3000)throw Error('التسجيل قصير جدًا. سجّل آية أو جزءًا أطول.');
  const Ctx=window.AudioContext||window.webkitAudioContext,ctx=new Ctx();
  const decoded=await ctx.decodeAudioData(await blob.arrayBuffer());
  const length=Math.ceil(decoded.duration*16000);
  const offline=new OfflineAudioContext(1,length,16000),source=offline.createBufferSource();
  source.buffer=decoded;source.connect(offline.destination);source.start(0);
  const rendered=await offline.startRendering();const pcm=rendered.getChannelData(0).slice();await ctx.close();
  if(pcm.length<8000)throw Error('الصوت غير كافٍ للتحليل.');
  asrStatus('المحرك يحلل التلاوة على جهازك… قد يستغرق ذلك لحظات.');
  const result=await asrSession.transcribe(pcm);
  const target=result.surah&&result.ayah?assets.quran.find(v=>Number(v.surah)===result.surah&&Number(v.ayah)===result.ayah):null;
  if(!result.surah||!result.ayah){
   $('asrResult').className='status asr-result-none';
   $('asrResult').textContent='لم أصل إلى تطابق موثوق في هذا التسجيل. جرّب مكانًا أهدأ، واقرأ مقطعًا أطول وبصوت واضح. لن أخمّن موضع الآية.';
  }else{
   $('asrResult').className='status asr-result-good';
   const score=Math.round(result.score*100);
   $('asrResult').textContent='تم التعرف على السورة '+result.surah+'، الآية '+result.ayah+(result.ayah_end&&result.ayah_end!==result.ayah?' إلى '+result.ayah_end:'')+' • درجة المطابقة '+score+'٪. النص المسموع: '+(result.transcript||'غير متاح');
   if(target&&assets.judgeAttempt&&result.transcript){
    const expected=String(target.text_uthmani||target.text||'').split(/\s+/).filter(Boolean);
    const heard=result.transcript.split(/\s+/).filter(Boolean);
    if(expected.length&&heard.length){
     const judged=assets.judgeAttempt(expected,heard);
     const note=document.createElement('p');note.className='muted';
     note.textContent='مقارنة كلمات أولية للآية المحددة: '+judged.correct+' صحيحة، '+judged.apparentErrors+' تحتاج مراجعة، '+judged.uncertain+' غير مؤكدة. هذا ليس تقييم تجويد ولا حكمًا نهائيًا على صحة التلاوة.';
     $('asrResult').appendChild(note);
    }
   }
   localStorage.setItem('rattil-last-recitation',JSON.stringify({surah:result.surah,ayah:result.ayah,score,at:Date.now()}));
  }
  asrStatus('انتهى التحليل. الصوت لم يغادر جهازك.');
 }catch(e){console.error(e);asrStatus('تعذر تحليل التسجيل: '+(e?.message||'خطأ غير معروف'));}finally{$('startRec').disabled=!asrSession;$('stopRec').disabled=true;recorder=null;chunks=[];}
}
$('startRec').addEventListener('click',startRecording);$('stopRec').addEventListener('click',stopRecording);
})();