# Propella Stays demo video

Records how stays work, for guests and for hosts, from the real web app with
made-up data, then builds MP4s with FFmpeg.

Nothing talks to Supabase. The dev server is pointed at a fake host
(`demo.supabase.test`), and Playwright answers every request to it from an
in-memory database (`mock.cjs` + `data.cjs`). Every other outside request
(Sentry, analytics, maps) is blocked.

## Files

| File | What it does |
| --- | --- |
| `data.cjs` | Made-up guests, hosts, six stays, rooms and bookings, plus the booking RPCs and the `stay-payment` function in JavaScript |
| `mock.cjs` | A small PostgREST, Auth and Storage stand-in served through Playwright routing, and a fake signed-in session |
| `photos.cjs` | Draws the stay "photos" as SVG illustrations into `assets/` |
| `film.cjs` | The short guest and host story, recorded and built into the videos below |
| `host-film.cjs` | The detailed host guide with a voice-over (ElevenLabs) |
| `kit.cjs` | Shared recorder, taps, captions, title cards and FFmpeg assembly |

## Run it

Needs Node, Chrome, FFmpeg on `PATH` and `playwright-core`. Set
`PLAYWRIGHT_CORE` to its folder if it isn't installed here.

```sh
# 1. A dev server on the fake backend (from the propellaweb folder)
VITE_PUBLIC_SUPABASE_URL=http://demo.supabase.test VITE_PUBLIC_SUPABASE_ANON_KEY=demo npx vite --port 3100 --strictPort

# 2. From this folder
node photos.cjs          # once: draws assets/*.jpg
node film.cjs            # records and builds: out/*.mp4
node film.cjs record     # only record (frames in work/)
node film.cjs build      # only rebuild the video from work/
```

## Host guide with a voice-over

`host-film.cjs` walks through everything a host does: the dashboard and
charts, listing a new stay (details, address, amenities, price, photos),
adding room types and rooms, the calendar, blocking nights, bookings,
replying to a guest, the wallet and withdrawals, analytics, and editing a
listing.

The narration comes from ElevenLabs. Set `ELEVENLABS_API_KEY` in your
environment (never in a file here); `VOICE_ID` picks another voice. Clips
are cached in `assets/voice/` by their text, so only changed lines are
generated again. Each step waits for its narration before the next starts.

```sh
node host-film.cjs          # narration, recording and video
node host-film.cjs voice    # only the narration
node host-film.cjs record   # only record (FAST=1 skips waiting for the voice)
node host-film.cjs build    # only rebuild the video
```

Output: `out/propella-stays-host-guide.mp4`, 1920×1080 at 30 fps with AAC audio.

## Output

- `out/propella-stays-demo.mp4`: intro, then the guest booking and paying the
  deposit straight away, then the host's side, then an outro
- `out/propella-stays-guests.mp4`: the guest parts only
- `out/propella-stays-hosts.mp4`: the host part only

All are 1920×1080 at 30 fps, silent, with the phone screen in a frame and
step captions beside it.

## Changing the story

- Captions and steps are the `mark(...)` calls in `film.cjs`.
- Data (names, prices, rooms, existing bookings) lives in `data.cjs`. Dates
  are relative to the day you record.
- Layout and colours of the captions and cards are in `captionHtml` and
  `cardHtml` in `film.cjs`.
