#!/usr/bin/env python3
"""KUMBAYA public pages: source checks + opt-in deployed-site smoke checks.
No credentials, client data, bookings, charges or form submissions.
"""
from __future__ import annotations
from html.parser import HTMLParser
from pathlib import Path
import os, re, subprocess, sys, tempfile, urllib.request

SITES = {
 "index.html": "https://kumbaya.cloud/",
 "services.html": "https://kumbaya.cloud/services.html",
 "privacy.html": "https://kumbaya.cloud/privacy.html",
 "how-services-work.html": "https://kumbaya.cloud/how-services-work.html",
 "request.html": "https://kumbaya.cloud/request.html",
 "cyaam.html": "https://kumbaya.cloud/cyaam.html",
 "cyaam-wheel-worksheet.html": "https://kumbaya.cloud/cyaam-wheel-worksheet.html",
 "northstar/index.html": "https://dostep.kumbaya.cloud/",
}
RCCC = "https://www.rainbowconnectioncounseling.com/contact-us"
CALENDLY = "https://calendly.com/kumbaya-cloud-proton/30min"

class Scan(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True)
  self.ids=[]; self.aria=[]; self.labels=[]; self.script=False
  self.script_buf=[]; self.scripts=[]; self.links=[]
 def handle_starttag(self, tag, attrs):
  a=dict(attrs)
  if "id" in a: self.ids.append(a["id"])
  if "aria-controls" in a: self.aria.extend(a["aria-controls"].split())
  if tag=="label" and "for" in a: self.labels.append(a["for"])
  if tag=="a": self.links.append(a)
  if tag=="script":
   self.script=True; self.script_buf=[]
 def handle_endtag(self, tag):
  if tag=="script" and self.script:
   self.scripts.append("".join(self.script_buf));self.script=False
 def handle_data(self, data):
  if self.script: self.script_buf.append(data)

def check_html(name, html, check_js=False):
 scanner=Scan();scanner.feed(html)
 problems=[]
 for attr,vals in [("id",scanner.ids)]:
  duplicates={v for v in vals if vals.count(v)>1}
  if duplicates:problems.append(f"Duplicate {attr}: {sorted(duplicates)}")
 missing=set(scanner.aria)-set(scanner.ids)
 if missing:problems.append(f"aria-controls missing target: {sorted(missing)}")
 label_missing=set(scanner.labels)-set(scanner.ids)
 if label_missing:problems.append(f"Labels missing control: {sorted(label_missing)}")
 for a in scanner.links:
  if a.get("target")=="_blank" and "noopener" not in a.get("rel",""):
   problems.append("External new-window link lacks rel=noopener")
 if check_js:
  with tempfile.TemporaryDirectory() as td:
   for i,js in enumerate(scanner.scripts):
    if not js.strip():continue
    file=Path(td)/f"inline-{i}.mjs";file.write_text(js,encoding="utf-8")
    cmd=subprocess.run(["node","--check",str(file)],capture_output=True,text=True)
    if cmd.returncode:problems.append(f"Inline JavaScript {i} syntax: {cmd.stderr[:350]}")
 return problems

def test_source():
 failed=False
 for file in SITES:
  text=Path(file).read_text(encoding="utf-8")
  issues=check_html(file,text,check_js=True)
  if file not in ("privacy.html",):
   for url in [RCCC,CALENDLY,"https://kumbaya.cloud/privacy.html"]:
    if url not in text:issues.append("Missing required public destination: "+url)
  if file=="services.html":
   for phrase in ["CYAAM PRODUCTS & EVENTS","Ask about launch","Right Hand Th’am"]:
    if phrase not in text:issues.append("Missing catalog or availability signal: "+phrase)
  if file=="request.html" and "Nothing you type here is submitted" not in text:
   issues.append("Missing privacy assurance for inquiry builder")
  if file=="cyaam-wheel-worksheet.html" and "rows are intentionally blank" not in text:
   issues.append("Draft vocabulary worksheet must not invent expressions")
  if file=="northstar/index.html" and "Free 15-minute introduction" not in text:
   issues.append("Missing free-only portal booking language")
  if issues:failed=True
  print(("FAIL" if issues else "PASS")+" source "+file)
  for issue in issues:print("  - "+issue)
 return not failed

def test_production():
 failed=False
 for file,url in SITES.items():
  issues=[]
  try:
   req=urllib.request.Request(url,headers={"User-Agent":"KUMBAYA-SafeSmokeCheck/1.0"})
   with urllib.request.urlopen(req,timeout=18) as response:
    html=response.read(900000).decode("utf-8",errors="replace")
    code=response.status
   if code!=200:issues.append("HTTP "+str(code))
   if file in ("index.html","services.html","northstar/index.html"):
    for must in [RCCC,CALENDLY]:
     if must not in html:issues.append("Deployed content missing "+must)
   if file=="services.html" and "CYAAM PRODUCTS & EVENTS" not in html:
    issues.append("Cyaam products/events finder not deployed")
   if file=="cyaam.html" and "In development" not in html:
    issues.append("Cyaam development status not present")
   if file=="request.html" and "Open email draft" not in html:
    issues.append("Inquiry form not deployed")
   if file=="how-services-work.html" and "How our services work" not in html:
    issues.append("Customer process information not present")
   if file=="privacy.html" and "Privacy, inquiries" not in html:
    issues.append("Privacy notice not present")
   issues+=check_html(file,html,check_js=False)
  except Exception as ex:issues.append(type(ex).__name__+": "+str(ex)[:200])
  if issues:failed=True
  print(("FAIL" if issues else "PASS")+" production "+url)
  for issue in issues:print("  - "+issue)
 return not failed

if __name__=="__main__":
 mode=sys.argv[1] if len(sys.argv)>1 else "source"
 ok=test_source() if mode=="source" else test_production() if mode=="production" else False
 sys.exit(0 if ok else 1)
