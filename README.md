# Appointment Mapper

Google Apps Script web app. Every time the page opens it reads the next 14 days of
the viewer's own calendar (or another one they can see, via `?cal=`), drops past, all-day, declined and video-call events, and pins
the rest on a Google map colored by weekday (filled pins this week, outlined next week).
The search box is Google Places, and picking an address ranks the days by nearest stop.

- Script: https://script.google.com/d/1qv1C6BI_wGQhA6uGlV1kmmt1AL3ABQHzsX5gPZ3q0q71t6QWfDIdbxbB/edit
- Web app V1 (version 4, frozen): https://script.google.com/macros/s/AKfycbz1Fhm_4hWng9pe_n6Ex534-BaWsaWO-9qO5R7-wK6uaEmKN4Ux9QxeCD3O6PKb758B/exec
- Web app V2 (shows the signed-in account and how to fix a wrong one): https://script.google.com/macros/s/AKfycbyj2Vnzl5IZo3r_nyd1EWWxflf90qnZwt32OkmjSOyRBPXofw7zIUFwWVZpPMt4M_gb/exec

Signed into several Google accounts? Apps Script uses the first one (a Google bug open since 2017).
V2 shows which account it used and a Copy link button for a private window.
`/macros/u/N/` links do not work: they loop through sign-in.
Workspace accounts can also use `/a/macros/<domain>/s/<id>/exec`.

Runs as the person viewing it (`USER_ACCESSING`), so it only works for Google accounts that
can already read that calendar.

## One-time setup

1. Google Cloud console: create an API key, enable **Maps JavaScript API** and
   **Places API (New)**, and restrict the key to HTTP referrers
   `https://*.googleusercontent.com/*` and `https://script.google.com/*`.
2. Script editor > Project Settings > Script properties: add `MAPS_API_KEY`.
   Optional: `MAP_ID` (defaults to `DEMO_MAP_ID`) and `CALENDAR_ID` (defaults to
   `primary`, the viewer's own calendar). A link can also pick a calendar with `?cal=<calendar id>`.
3. Script editor: run `setup` once to approve calendar access and check the log.

## Change and redeploy (same URL)

```bash
npm test
clasp push --force
clasp update-deployment AKfycbyj2Vnzl5IZo3r_nyd1EWWxflf90qnZwt32OkmjSOyRBPXofw7zIUFwWVZpPMt4M_gb --description "vN"
```

Geocodes are cached in Script properties under `geo:<address>`.
