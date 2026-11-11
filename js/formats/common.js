/*
 * Shared helpers for OFP formats. Browser: window.OFPCommon. Node: module.exports.
 * Load after registry.js and before format files that use it.
 *
 * Bold: wrap text in C.b('TEXT') to render it bold in the app; markers are
 * zero-width for padding purposes only if you pad BEFORE wrapping, and are
 * stripped from copy / .txt output.
 */
(function (root) {
  'use strict';

  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const B_ON = '\u0002', B_OFF = '\u0003';

  const asArray = (v) => (v == null || v === '' ? [] : Array.isArray(v) ? v : [v]);
  const str = (v) => (v == null || typeof v === 'object' ? '' : String(v)).trim();
  const num = (v) => { const n = parseFloat(str(v)); return Number.isFinite(n) ? n : 0; };
  const up = (s) => str(s).toUpperCase();
  const L = (s, w) => String(s ?? '').padEnd(w);
  const R = (s, w) => String(s ?? '').padStart(w);
  const Z = (n, w) => String(Math.round(Math.abs(n))).padStart(w, '0');
  const b = (s) => `${B_ON}${s}${B_OFF}`;
  const stripBold = (s) => String(s).replace(/[\u0002\u0003]/g, '');

  function secs(v) {
    const s = str(v);
    if (!s) return 0;
    if (s.includes(':')) { const p = s.split(':').map(Number); return (p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0); }
    return num(s);
  }
  function date(v) {
    const s = str(v);
    if (!s) return null;
    const d = /^\d+$/.test(s) ? new Date(Number(s) * 1000) : new Date(s);
    return isNaN(d) ? null : d;
  }
  const mins = (sec) => Math.round(sec / 60);
  const hDotMm = (sec) => { const m = mins(sec); return `${Z(Math.floor(m / 60), 2)}.${Z(m % 60, 2)}`; };
  const hColonMm = (sec) => { const m = mins(sec); return `${Math.floor(m / 60)}:${Z(m % 60, 2)}`; };
  const hhColonMm = (sec) => { const m = mins(sec); return `${Z(Math.floor(m / 60), 2)}:${Z(m % 60, 2)}`; };
  const hhmm = (d) => (d ? `${Z(d.getUTCHours(), 2)}${Z(d.getUTCMinutes(), 2)}` : '----');
  const ddmmmyy = (d) => (d ? `${Z(d.getUTCDate(), 2)}${MONTHS[d.getUTCMonth()]}${Z(d.getUTCFullYear() % 100, 2)}` : '');
  const addMin = (d, m) => (d ? new Date(d.getTime() + m * 60000) : null);

  function wrap(text, width, indent = '') {
    const out = [];
    for (const para of String(text || '').toUpperCase().split(/\r?\n/)) {
      let line = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const cand = line ? `${line} ${word}` : word;
        if (cand.length > width && line) { out.push(line); line = indent + word; } else line = cand;
      }
      out.push(line);
    }
    return out;
  }
  function parseMap(text) {
    const m = {};
    String(text || '').split(/\r?\n/).forEach((ln) => {
      const i = ln.indexOf('=');
      if (i > 0) m[ln.slice(0, i).trim().toUpperCase()] = ln.slice(i + 1).trim();
    });
    return m;
  }
  const lines = (text) => String(text || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

  const TYPE_DESIGNATION = {
    CRJ1: 'CL600-2B19', CRJ2: 'CL600-2B19', CRJ7: 'CL600-2C10', CRJ9: 'CL600-2D24', CRJX: 'CL600-2E25',
    E170: 'ERJ 170-100', E75L: 'ERJ 170-200', E75S: 'ERJ 170-200', E190: 'ERJ 190-100', E195: 'ERJ 190-200',
    E290: 'ERJ 190-300', E295: 'ERJ 190-400', E135: 'EMB-135', E145: 'EMB-145LR', DH8D: 'DHC-8-402',
    B712: '717-200', MD88: 'MD-88', MD90: 'MD-90-30',
    B737: '737-700', B738: '737-800', B739: '737-900ER', B37M: '737-7', B38M: '737-8', B39M: '737-9',
    B752: '757-200', B753: '757-300', B763: '767-300ER', B764: '767-400ER',
    B772: '777-200ER', B77L: '777-200LR', B77W: '777-300ER', B788: '787-8', B789: '787-9', B78X: '787-10',
    A319: 'A319-100', A320: 'A320-200', A321: 'A321-200', A19N: 'A319NEO', A20N: 'A320NEO', A21N: 'A321NEO',
    BCS1: 'BD-500-1A10', BCS3: 'BD-500-1A11', A332: 'A330-200', A333: 'A330-300', A339: 'A330-900',
    A359: 'A350-900', A35K: 'A350-1000', A388: 'A380-800', B744: '747-400', B748: '747-8',
  };

  // Common, format-neutral view of a SimBrief OFP (json=v2 or json=1)
  function base(ofp, s = {}) {
    const units = up(ofp.params?.units) || 'LBS';
    const toLbs = s.convertToLbs !== false && units.startsWith('KG');
    const W = (v) => Math.round(num(v) * (toLbs ? 2.20462 : 1));
    const g = ofp.general || {};
    const ac = ofp.aircraft || {};
    const icaoType = up(ac.icao_code || ac.icaocode || ac.base_type);
    const reg = up(ac.reg);
    const typeMap = parseMap(s.typeDesignations);
    const fleetMap = parseMap(s.fleetNumbers);
    const bagMap = parseMap(s.maxBags);

    let navlog = ofp.navlog;
    if (navlog && !Array.isArray(navlog)) navlog = navlog.fix;
    navlog = asArray(navlog).map((f) => ({
      ...f,
      wind_data: asArray(f.wind_data && !Array.isArray(f.wind_data) ? f.wind_data.level : f.wind_data),
    }));
    const port = (a) => (a ? {
      icao: up(a.icao_code), iata: up(a.iata_code), code: up(a.iata_code) || up(a.faa_code) || up(a.icao_code),
      name: up(a.name), tz: num(a.timezone), rwy: up(a.plan_rwy), elev: num(a.elevation),
      metar: str(a.metar), taf: str(a.taf), notams: asArray(a.notam), raw: a,
    } : null);
    const fleetDigits = (reg.match(/\d+/) || [''])[0];
    return {
      raw: ofp, settings: s, W, units: toLbs ? 'LBS' : units,
      airline: up(s.callsign) || up(g.icao_airline),
      flt: up(g.flight_number),
      callsign: up(ofp.atc?.callsign) || `${up(s.callsign) || up(g.icao_airline)}${up(g.flight_number)}`,
      generated: date(ofp.params?.time_generated),
      requestId: str(ofp.params?.request_id),
      release: str(g.release) || '1',
      origin: port(ofp.origin), dest: port(ofp.destination),
      alts: asArray(ofp.alternate).map(port), toAlt: port(asArray(ofp.takeoff_altn)[0]),
      icaoType, reg,
      designation: typeMap[icaoType] || TYPE_DESIGNATION[icaoType] || up(ac.name) || icaoType,
      acName: up(ac.name) || icaoType,
      engines: up(ac.engines),
      fleet: fleetMap[reg] || str(ac.fin) || fleetDigits || reg,
      maxPax: num(ac.max_passengers),
      maxBags: num(bagMap[icaoType]) || Math.round(num(ac.max_passengers) * 2),
      general: g, fuel: ofp.fuel || {}, times: ofp.times || {}, wts: ofp.weights || {},
      crew: {
        cpt: str(ofp.crew?.cpt), fo: str(ofp.crew?.fo), dx: str(ofp.crew?.dx),
        fa: [...asArray(ofp.crew?.pu), ...asArray(ofp.crew?.fa)].map(str).filter(Boolean),
      },
      atc: ofp.atc || {}, navlog, tlr: ofp.tlr || null, weather: ofp.weather || {}, sigmets: asArray(ofp.sigmets),
    };
  }

  // Max allowable payload = min(MZFW−BOW, MTOW−BOW−TOF, MLW−BOW−FOD)
  function maxPayload(o, { mtow, tof, fod } = {}) {
    const W = o.W, w = o.wts;
    const bow = W(w.oew);
    const lim = [W(w.max_zfw) - bow, (mtow ?? W(w.max_tow)) - bow - (tof ?? W(o.fuel.plan_takeoff)),
      W(w.max_ldw) - bow - (fod ?? W(o.fuel.plan_landing))].filter((x) => x > 0);
    return lim.length ? Math.min(...lim) : W(w.payload);
  }

  function empNo(name, given) {
    if (given) return Z(num(given), 6);
    let h = 0;
    for (const c of up(name)) h = (h * 31 + c.charCodeAt(0)) % 1000000;
    return name ? Z(h, 6) : '';
  }
  const nameInitialLast = (full) => { const p = up(full).split(/\s+/).filter(Boolean); return p.length > 1 ? `${p[0][0]} ${p.slice(1).join(' ')}` : (p[0] || ''); };
  const nameLastFirst = (full) => { const p = up(full).split(/\s+/).filter(Boolean); return p.length > 1 ? `${p.slice(1).join(' ')} ${p[0]}` : (p[0] || ''); };

  function speedProfile(p, kind) {
    const parts = str(p).split('/').map((x) => x.trim()).filter(Boolean);
    if (parts.length < 2) return up(p);
    const isMach = (x) => /^\.?\d{2}$/.test(x) && !x.startsWith('0');
    if (kind === 'climb') {
      const mach = parts[parts.length - 1], ias = parts[parts.length - 2];
      return isMach(mach) ? `${ias}/M${mach.replace('.', '')}` : parts.join('/');
    }
    const mach = parts[0], ias = parts[1];
    return isMach(mach) ? `M${mach.replace('.', '')}/${ias}` : parts.join('/');
  }

  const latFmt = (v) => { const a = Math.abs(num(v)); const d = Math.floor(a); return `${num(v) < 0 ? 'S' : 'N'}${Z(d, 2)} ${((a - d) * 60).toFixed(1).padStart(4, '0')}`; };
  const lonFmt = (v) => { const a = Math.abs(num(v)); const d = Math.floor(a); return `${num(v) < 0 ? 'W' : 'E'}${Z(d, 3)} ${((a - d) * 60).toFixed(1).padStart(4, '0')}`; };
  const pm = (v, w = 2) => { const t = Math.round(num(v)); return `${t < 0 ? 'M' : 'P'}${Z(t, w)}`; };
  const flOf = (ft) => Math.round(num(ft) / 100);

  // Interpolate wind (vector) and OAT at an altitude from a fix's wind_data levels
  function windAt(levels, alt) {
    const pts = levels.map((l) => ({ a: num(l.altitude), d: num(l.wind_dir), s: num(l.wind_spd), t: num(l.oat) })).sort((x, y) => x.a - y.a);
    if (!pts.length) return null;
    let lo = pts[0], hi = pts[pts.length - 1];
    if (alt <= pts[0].a) hi = lo;
    else if (alt >= hi.a) lo = hi;
    else for (let i = 0; i < pts.length - 1; i++) if (pts[i].a <= alt && pts[i + 1].a >= alt) { lo = pts[i]; hi = pts[i + 1]; break; }
    if (lo.a === hi.a) return { d: Math.round(lo.d) % 360 || 360, s: Math.round(lo.s), t: Math.round(lo.t) };
    const k = (alt - lo.a) / (hi.a - lo.a);
    const uv = (p) => ({ u: p.s * Math.sin((p.d * Math.PI) / 180), v: p.s * Math.cos((p.d * Math.PI) / 180) });
    const A = uv(lo), Bv = uv(hi);
    const u = A.u + (Bv.u - A.u) * k, v = A.v + (Bv.v - A.v) * k;
    let d = Math.round((Math.atan2(u, v) * 180) / Math.PI);
    if (d <= 0) d += 360;
    return { d: d % 360 || 360, s: Math.round(Math.hypot(u, v)), t: Math.round(lo.t + (hi.t - lo.t) * k) };
  }

  // Pair runway ends into "01L/19R" style strips with a length
  function runwayStrips(rwys) {
    const ends = rwys.map((r) => ({ id: up(r.identifier).replace(/^RW?Y?/, ''), len: Math.round(num(r.length)) }))
      .filter((r) => /^\d{2}[LRC]?$/.test(r.id));
    const recip = (id) => {
      const n = ((parseInt(id, 10) + 17) % 36) + 1;
      const side = id.slice(2);
      return `${Z(n, 2)}${side === 'L' ? 'R' : side === 'R' ? 'L' : side}`;
    };
    const used = new Set(), out = [];
    ends.sort((a, b) => a.id.localeCompare(b.id)).forEach((e) => {
      if (used.has(e.id)) return;
      const r = recip(e.id);
      const other = ends.find((x) => x.id === r);
      used.add(e.id);
      if (other) used.add(r);
      out.push({ name: other ? `${e.id}/${r}` : e.id, len: Math.max(e.len, other?.len || 0) });
    });
    return out;
  }

  const api = {
    MONTHS, asArray, str, num, up, L, R, Z, b, stripBold, secs, date, mins, hDotMm, hColonMm, hhColonMm, hhmm, ddmmmyy,
    addMin, wrap, parseMap, lines, TYPE_DESIGNATION, base, maxPayload, empNo, nameInitialLast, nameLastFirst,
    speedProfile, latFmt, lonFmt, pm, flOf, windAt, runwayStrips,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OFPCommon = api;
})(typeof window !== 'undefined' ? window : this);
