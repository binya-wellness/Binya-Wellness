#!/usr/bin/env python3
"""Read-only KUMBAYA customer-boundary checks. No sign-in, charges, messages or writes."""
from pathlib import Path
import re

portal=Path("northstar/index.html").read_text()
home=Path("index.html").read_text()
services=Path("services.html").read_text()
request=Path("request.html").read_text()
cyaam=Path("cyaam.html").read_text()
wheel=Path("cyaam-wheel-worksheet.html").read_text()
booking=Path("internal/verified-booking-links.json").read_text()
checks={
"Sensitive uploads remain off in both portals":all("allowSensitiveUploads: false" in html for html in (portal,home)),
"Portal requires MFA for sensitive tasks":all("requireMfaForSensitiveActions: true" in html for html in (portal,home)),
"Do’step login guarded by backend health":all("if(!(await verifyBackendConnection()))" in html and "if(!sb || !backendReady)" in html for html in (portal,home)),
"Do’step public booking uses Calendly":"'free-portal-scheduler')?.classList.add('hidden')" in portal and all("calendly.com/kumbaya-cloud-proton/30min" in html for html in (portal,home)),
"Service quote uses draft inquiry": "window.location.assign('/request.html?'+params.toString())" in services,
"Form explicitly requires user to send draft": "you must send it" in request,
"Customer inquiry has no network/form backend":bool(re.search(r'<form id="inquiry"',request)) and not re.search(r'(?:\bfetch\s*\(|\bXMLHttpRequest\b|\.sendBeacon\s*\(|\bsupabase\b|<form[^>]+action=)',request,re.I),
"Cyaam products labelled development": "In development:" in cyaam and "currently available to purchase or register" in cyaam,
"Feelings Wheel makes no invented vocabulary": "rows are intentionally blank" in wheel and "DRAFT_NOT_FINAL" in wheel and "validateDraft(doc)" in wheel,
"Only verified free public Calendly mapping": '"paid": false' in booking and '"paid": true' not in booking,
}
for name,success in checks.items():print(("PASS" if success else "FAIL")+" "+name)
if not all(checks.values()):raise SystemExit(1)
