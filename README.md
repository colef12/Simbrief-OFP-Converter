# SimBrief → PSA OFP Converter

Pulls your latest generated [SimBrief](https://www.simbrief.com) flight plan and reformats it as a PSA Airlines–style dispatch release (OFP), the way it printed off ACARS.

**Live app:** https://colef12.github.io/Simbrief-OFP-Converter/

## Use

1. Generate a flight on SimBrief.
2. Enter your SimBrief **username** or **Pilot ID** (Account → Pilot ID) and click **Fetch latest OFP**. Your ID is remembered in your browser.
3. Print / save as PDF, copy, or download as .txt.

No login or password is needed. SimBrief's public API returns your most recently generated plan for that ID.

## What's on the release

| Section | Source |
|---|---|
| ACARS header, release line (TAIL/TYP/FLT/PAYLD/PAX/BAG/T/OFUEL/RAMP) | SimBrief general, aircraft, fuel, weights |
| Dispatch release, crew block, acceptance | SimBrief crew + Settings |
| Fuel / time / weights / STRUC / SKED block | SimBrief fuel, times, weights |
| Route line, ICAO FPL, valid-until (ETD + 2h) | SimBrief general, atc |
| A/C info (MEL placards) | Settings (manual) |
| Nav log (ADBO = fuel remaining, FRMG = burn to next fix) | SimBrief navlog |
| Enroute spot wind summary | SimBrief navlog wind data (interpolated) |
| TLR takeoff/landing data | SimBrief TLR, when available for the aircraft type |
| WX (METAR/TAF/SIGMET) | SimBrief weather |
| NOTAMs grouped by category | SimBrief airport NOTAMs (by ICAO Q-code) |

### PSA conventions applied
- **T/OFUEL** = burn + reserve + alternate + contingency (minimum legal fuel; tanker listed separately).
- **FOB** = T/OFUEL + tanker. **RAMP** = FOB + taxi. **FOD** = FOB − burn.
- **PAYLD** (release line) = max allowable payload = min(MZFW − BOW, MTOW − BOW − FOB, MLW − BOW − FOD).
- **PAX/BAG** = seat / bag capacity.
- Weights convert to lbs automatically if your SimBrief plan is in kg (toggle in Settings).

## Settings
Saved in your browser only: employee numbers, dispatcher phone, fleet numbers, BOW ARM, max bags, type designation overrides, MEL placards, ACARS header lines.

## Development
Plain HTML/CSS/JS, no build step.

```
node test/render.js                      # render the BTV–PHL sample
node test/render.js path/to/simbrief.json
```

For flight simulation use only.
