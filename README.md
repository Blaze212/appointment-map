# Appointment Mapper

Appointment Mapper turns the next 14 days of your Google Calendar into a Google map.
Every appointment that has an address gets a pin, colored by day of the week. Search any
new address and it tells you which day already has you closest to it.

It runs as a small Google Apps Script web app inside your own Google account. There is no
server to run and nothing to install on your phone.

**What you need:** a Google account (Gmail or Google Workspace), a credit card for the
Google Cloud billing account (normal use stays inside the free monthly allowance), and
about 30 minutes.

---

## 1. Google account setup

This part gets you a Google Maps key. The map and the address search need it. Reading your
calendar and placing your appointments on the map do not.

### 1.1 Create a Google Cloud project

1. Go to https://console.cloud.google.com and sign in with the Google account that owns
   your calendar.
2. Click the project picker at the top of the page, then **New project**.
3. Name it `Appointment Mapper` and click **Create**. Make sure it is selected in the
   project picker before you continue.

### 1.2 Turn on billing

Google Maps requires a billing account even when you stay inside the free allowance.

1. Open the menu, then **Billing**.
2. Click **Link a billing account** (or **Create account**) and add a card.

### 1.3 Turn on the two Maps services

1. Open **APIs & Services > Library**.
2. Search for **Maps JavaScript API** and click **Enable**.
3. Go back to the library, search for **Places API (New)** and click **Enable**.

### 1.4 Create and lock down the key

1. Open **APIs & Services > Credentials > Create credentials > API key**. Copy the key.
2. Click the key's name to edit it.
3. Under **Application restrictions** choose **Websites** and add both of these:
   - `https://*.googleusercontent.com/*`
   - `https://script.google.com/*`
4. Under **API restrictions** choose **Restrict key** and tick **Maps JavaScript API**
   and **Places API (New)**.
5. Click **Save**.

Treat the key like a password. Do not post it or email it.

### 1.5 Put a ceiling on cost

Each month Google gives you, for free:

| What uses it | Free each month | After that, roughly |
|---|---|---|
| Opening the map | 10,000 map loads | $7 per 1,000 |
| Choosing an address in the search box | 5,000 lookups | $17 per 1,000 |

That is about 330 map opens and 165 address searches every day, far more than one person
uses.

Open **Billing > Budgets & alerts** and create a budget of `$1` with an email alert, so you
hear about it the moment anything is charged. A budget only warns you. It does not stop
usage, and Google does not let you lower the daily map load limit (it shows as
"Unlimited" and "Adjustable: No"). The key restrictions in step 1.4 are what stop anyone
else from using your key on their own site.

---

## 2. App setup

### 2.1 Create the script

1. Go to https://script.google.com, signed in with the account that owns your calendar.
2. Click **New project**. Click **Untitled project** at the top and rename it
   `Appointment Mapper`. Google shows this name on the permission screen.
3. Click the gear icon (**Project Settings**) and tick
   **Show "appsscript.json" manifest file in editor**.

### 2.2 Add the code

Go back to the editor (the `< >` icon). You need four files. Copy each one from the
`src/` folder of this repository.

| File in the editor | How to create it | Copy from |
|---|---|---|
| `Code.gs` | Already there. Replace everything in it. | `src/Code.gs` |
| `Logic.gs` | **+ > Script**, name it `Logic` | `src/Logic.gs` |
| `Index.html` | **+ > HTML**, name it `Index` | `src/Index.html` |
| `appsscript.json` | Already there. Replace everything in it. | `src/appsscript.json` |

Name the HTML file exactly `Index`, with a capital I. Click **Save** (the disk icon).

If you use the command line instead, install [clasp](https://github.com/google/clasp),
run `clasp login`, then from this folder run `clasp create-script --type standalone
--title "Appointment Mapper" --rootDir src` and `clasp push --force`. The create step
overwrites `src/appsscript.json`, so restore it from git before you push.

### 2.3 Add your Maps key

1. **Project Settings > Script properties > Add script property**.
2. Property `MAPS_API_KEY`, value: the key from step 1.4.
3. Click **Save script properties**.

### 2.4 Approve calendar access

1. In the editor, pick `setup` from the function menu next to **Run**, then click **Run**.
2. Google asks for permission. Click **Review permissions** and choose your account.
3. You will see **Google hasn't verified this app**. That is expected: you wrote this app
   and Google has not reviewed it. Click **Advanced**, then
   **Go to Appointment Mapper (unsafe)**, then **Allow**.
4. The log at the bottom should say how many appointments it found and
   `Maps API key set: yes`.

### 2.5 Publish it as a web app

1. Click **Deploy > New deployment**.
2. Click the gear next to **Select type** and choose **Web app**.
3. Description: `v1`. Leave **Execute as** and **Who has access** as they are. The
   manifest sets them to "User accessing the web app" and "Anyone with a Google account".
4. Click **Deploy** and copy the **Web app URL**. That is your app's link.
5. Copy the **Deployment ID** as well. Add it under **Project Settings > Script
   properties** as `DEPLOYMENT_ID`. The calendar picker uses it to reload the right page.

### 2.6 Optional settings

All of these go under **Project Settings > Script properties**.

| Property | What it does | Default |
|---|---|---|
| `CALENDAR_ID` | Which calendar opens when the link has no `?cal=` | `primary`, the viewer's own calendar |
| `MAP_ID` | A styled map ID from Google Cloud (Map Management) | `DEMO_MAP_ID` |

### 2.7 Only you should use it?

If the map is just for you, change the manifest's `webapp` block to
`"executeAs": "USER_DEPLOYING", "access": "MYSELF"` and deploy a new version. You approve it
once in step 2.4 and the link then opens straight to the map, with no permission screen.
Nobody else can open it.

### 2.8 Publishing changes later

A deployment is frozen at the version it was created with. After you change the code, use
**Deploy > Manage deployments**, click the pencil, choose **New version**, and click
**Deploy**. The link stays the same.

---

## 3. Using the app

### Opening it

Open your web app link. The first time, Google asks for permission the same way as in
step 2.4. After that it opens straight to the map. On a phone, use **Share > Add to Home
Screen** so it opens like an app.

The page reads your calendar every time it opens. Past days drop off and new or cancelled
appointments show up on the next open. There is nothing to sync.

### Reading the map

- **Which appointments appear:** anything in the next 14 days with an address in the
  location field. All-day events, declined invitations and video calls are left out.
- **Pin colors:** each weekday has its own color. Filled pins are this week, outlined pins
  are next week. The number on a pin matches the numbered list beside the map.
- **Dashed lines** join each day's stops in time order.
- **Tap a pin** for the time, the address, **Directions** and **Open in Google Maps**.
- **Route this day** above each day's list opens every stop for that day as one route in
  Google Maps.
- **Day buttons** at the top of the list hide or show that day's pins.
- "Not confirmed" marks an invitation you have not accepted yet.

### Fitting in a new appointment

Type the new address in the search box at the top. A black star drops on the map and a box
lists the days with a stop closest to it, in straight-line miles. Use **Directions** on a
pin for real drive time.

### Switching calendars

If your account can see more than one calendar, a **Calendar** menu appears under your
name. Pick one and the page reloads with it. Holidays, birthdays and calendars you have
hidden in Google Calendar are left out.

To link someone straight to a calendar, add `?cal=` and the calendar ID to the end of the
link, for example `.../exec?cal=someone@gmail.com`. You find a calendar's ID in Google
Calendar under **Settings and sharing > Integrate calendar**.

### Sharing with someone else

Send them the web app link. The page runs as whoever opens it, so each person sees their
own calendar and only calendars already shared with them. They approve it once the same way
as in step 2.4.

To let someone see your appointments, share your calendar with them in Google Calendar
(**Settings and sharing > Share with specific people**, "See all event details") and send
them the link with `?cal=` and your calendar ID.

### Troubleshooting

| What you see | What to do |
|---|---|
| "Signed in as" shows the wrong account | Google uses the first account you signed into. Click **Copy link**, open a private or incognito window, and sign in only with the right account. Workspace accounts can also use `https://script.google.com/a/macros/<your domain>/s/<deployment id>/exec`. |
| "cannot see the calendar" | That account has no access to it. Pick another from the **Calendar** menu, or ask the owner to share it. |
| "Map is not set up yet" | `MAPS_API_KEY` is missing. See step 2.3. |
| The list works but the map is blank | Check the key restrictions in step 1.4, that both APIs from step 1.3 are enabled, and that billing is on. |
| An appointment is missing | It needs an address in the event's location field. Addresses Google cannot find are listed under the map. |
| Picking a calendar opens an older version | `DEPLOYMENT_ID` is missing or wrong. See step 2.5. |
| A change to the code does nothing | Deploy a new version. See step 2.8. |

---

## For developers

- `src/Logic.gs` holds the pure filtering and URL logic. `npm test` runs its unit tests.
- `src/Code.gs` holds the Apps Script entry points (`doGet`, `setup`).
- `src/Index.html` is the page. It loads the Maps JavaScript API with the key from script
  properties.
- Addresses are geocoded with the Apps Script Maps service and cached in script properties
  under `geo:<address>`.

```bash
npm test
clasp push --force
clasp update-deployment <deployment id> --description "vN"
```
