// Read-only browser smoke and accessibility audit. Never sign in, submit forms,
// create bookings, upload files, or collect customer information.
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('node:fs');
const origin=process.env.KUMBAYA_TEST_ORIGIN||'https://kumbaya.cloud';
const portalOrigin=process.env.DOSTEP_TEST_ORIGIN||'https://dostep.kumbaya.cloud';
const tests = [
 {name:'main',url:origin+'/'},
 {name:'services',url:origin+'/services.html'},
 {name:'privacy',url:origin+'/privacy.html'},
 {name:'quote',url:origin+'/request.html'},
 {name:'cyaam',url:origin+'/cyaam.html'},
 {name:'worksheet',url:origin+'/cyaam-wheel-worksheet.html'},
 {name:'process',url:origin+'/how-services-work.html'},
 {name:'portal',url:portalOrigin+'/'}
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
   if(!['privacy','worksheet'].includes(test.name) && !info.rccc)failures.push(tag+': RCCC link absent');
   if(!['privacy','worksheet'].includes(test.name) && !info.calendly)failures.push(tag+': free Calendly link absent');
   if(test.name!=='privacy' && !info.privacy)failures.push(tag+': privacy link absent');
   if(test.name==='services'){
    const filter=page.locator('button.filter[data-mode="clinical"]');
    if(await filter.count()===0) failures.push(tag+': Cyaam filter missing');
    else {
     await page.locator('#step-3').click();
     await filter.click();
     const visible=await page.getByText('CYAAM PRODUCTS & EVENTS',{exact:false}).first().isVisible().catch(()=>false);
     if(!visible)failures.push(tag+': Cyaam products/events not visible after selecting filter');
     const resourceFilter=page.locator('button.filter[data-mode="resources"]');
     await resourceFilter.click();
     const serviceQuotes=await page.locator('#menu button.quote-request').count();
     if(serviceQuotes===0) failures.push(tag+': Right Hand Th’am request-a-quote controls absent');
     const gated=await page.locator('#menu .service-note').count();
     console.log(tag+': nonclinical resource quote controls='+serviceQuotes+' | unavailable services shown='+gated);
    }
   }
   if(test.name==='quote'){
    await page.locator('#summary').fill('General question about a nonclinical administrative task');
    await page.locator('details').evaluate(el=>el.open=true);
    const preview=await page.locator('#preview').innerText();
    if(!preview.includes('General question about a nonclinical administrative task')) failures.push(tag+': quote message preview did not update');
   }
   if(test.name==='worksheet'){
    const rows=await page.locator('#rows tr').count();
    if(rows<6) failures.push(tag+': expected at least six blank second-ring draft rows');
    await page.locator('#rows tr').first().locator('[data-column="anchor"]').fill('Test anchor');
    await page.locator('details').evaluate(el=>el.open=true);
    const preview=await page.locator('#export').innerText();
    if(!preview.includes('Test anchor')) failures.push(tag+': draft vocabulary export did not update');
   }
   const audit=await new AxeBuilder({page}).analyze();
   const severe=audit.violations.filter(v=>v.impact==='critical'||v.impact==='serious');
   for(const v of severe)failures.push(tag+': accessibility '+v.id+' ('+v.impact+') '+v.nodes.slice(0,3).map(n=>n.target.join(',')).join(';'));
   console.log(tag+': HTTP '+resp?.status()+' | '+JSON.stringify(info)+' | axe serious/critical='+severe.length+' | all='+audit.violations.length);
   await page.screenshot({path:'test-artifacts/'+tag+'.png',fullPage:true});
   if(test.name==='services'){
    const quote=page.locator('#menu button.quote-request').first();
    if(await quote.count()){
     const expected=(await quote.getAttribute('data-service'))||'';
     await quote.click();
     await page.waitForURL(/\/request\.html\?/,{timeout:10000});
     const actual=await page.locator('#selected-service').innerText();
     if(actual!==expected)failures.push(tag+': selected service did not survive quote-request navigation');
    }
   }
  }catch(e){failures.push(tag+': '+e.message.slice(0,380));}
  await page.close();
 }
 await ctx.close();
}
await browser.close();
if(failures.length){console.error('BROWSER AUDIT FAILURES:\n'+failures.map(x=>' - '+x).join('\n'));process.exitCode=1;}
else console.log('BROWSER AUDIT PASSED: 8 pages at mobile and desktop widths');

}
main().catch(error=>{console.error(error);process.exitCode=1;});
