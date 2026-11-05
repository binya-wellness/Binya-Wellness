#!/usr/bin/env python3
"""Read-only internal Stripe price registry and mock quote checks.
No network calls, credentials, invoices, payments, or customers.
"""
import json
from pathlib import Path

data=json.loads(Path("internal/stripe-live-price-registry.json").read_text(encoding="utf-8"))
assert data["environment"]=="live"
assert data["payment_policy"]=="quote_invoice_manual_confirmation_only"
assert data["paid_self_booking_enabled"] is False
items=data["products"]
assert len(items)==3
keys={x["key"] for x in items}
assert len(keys)==len(items)
assert len(set(x["price_id"] for x in items))==len(items)
expected={
 "admin_followup_30m":1500,
 "navigation_action_map_standard_60m":8500,
 "navigation_action_map_community_60m":3000
}
for item in items:
 assert item["currency"]=="usd"
 assert isinstance(item["unit_amount"],int) and item["unit_amount"]>0
 assert item["one_time"] is True
 assert item["available_for_public_checkout"] is False
 assert item["unit_amount"]==expected[item["key"]]
 assert item["price_id"].startswith("price_")
 assert item["product_id"].startswith("prod_")

def mock_quote(selection):
 total=0
 for key,quantity in selection:
  if not (isinstance(quantity,int) and 1<=quantity<=10):
   raise ValueError("quantity must be 1-10")
  matches=[x for x in items if x["key"]==key]
  if len(matches)!=1:raise ValueError("Unapproved catalog key")
  total+=matches[0]["unit_amount"]*quantity
 return total

assert mock_quote([("admin_followup_30m",1)])==1500
assert mock_quote([("navigation_action_map_standard_60m",1)])==8500
assert mock_quote([("navigation_action_map_community_60m",1)])==3000
assert mock_quote([("admin_followup_30m",1),("navigation_action_map_standard_60m",1)])==10000
assert mock_quote([("admin_followup_30m",1),("navigation_action_map_community_60m",1)])==4500
try:mock_quote([("unapproved",1)])
except ValueError:pass
else:raise AssertionError("unknown price was accepted")
print("PASS mock Stripe registry and invoice arithmetic — no payment activity performed")
