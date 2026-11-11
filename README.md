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

## Settings

- **General** (all formats): kg → lbs conversion, callsign override, fleet numbers, type designation overrides.
- **Format-specific** settings appear only when that format is selected (e.g. PSA: employee numbers, dispatcher phone, ACARS header lines, BOW ARM, max bags, MEL placards).

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

`js/formats/psa.js` has helpers worth reusing: SimBrief v1/v2 normalisation, time/date parsing, lat/long, wind and temperature formatting, wind interpolation, and NOTAM Q-code categories.

## Development

Plain HTML/CSS/JS, no build step. Serve the folder locally (e.g. `python3 -m http.server`) or open it through GitHub Pages.

```
node test/render.js                              # PSA format, BTV–PHL sample
node test/render.js path/to/simbrief.json --format psa
```

For flight simulation use only. Not for real-world navigation or dispatch.
