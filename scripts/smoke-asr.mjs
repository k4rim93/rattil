import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
const server=spawn("npx",["vite","preview","--host","127.0.0.1","--port","4173","--strictPort"],{stdio:"ignore"});
let browser;
try{
 let ready=false;
 for(let i=0;i<60;i++){try{const r=await fetch("http://127.0.0.1:4173/");if(r.ok){ready=true;break;}}catch{}await delay(1000);}
 if(!ready)throw Error("Vite preview did not start");
 browser=await chromium.launch({headless:true,args:["--no-sandbox","--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream"]});
 const context=await browser.newContext({permissions:["microphone"]});
 const page=await context.newPage();
 page.on("pageerror",e=>console.error("PAGE ERROR",e));
 page.on("console",m=>{if(m.type()==="error")console.error("BROWSER",m.text());});
 await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
 await page.locator('a[href="#recite"]').click();
 await page.locator(".recite-surah-index-item").first().click();
 await page.waitForSelector("#liveRecitationText .recite-ayah",{timeout:30000});
 await page.locator("#loadAsr").click();
 await page.waitForFunction(()=>{const s=document.querySelector("#asrStatus")?.textContent||"";return s.includes("جاهز")||s.includes("تعذر")||s.includes("حدث خطأ");},{timeout:240000});
 const status=await page.locator("#asrStatus").innerText();
 console.log("ASR INIT STATUS:",status);
 if(!status.includes("جاهز"))throw Error("ASR initialization failed: "+status);
 await page.locator("#startRec").click();
 await page.waitForFunction(()=>document.querySelector("#stopRec")?.disabled===false,null,{timeout:15000});
 await page.waitForTimeout(2500);
 await page.locator("#stopRec").click();
 await page.waitForTimeout(1000);
 const finalStatus=await page.locator("#asrStatus").innerText();
 if(!finalStatus.includes("إيقاف التسميع"))throw Error("Audio feed/stop smoke test did not complete: "+finalStatus);
 console.log("PASS: model downloaded, Zipformer session created, audio fed and session stopped.");
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
