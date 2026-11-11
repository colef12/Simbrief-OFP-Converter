# SimBrief OFP Converter

Pulls your latest generated [SimBrief](https://www.simbrief.com) flight plan and reformats it into real-world airline OFP / dispatch release formats that SimBrief doesn't offer.

**Live app:** https://colef12.github.io/Simbrief-OFP-Converter/

## Use

1. Generate a flight on SimBrief.
2. Pick an output format from the dropdown.
3. Enter your SimBrief **username** or **Pilot ID** (Account → Pilot ID) and click **Fetch latest OFP**.
4. Print / save as PDF, copy, or download as .txt.

No login or password is needed. SimBrief's public API returns your most recently generated plan for that ID. Your ID, chosen format and settings are saved in your browser only. **Load JSON** accepts a saved SimBrief JSON file, and **Demo** loads a sample flight.

## Formats

| ID | Format | Status |
|---|---|---|
| `psa` | PSA Airlines CRJ dispatch release (ACARS-printed OFP) | ✅ Available |
| `rpa` | Republic Airways E-Jet flight brief (Navtech-style release) | ✅ Available |
| `missionplus` | Mission+ iPad EFB — Dashboard, Nav Log | ✅ Available (more pages planned) |
| … | More niche formats | Planned |

### PSA Airlines

Release line, dispatch release and crew block, fuel/time/weights/STRUC/SKED block, ICAO FPL, MEL placards, nav log, enroute spot winds, TLR, weather and NOTAMs, laid out like the ACARS printout.

PSA conventions applied:
- **T/OFUEL** = burn + reserve + alternate + contingency (minimum legal fuel; tanker listed separately).
- **FOB** = T/OFUEL + tanker. **RAMP** = FOB + taxi. **FOD** = FOB − burn.
- **PAYLD** (release line) = max allowable payload = min(MZFW − BOW, MTOW − BOW − FOB, MLW − BOW − FOD).
- **PAX/BAG** = seat / bag capacity.
- Nav log **ADBO** = planned fuel remaining at the fix; **FRMG** = planned burn from that fix to the next.
- TLR is filled when SimBrief has takeoff/landing data for the aircraft type; MEL placards come from Settings.
- **Field reports** (after NOTAMs): field conditions per station built from TLR runways, runway-closure and taxiway NOTAMs, and METAR surface weather (DRY 6/6/6, WET 5/5/5, contaminated → see NOTAMs), plus deicing reports from METAR temperature and precipitation. Station frequencies are N/A (not in SimBrief); station remarks come from Settings.

### Republic Airways (RPA)

Release page (crew/EE#, planned vs estimated max payload/pax/bags, FMS perf init, fuel block, planned / max FLP / structural weights, MEL/NEF and CDL), ATC flight plan, 4-line nav log with ACTUAL/DIFF blanks and MIN RQD, cruise winds at FL−4000/−2000/plan/+4000, contingency route summary, TLR (weights in tens of lbs), departure/arrival weather, and NOTAMs grouped by subject.

RPA conventions applied:
- **MIN** = burn + reserve + hold + alternate + MEL. **RAMP** = MIN + taxi + extra. **FOD** = ramp − taxi − burn.
- **HOLD** = SimBrief contingency fuel; FOD and extra times are based on the hold fuel flow.
- **MIN RQD** at each fix = remaining burn + reserve + alternate; at destination = reserve + hold + alternate.
- **Estimated max payload** = min(MZFW − BOW, MTOW − BOW − TOF, MLW − BOW − FOD).
- TLR weights print in tens of lbs (e.g. 7462 = 74,620).

## Settings

- **General** (all formats): kg → lbs conversion, callsign override, fleet numbers, type designation overrides.
- **Crew & dispatch** (all formats): captain/F-O employee numbers, dispatch desk.
- **Format-specific** settings appear only when that format is selected.
  - PSA: ACARS header lines, standard route #, dispatcher phone, BOW ARM, MEL placards, field report remarks.
  - RPA: airline name, aircraft line suffix (e.g. `E75L=/SAT/NEW ACARS`), max ramp weight, MEL/NEF and CDL lists.

## Adding a format

Each format is one file in `js/formats/` that registers itself:

```js
(function (root) {
  const def = {
    id: 'myairline',                 // used in the dropdown, file name and test runner
    name: 'My Airline OFP',
    description: 'One-line description shown in the app',
    settingsGroup: 'myairline',      // optional: shows <fieldset data-format="myairline"> in Settings
    format(ofp, settings) {          // ofp = SimBrief JSON (json=v2)
      return [
        { id: 'release', title: 'Release', text: '...monospaced text...' },
        { id: 'navlog', title: 'Nav Log', text: '...', newPage: true },
      ];
    },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = def;
  else root.OFPFormats.register(def);
})(typeof window !== 'undefined' ? window : this);
```

Then add `<script src="js/formats/myairline.js"></script>` to `index.html` after `registry.js`. Any format-specific settings go in a `<fieldset data-format="myairline">` in the Settings panel; their values are passed in `settings` by `name`.

`js/formats/common.js` (`OFPCommon`) has shared helpers: SimBrief v1/v2 normalisation (`base()`), time/date formatting, padding, wrapping, lat/long, wind/temperature interpolation, max payload, crew-name styles, runway pairing, and `b()` for bold text. Load it in `index.html` before your format, and in Node use `require('./common.js')` (see `rpa.js`).

Bump the `?v=` number on the script and stylesheet links in `index.html` with each release so browsers pick up the new files.

## Development

Plain HTML/CSS/JS, no build step. Serve the folder locally (e.g. `python3 -m http.server`) or open it through GitHub Pages.

```
node test/render.js                              # PSA format, BTV–PHL sample
node test/render.js --format rpa                 # RPA format, IAD–PHL sample
node test/render.js path/to/simbrief.json --format rpa
```

For flight simulation use only. Not for real-world navigation or dispatch.

### Mission+ (iPad EFB)

Renders as an iPad screen instead of a printout. **Dashboard** page: flight ID (callsign/fleet #), ops type, route timeline (origin, destination, primary alternate) with STD/STA in Z and local, scheduled block, flight time, time to alternate, landing window, T/O and landing weights, block fuel, fuel at TOC, min T/O fuel, plan landing fuel, min landing fuel at destination (reserve + alternate), available delay fuel, NOTAM counts (origin / enroute + alternate / destination), tap-to-expand METAR/TAF tiles, release, crew and aircraft status. Copy / .txt give a plain-text summary.

**Nav Log** page (tap the Nav Log tab in the device or the toolbar): origin row plus every SimBrief fix with ETA = planned OFF time + cumulative time (airport row = planned OFF), TCUM, planned fuel remaining (PRMG, klb), planned FL (cruise/TOC/TOD), and leg data between fixes (airway — blank hexagon for SID/STAR legs — distance, time, fuel to nearest 100 lb, Mach). FIR boundaries are marked when SimBrief supplies FIR ids. Up/down buttons page through the list.

Entries work like the real app and are saved in your browser per flight:
- **ATA** (hhmm, shown as hh:mm): a typed time shows in blue; a time filled by a position source shows in green. A pill underneath shows ATA − ETA (green when early/on time, amber when late). The airport row's ATA is the actual OFF time.
- **RETA** at each fix = latest ATA at an earlier fix + planned time from that fix (a fix's own ATA doesn't change its own RETA); revised RETAs are green. The header's destination RETA moves with the revised arrival.
- **ARMG** (klb, always manual) shows in blue with a pill of ARMG − PRMG (green at/above plan, amber below).
- **AFL** shows in blue. Invalid entries are outlined red.
- Position-source hook: `paper.mpSetAta(rowIndex, date)` fills an empty ATA as a GPS (green) time — ready for a sim / VATSIM position feed.
