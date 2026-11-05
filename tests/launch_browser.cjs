// Read-only browser smoke and accessibility audit. Never sign in, submit forms,
// create bookings, upload files, or collect customer information.
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('node:fs');
const tests = [
 {name:'main',url:'https://kumbaya.cloud/'},
 {name:'services',url:'https://kumbaya.cloud/services.html'},
 {name:'privacy',url:'https://kumbaya.cloud/privacy.html'},
 {name:'portal',url:'https://dostep.kumbaya.cloud/'}
];
async function main(){
const failures = [];
const browser = await chromium.launch({headless:true});
fs.mkdirSync('test-artifacts',{recursive:true});
for(const width of [390,1280]){
 const ctx=await browser.newContext({viewport:{width,height:850},deviceScaleFactor:1,reducedMotion:'reduce'});
 for(const test of tests){
  const page=await ctx.newPage();
  const tag=test.name+'-'+width;
  try{
   const resp=await page.goto(test.url,{waitUntil:'domcontentloaded',timeout:30000});
   if(!resp || resp.status()!==200) failures.push(tag+': HTTP '+resp?.status());
   await page.waitForTimeout(400);
   const info=await page.evaluate(()=>({
    title:document.title,
    overflow:document.documentElement.scrollWidth>window.innerWidth+3,
    rccc:!!document.querySelector('a[href*="rainbowconnectioncounseling.com/contact-us"]'),
    calendly:!!document.querySelector('a[href*="calendly.com/kumbaya-cloud-proton/30min"]'),
    privacy:!!document.querySelector('a[href*="/privacy.html"]')
   }));
   if(info.overflow)failures.push(tag+': page horizontal viewport overflow');
   if(test.name!=='privacy' && !info.rccc)failures.push(tag+': RCCC link absent');
   if(test.name!=='privacy' && !info.calendly)failures.push(tag+': free Calendly link absent');
   if(test.name!=='privacy' && !info.privacy)failures.push(tag+': privacy link absent');
   if(test.name==='services'){
    const filter=page.locator('button.filter[data-mode="clinical"]');
    if(await filter.count()===0) failures.push(tag+': Cyaam filter missing');
    else {
     await page.locator('#step-3').click();
     await filter.click();
     const visible=await page.getByText('CYAAM PRODUCTS & EVENTS',{exact:false}).first().isVisible().catch(()=>false);
     if(!visible)failures.push(tag+': Cyaam products/events not visible after selecting filter');
    }
   }
   const audit=await new AxeBuilder({page}).analyze();
   const severe=audit.violations.filter(v=>v.impact==='critical'||v.impact==='serious');
   for(const v of severe)failures.push(tag+': accessibility '+v.id+' ('+v.impact+') '+v.nodes.slice(0,3).map(n=>n.target.join(',')).join(';'));
   console.log(tag+': HTTP '+resp?.status()+' | '+JSON.stringify(info)+' | axe serious/critical='+severe.length+' | all='+audit.violations.length);
   await page.screenshot({path:'test-artifacts/'+tag+'.png',fullPage:true});
  }catch(e){failures.push(tag+': '+e.message.slice(0,380));}
  await page.close();
 }
 await ctx.close();
}
await browser.close();
if(failures.length){console.error('BROWSER AUDIT FAILURES:\n'+failures.map(x=>' - '+x).join('\n'));process.exitCode=1;}
else console.log('BROWSER AUDIT PASSED: 4 pages at mobile and desktop widths');

}
main().catch(error=>{console.error(error);process.exitCode=1;});
