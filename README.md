# ঠাকুর দেখা: North Kolkata, pandal by pandal

A pocket guide for our Durga Puja route: eleven pandals from Shyambazar Metro to Sealdah, with Tala Prattoy as an optional extra.

- Every stop and every leg opens straight in Google Maps (app on phones, browser elsewhere). These links need no API key.
- Shows how to get between pandals (walk, bus, auto, toto, cab) with the times and distances from our plan.
- Tap **Mark as seen** at each pandal. The string of lights at the top plays pandal-light patterns, the bulbs for pandals you've seen stay lit, and progress is saved on that phone. The small button by the lights pauses the show.
- Set a start time and minutes per pandal to see roughly when you'll reach each stop. Once you start marking stops, later times are recalculated from when you actually got there.
- A live map of the whole route. It uses the Google Maps JavaScript API when a key is set, and falls back to keyless Google Maps embeds when there's no key or Google rejects it.
- Anyone can make their own route, or copy ours and change it, then share it with a link (see below).

## Run it locally

```bash
npm install
npm run dev
```

To see the interactive map locally, copy `.env.example` to `.env.local` and fill in `VITE_GOOGLE_MAPS_API_KEY`. `.env.local` is gitignored, so the key never lands in the repo.

## Deploy on Vercel

1. Import this repo in Vercel. It detects Vite on its own (build `npm run build`, output `dist`).
2. Optional, for the interactive map: in **Project Settings → Environment Variables**, add `VITE_GOOGLE_MAPS_API_KEY`, then redeploy. Without it the site still works and uses the keyless embed.

### Lock down the Google Maps key

The key ships inside the site's JavaScript, the same as on any site that shows a Google map, so restrict it in the [Google Cloud console](https://console.cloud.google.com/apis/credentials):

- **Application restrictions → Websites:** add `https://<your-project>.vercel.app/*` (plus any custom domain, and `http://localhost:5173/*` if you want it locally).
- **API restrictions:** allow only **Maps JavaScript API** and **Places API** (the route editor's location search uses Places).

If the key ever stops working, the page notices and switches to the keyless map by itself.

## Make your own route

Tap **Make your own route** at the top of the page (it becomes **Switch route** once you have one).

- **Make a new route** starts from scratch. **Copy and edit** starts from our route.
- Add stops in the order you'll visit. Each one is a pandal, an optional pandal, a station or meeting point, or Home (last stop only, using the address each person saves).
- For the location, search Google Maps and pick a suggestion to pin the exact place (needs the API key), type the name and area (works without a key; opens as a Google Maps search), or tap **Use where I am now**.
- For every stop after the start, add the steps to get there: walk, bus, auto, toto, cab or metro, what to do, minutes (like `5` or `10-15`) and distance (like `350` or `1.2 km`).

Routes are saved on the phone that made them. **Share with the group** puts the whole route inside the link, so whoever opens it gets the same route saved on their phone. No server or account needed. Progress is kept separately for each route.

## Change the built-in route

Everything about the route lives in [`src/data/route.ts`](src/data/route.ts): stops, Google place IDs, coordinates and the steps between stops. After moving or adding a stop, refresh the street paths drawn on the map:

```bash
npm run routes
```

That fetches walking paths from the OpenStreetMap routing service and rewrites `src/data/paths.ts`.

## Credits

Maps and directions by Google Maps. Street paths © OpenStreetMap contributors. Type set in Galada and Anek Bangla.
