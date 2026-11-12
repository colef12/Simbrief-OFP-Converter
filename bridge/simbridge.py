"""
SimBrief OFP Converter - SimConnect bridge

Reads your aircraft position from Microsoft Flight Simulator (2020 / 2024) through
SimConnect and serves it on THIS computer only, for the converter page's Auto ATA:

    http://127.0.0.1:47800/position

Run it any time (before or after starting the sim); it reconnects on its own.
Close the window (or Ctrl+C) to stop.

Options:
    --port N     use a different port (default 47800; also change it on the page)
    --demo       no simulator needed: fakes a flight BTV -> PHL for testing
"""
import argparse
import json
import math
import sys
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VERSION = "1.0.0"
DEFAULT_PORT = 47800

_lock = threading.Lock()
_state = {"connected": False, "source": "simconnect", "error": "starting", "position": None}


def _set(**kw):
    with _lock:
        _state.update(kw)


def _snapshot():
    with _lock:
        return json.loads(json.dumps(_state))


def _now_iso():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


# ---------------------------------------------------------------- SimConnect reader
def simconnect_loop(interval=1.0):
    try:
        from SimConnect import SimConnect, AircraftRequests  # pip package "SimConnect"
    except Exception as exc:  # pragma: no cover - only on a broken install
        _set(connected=False, error=f"SimConnect library missing: {exc}")
        return

    while True:
        sm = None
        try:
            sm = SimConnect()
            aq = AircraftRequests(sm, _time=200)
            print("[bridge] connected to the simulator")
            _set(connected=True, error=None)
            misses = 0
            while True:
                lat = aq.get("PLANE_LATITUDE")
                lon = aq.get("PLANE_LONGITUDE")
                alt = aq.get("PLANE_ALTITUDE")
                gs = aq.get("GROUND_VELOCITY")
                on_ground = aq.get("SIM_ON_GROUND")
                if lat is None or lon is None:
                    misses += 1
                    if misses > 10:
                        raise RuntimeError("simulator stopped answering")
                else:
                    misses = 0
                    _set(connected=True, error=None, position={
                        "lat": round(float(lat), 6),
                        "lon": round(float(lon), 6),
                        "alt": round(float(alt or 0)),
                        "gs": round(float(gs or 0)),
                        "onGround": bool(on_ground),
                        "t": _now_iso(),
                    })
                time.sleep(interval)
        except Exception as exc:
            msg = str(exc) or exc.__class__.__name__
            if _snapshot().get("connected"):
                print(f"[bridge] lost the simulator ({msg}); retrying...")
            _set(connected=False, error="waiting for the simulator", position=None)
            try:
                if sm is not None:
                    sm.exit()
            except Exception:
                pass
            time.sleep(5)


# ---------------------------------------------------------------- demo (no sim)
def demo_loop(interval=1.0):
    """Fly a straight line KBTV -> KPHL at 420 kt, 10x speed, after a 20 s ground roll."""
    a, b = (44.4719, -73.1533), (39.8719, -75.2411)
    dist_nm = 60 * math.hypot(b[0] - a[0], (b[1] - a[1]) * math.cos(math.radians((a[0] + b[0]) / 2)))
    start = time.time()
    _set(connected=True, error=None, source="demo")
    print(f"[bridge] DEMO flight KBTV -> KPHL ({dist_nm:.0f} NM)")
    while True:
        el = time.time() - start
        if el < 20:
            k, gs, alt, ground = 0.0, 0, 335, True
        else:
            k = min(1.0, ((el - 20) * 10 * 420 / 3600) / dist_nm)
            gs, ground = (420, False) if k < 1 else (0, True)
            alt = 335 + (26000 - 335) * min(1.0, k * 6, (1 - k) * 6) if k < 1 else 36
        _set(position={
            "lat": round(a[0] + (b[0] - a[0]) * k, 6),
            "lon": round(a[1] + (b[1] - a[1]) * k, 6),
            "alt": round(alt), "gs": gs, "onGround": ground, "t": _now_iso(),
        })
        time.sleep(interval)


# ---------------------------------------------------------------- HTTP (localhost only)
class Handler(BaseHTTPRequestHandler):
    server_version = f"SimBridge/{VERSION}"

    def _headers(self, code=200, ctype="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        # the converter page lives on github.io; allow it (and any page) to read this
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        # Chrome Private/Local Network Access preflight
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.end_headers()

    def do_OPTIONS(self):  # noqa: N802
        self._headers(204)

    def do_GET(self):  # noqa: N802
        if self.path.startswith("/position"):
            body = dict(_snapshot(), version=VERSION, server_time=_now_iso())
            self._headers(200)
            self.wfile.write(json.dumps(body).encode())
        elif self.path in ("/", "/index.html"):
            s = _snapshot()
            p = s.get("position") or {}
            text = (f"SimBrief OFP Converter - SimConnect bridge {VERSION}\n"
                    f"simulator: {'connected' if s['connected'] else s.get('error')}\n"
                    f"position: {p}\n\nThe converter reads /position from this computer only.\n")
            self._headers(200, "text/plain; charset=utf-8")
            self.wfile.write(text.encode())
        else:
            self._headers(404)
            self.wfile.write(b'{"error":"not found"}')

    def log_message(self, *args):  # keep the console quiet
        pass


def main(argv=None):
    ap = argparse.ArgumentParser(description="SimConnect position bridge for the SimBrief OFP Converter")
    ap.add_argument("--port", type=int, default=DEFAULT_PORT)
    ap.add_argument("--demo", action="store_true", help="fake a flight without a simulator")
    args = ap.parse_args(argv)

    loop = demo_loop if args.demo else simconnect_loop
    threading.Thread(target=loop, daemon=True).start()

    httpd = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"SimBrief OFP Converter - SimConnect bridge {VERSION}")
    print(f"Serving http://127.0.0.1:{args.port}/position  (this computer only)")
    print("Leave this window open while you fly. Ctrl+C to stop.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[bridge] stopped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
