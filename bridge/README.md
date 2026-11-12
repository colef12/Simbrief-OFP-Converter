# SimConnect bridge

Feeds your Microsoft Flight Simulator (2020 / 2024) position to the converter's **Mission+ Auto ATA**, so ATAs fill in automatically as you cross each fix — on any network, VATSIM or not.

## Use

1. Download **simbridge.exe** from the [Releases page](../../releases/tag/simbridge) (built automatically by GitHub Actions).
2. Run it. Leave the window open while you fly; it connects to the sim when the sim starts and reconnects if it restarts.
3. In the converter: Mission+ → Nav Log → Auto ATA → **SimConnect** → **ON**.

The status line shows `SimConnect · 420 kt · FL350 · 0s ago` when it's working.

- It reads latitude, longitude, altitude, ground speed and on-ground once a second through SimConnect.
- It serves them only to this computer at `http://127.0.0.1:47800/position` (CORS + Private Network Access headers so the github.io page can read it).
- Chrome/Edge may ask once to allow the site to access devices on your local network — allow it.
- Windows SmartScreen may warn because the exe isn't code-signed: **More info → Run anyway**.

## Options

```
simbridge.exe --demo        # no sim needed: fakes a KBTV -> KPHL flight to test the page
simbridge.exe --port 47801  # different port
```

## Run from source

```
pip install -r bridge/requirements.txt
python bridge/simbridge.py
```

Uses the [SimConnect](https://pypi.org/project/SimConnect/) Python package, which bundles `SimConnect.dll`.
