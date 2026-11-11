/*
 * PSA-style dispatch release formatter.
 * Input: SimBrief OFP JSON (json=v2 or json=1) + settings object.
 * Output: array of sections { id, title, text } — plain monospaced text.
 * Works in the browser (window.PSAFormat) and in Node (module.exports).
 */
(function (root) {
  'use strict';

  // ---------- generic helpers ----------
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const WIDTH = 62; // print width used for wrapped text blocks

  const asArray = (v) => (v == null || v === '' ? [] : Array.isArray(v) ? v : [v]);
  const str = (v) => (v == null || typeof v === 'object' ? '' : String(v)).trim();
  const num = (v) => {
    const n = parseFloat(str(v));
    return Number.isFinite(n) ? n : 0;
  };
  const L = (s, w) => String(s ?? '').padEnd(w).slice(0, Math.max(w, String(s ?? '').length));
  const R = (s, w) => String(s ?? '').padStart(w);
  const Z = (n, w) => String(Math.round(Math.abs(n))).padStart(w, '0');
  const up = (s) => str(s).toUpperCase();

  // Seconds from "HH:MM:SS" (v2) or a plain seconds number (v1)
  function secs(v) {
    const s = str(v);
    if (!s) return 0;
    if (s.includes(':')) {
      const p = s.split(':').map(Number);
      return (p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0);
    }
    return num(s);
  }
  // Date from ISO string (v2) or unix seconds (v1)
  function date(v) {
    const s = str(v);
    if (!s) return null;
    const d = /^\d+$/.test(s) ? new Date(Number(s) * 1000) : new Date(s);
    return isNaN(d) ? null : d;
  }
  const hhmmDot = (sec) => { const m = Math.round(sec / 60); return `${Z(Math.floor(m / 60), 2)}.${Z(m % 60, 2)}`; };
  const hhmm = (d) => (d ? `${Z(d.getUTCHours(), 2)}${Z(d.getUTCMinutes(), 2)}` : '----');
  const ddmmmyy = (d) => (d ? `${Z(d.getUTCDate(), 2)}${MONTHS[d.getUTCMonth()]}${Z(d.getUTCFullYear() % 100, 2)}` : '');
  const ddhhmm = (d) => (d ? `${Z(d.getUTCDate(), 2)}${hhmm(d)}` : '');
  const addMin = (d, m) => (d ? new Date(d.getTime() + m * 60000) : null);

  function wrap(text, width = WIDTH, indent = ' ') {
    const out = [];
    for (const para of String(text || '').toUpperCase().split(/\r?\n/)) {
      let line = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const cand = line ? `${line} ${word}` : word;
        if (cand.length > width && line) {
          out.push(line);
          line = indent + word;
        } else line = cand;
      }
      out.push(line);
    }
    return out;
  }

  // "KEY=VALUE" lines -> object (upper-cased keys)
  function parseMap(text) {
    const m = {};
    String(text || '').split(/\r?\n/).forEach((ln) => {
      const i = ln.indexOf('=');
      if (i > 0) m[ln.slice(0, i).trim().toUpperCase()] = ln.slice(i + 1).trim();
    });
    return m;
  }

  // ---------- aircraft lookups ----------
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
  // PSA-style 3-char type codes where they differ from IATA
  const PSA_TYPE = { CRJ2: 'RJ2', CRJ7: 'RJ7', CRJ9: 'RJ9', CRJX: 'RJX', CRJ1: 'RJ1' };

  // ---------- normalise SimBrief JSON ----------
  function normalise(ofp, settings) {
    const s = settings || {};
    const units = up(ofp.params?.units) || 'LBS';
    const toLbs = s.convertToLbs !== false && units.startsWith('KG');
    const W = (v) => Math.round(num(v) * (toLbs ? 2.20462 : 1));

    const g = ofp.general || {};
    const ac = ofp.aircraft || {};
    const icaoType = up(ac.icao_code || ac.icaocode || ac.base_type);
    const reg = up(ac.reg);
    const typeMap = parseMap(s.typeDesignations);
    const fleetMap = parseMap(s.fleetNumbers);
    const armMap = parseMap(s.bowArms);
    const bagMap = parseMap(s.maxBags);

    let navlog = ofp.navlog;
    if (navlog && !Array.isArray(navlog)) navlog = navlog.fix;
    navlog = asArray(navlog).map((f) => ({
      ...f,
      wind_data: asArray(f.wind_data && !Array.isArray(f.wind_data) ? f.wind_data.level : f.wind_data),
    }));

    const port = (a) => (a ? {
      icao: up(a.icao_code), code: up(a.iata_code) || up(a.faa_code) || up(a.icao_code),
      name: up(a.name), tz: num(a.timezone), rwy: up(a.plan_rwy),
      metar: str(a.metar), taf: str(a.taf), notams: asArray(a.notam),
    } : null);

    const crewFa = [...asArray(ofp.crew?.pu), ...asArray(ofp.crew?.fa)].map(str).filter(Boolean);

    const fleetDigits = (reg.match(/\d+/) || [''])[0];
    return {
      raw: ofp,
      units: toLbs ? 'LBS' : units,
      W,
      airline: up(s.callsign) || up(g.icao_airline),
      flt: up(g.flight_number),
      generated: date(ofp.params?.time_generated),
      requestId: str(ofp.params?.request_id),
      origin: port(ofp.origin),
      dest: port(ofp.destination),
      alts: asArray(ofp.alternate).map(port),
      toAlt: port(asArray(ofp.takeoff_altn)[0]),
      icaoType,
      typeCode: PSA_TYPE[icaoType] || up(ac.iata_code || ac.iatacode) || icaoType.slice(0, 3),
      designation: typeMap[icaoType] || TYPE_DESIGNATION[icaoType] || up(ac.name) || icaoType,
      engines: up(ac.engines),
      reg,
      fleet: fleetMap[reg] || str(ac.fin) || fleetDigits || reg,
      bowArm: armMap[reg] || armMap[icaoType] || '',
      maxPax: num(ac.max_passengers),
      maxBags: num(bagMap[icaoType]) || Math.round(num(ac.max_passengers) * 2),
      general: g,
      fuel: ofp.fuel || {},
      times: ofp.times || {},
      wts: ofp.weights || {},
      crew: {
        cpt: str(ofp.crew?.cpt), fo: str(ofp.crew?.fo), dx: str(ofp.crew?.dx), fa: crewFa,
      },
      atc: ofp.atc || {},
      navlog,
      tlr: ofp.tlr || null,
      weather: ofp.weather || {},
      sigmets: asArray(ofp.sigmets),
      settings: s,
    };
  }

  // ---------- name / misc formatting ----------
  function crewName(full) {
    const p = up(full).split(/\s+/).filter(Boolean);
    if (!p.length) return '';
    return p.length === 1 ? p[0] : `${p[0][0]} ${p.slice(1).join(' ')}`;
  }
  function empNo(name, given) {
    if (given) return Z(num(given), 6);
    let h = 0;
    for (const c of up(name)) h = (h * 31 + c.charCodeAt(0)) % 1000000;
    return name ? Z(h, 6) : '';
  }
  function speedProfile(p, kind) {
    // SimBrief "250/290/74" (climb) or "74/290/250" (descent) -> PSA "290/M74" / "M74/290"
    const parts = str(p).split('/').map((x) => x.trim()).filter(Boolean);
    if (parts.length < 2) return up(p);
    const isMach = (x) => /^\.?\d{2}$/.test(x) && num(x) < 100 && !x.startsWith('0');
    if (kind === 'climb') {
      const mach = parts[parts.length - 1], ias = parts[parts.length - 2];
      return isMach(mach) ? `${ias}/M${mach.replace('.', '')}` : parts.join('/');
    }
    const mach = parts[0], ias = parts[1];
    return isMach(mach) ? `M${mach.replace('.', '')}/${ias}` : parts.join('/');
  }
  function cruiseProfile(p) {
    const s = up(p);
    const m = s.match(/^CI\s*(\d+)/);
    return m ? `CI${Z(num(m[1]), 3)}` : s.replace(/\s+/g, '');
  }
  const latFmt = (v) => { const a = Math.abs(num(v)); const d = Math.floor(a); return `${num(v) < 0 ? 'S' : 'N'}${Z(d, 2)} ${((a - d) * 60).toFixed(1).padStart(4, '0')}`; };
  const lonFmt = (v) => { const a = Math.abs(num(v)); const d = Math.floor(a); return `${num(v) < 0 ? 'W' : 'E'}${Z(d, 3)} ${((a - d) * 60).toFixed(1).padStart(4, '0')}`; };
  const tempFmt = (v) => { const t = Math.round(num(v)); return `${t < 0 ? 'M' : 'P'}${Z(t, 2)}`; };
  const flFmt = (ft) => Z(Math.round(num(ft) / 1000), 2);
  function windFmt(dir, spd, spdDigits) {
    const s = Math.round(num(spd));
    const d = Math.round(num(dir)) % 360;
    return `${Z(d, 3)}${Z(s, s >= 100 ? 3 : spdDigits)}`;
  }
  function freqFmt(f) {
    const s = str(f);
    if (!s) return '';
    if (!s.includes('.')) return s;
    const n = num(s);
    return Math.abs(n * 10 - Math.round(n * 10)) < 1e-6 ? n.toFixed(1) : String(n);
  }

  // ---------- sections ----------
  function releaseSection(o) {
    const s = o.settings;
    const f = o.fuel, t = o.times, w = o.wts, W = o.W;
    const out = new Date(0);
    const sOut = date(t.sched_out) || date(t.est_out);
    const sIn = date(t.sched_in) || date(t.est_in);
    const gen = o.generated || new Date();
    const localDep = sOut ? addMin(sOut, (o.origin?.tz || 0) * 60) : null;

    const burn = W(f.enroute_burn), res = W(f.reserve), alt = W(f.alternate_burn);
    const cont = W(f.contingency), etops = W(f.etops), tanker = W(f.extra);
    const taxi = W(f.taxi), ramp = W(f.plan_ramp);
    const tof = burn + res + alt + cont + etops; // PSA T/OFUEL = minimum required (excludes tanker)
    const fob = W(f.plan_takeoff) || tof + tanker;
    const fod = W(f.plan_landing) || fob - burn;
    const bow = W(w.oew), pyld = W(w.payload), zfw = W(w.est_zfw), tow = W(w.est_tow), lgw = W(w.est_ldw);
    const mzfw = W(w.max_zfw), mtow = W(w.max_tow_struct) || W(w.max_tow), mlw = W(w.max_ldw);
    const maxFuel = W(f.max_tanks);
    const lim = [mzfw - bow, mtow - bow - fob, mlw - bow - fod].filter((x) => x > 0);
    const payld = lim.length ? Math.min(...lim) : pyld;

    const altSec = secs(o.alts[0] && asArray(o.raw.alternate)[0]?.ete);
    const tSec = { burn: secs(t.est_time_enroute), res: secs(t.reserve_time), alt: altSec, cont: secs(t.contfuel_time), etops: secs(t.etopsfuel_time) };
    const tofSec = tSec.burn + tSec.res + tSec.alt + tSec.cont + tSec.etops;

    const al = (i) => (o.alts[i] ? o.alts[i].code : '');
    const lines = [];
    lines.push(up(s.acarsAddress) || '@QU INTXSAA');
    lines.push(`.${up(s.acarsStation) || 'DAY75AA'} ${ddhhmm(gen)}`);
    lines.push('FFL');
    lines.push(`${o.flt}/${sOut ? Z(sOut.getUTCDate(), 2) : '--'}/${o.fleet}/${localDep ? hhmm(localDep) : '----'}`);
    lines.push('--');
    lines.push(`-${o.origin?.code || ''} ${o.dest?.code || ''}`);
    lines.push(`RELEASE FLIGHT   IFR ${ddmmmyy(sOut)}`);
    lines.push('TAIL   TYP FLT  ORG DST TOA AL1 AL2 PAYLD/PAX/BAG T/OFUEL RAMP');
    lines.push(L(o.fleet, 7) + L(o.typeCode, 4) + L(o.flt, 5) + L(o.origin?.code, 4) + L(o.dest?.code, 4) +
      L(o.toAlt?.code || '', 4) + L(al(0), 4) + L(al(1), 4) +
      L(`${payld}/${Z(o.maxPax, 3)}/${Z(o.maxBags, 3)}`, 14) + L(tof, 8) + ramp);
    lines.push('AC REG');
    lines.push(o.reg);
    lines.push('');
    lines.push(`DISPATCH RELEASE ${o.requestId} GENERATED AT ${hhmm(gen)} ${ddmmmyy(gen)} UTC`);
    lines.push('');
    lines.push('REMINDER - INFLIGHT AIRCRAFT IRREGULARITIES SHALL BE');
    lines.push('           COMMUNICATED AS SOON AS DUTIES PERMIT USING');
    lines.push('           /X/ VIA ACARS');
    lines.push('');
    lines.push('SUBJECT TO THE FOLLOWING CONDITIONS');
    lines.push('');
    const rmks = asArray(o.general.dx_rmk).map(up).filter(Boolean);
    (rmks.length ? rmks : ['NONE']).forEach((r) => lines.push(...wrap(r)));
    const dots = '.'.repeat(61);
    lines.push(dots);
    lines.push('BY SIGNING THIS DISPATCH RELEASE I ACKNOWLEDGE THAT THIS');
    lines.push('FLIGHT CAN BE CONDUCTED SAFELY AND IN ACCORDANCE WITH ALL');
    lines.push('APPLICABLE FARS.');
    lines.push(`ETD-${hhmm(sOut)}Z ETA-${hhmm(sIn)}Z DISPATCH DESK-${up(s.dispatchDesk) || 'DX'}`);
    lines.push(`SIGNED BY DISPATCHER ${up(o.crew.dx) || 'N/A'}`);
    lines.push(`DISPATCHER PHONE ${up(s.dispatcherPhone) || 'N/A'}`);
    lines.push(dots);
    const crewCell = (role, name, no) => (name ? L(`${role} ${crewName(name)}`, 20) + L(empNo(name, no), 11) : L(role, 31));
    lines.push((crewCell('CAPT', o.crew.cpt, s.captEmp) + crewCell('F/O', o.crew.fo, s.foEmp)).trimEnd());
    const fa = o.crew.fa;
    lines.push((crewCell('F/A', fa[0]) + crewCell('F/A', fa[1])).trimEnd());
    if (fa.length > 2) for (let i = 2; i < fa.length; i += 2) lines.push((crewCell('F/A', fa[i]) + crewCell('F/A', fa[i + 1])).trimEnd());
    lines.push(L('C/F', 31) + 'C/F');
    lines.push(dots);
    lines.push('                   DISPATCH RELEASE ACCEPTANCE');
    lines.push('I ACKNOWLEDGE RECEIPT OF THIS RELEASE AND CERTIFY THIS');
    lines.push('FLIGHT CAN BE CONDUCTED SAFELY AND THAT I MEET THE');
    lines.push('REQUIREMENTS OF 14CFR PARTS 121.439 THRU 445 AND 117.5D.');
    lines.push('I HAVE REVIEWED AND ENSURED COMPLIANCE WITH THE EFB STAR.');
    lines.push('');
    lines.push('CAPTAINS SIGNATURE ...........................................');
    lines.push('I AM IN COMPLIANCE WITH 117.5D. I HAVE REVIEWED AND ENSURED');
    lines.push('COMPLIANCE WITH THE EFB STAR.');
    lines.push('FIRST OFFICER SIGNATURE ......................................');
    lines.push(`PAX BOOKED ${Math.round(num(w.pax_count))}`);
    lines.push('FLIGHT DATE    ORG   DEST ALT1 ALT2 A/C TYPE    ENGINES   TAIL');
    lines.push(L(o.flt, 7) + L(ddmmmyy(sOut), 8) + L(o.origin?.code, 6) + L(o.dest?.code, 5) +
      L(al(0), 5) + L(al(1), 5) + L(o.designation, 12) + L(o.engines.split(/[\s/]/)[0], 10) + o.reg);
    if (o.bowArm) lines.push(R('BOW ARM', 54) + R(o.bowArm, 9));
    lines.push('');
    lines.push(`SPEED SCHEDULES CLIMB ${speedProfile(o.general.climb_profile, 'climb')}  CRUISE ${L(cruiseProfile(o.general.cruise_profile), 9)} DESCENT ${speedProfile(o.general.descent_profile, 'descent')}`);
    // fuel / weights block
    lines.push('           FUEL  TIME          PLAN   ACT STRUC  SKED    /ACT');
    const row = (lbl, fuel, sec, wl, wv, dotted, struc, sked) =>
      (L(lbl, 9) + R(fuel, 6) + ' ' + (sec == null ? '     ' : hhmmDot(sec)) + ' ' + L(wl, 4) + R(wv, 9) +
        (dotted ? '......' : '      ') + (struc === 'LIMIT' ? L('LIMIT', 6) : R(struc ?? '', 6)) + ' ' + (sked || '')).trimEnd();
    lines.push(row('BURN', burn, tSec.burn, 'BOW', bow, true, 'LIMIT'));
    lines.push(row('RESERVE', res, tSec.res, 'PYLD', pyld, true, '', `OUT ${hhmm(sOut)}. . .`));
    lines.push(row('ALT', alt, tSec.alt, 'ZFW', zfw, true, mzfw || ''));
    lines.push(row('CONTINGY', cont, tSec.cont, 'FOB', fob, true, maxFuel || '', 'OFF. . ./. . .'));
    if (etops) lines.push(row('ETOPS', etops, tSec.etops, '', '', false, ''));
    lines.push(row('T/OFUEL', tof, tofSec, 'TOW', tow, true, mtow || ''));
    lines.push(row('TANKER', tanker, secs(t.extrafuel_time), 'BURN', burn, false, '', 'ON . . ./. . .'));
    lines.push(row('TAXI', taxi, secs(t.taxi_out), 'LGW', lgw, true, mlw || ''));
    lines.push(row('RAMP', ramp, null, 'FOD', fod, false, '', `IN   ${hhmm(sIn)}. . .`));
    if (o.units !== 'LBS') lines.push(`ALL WEIGHTS IN ${o.units}`);
    return lines.join('\n');
  }

  function routeSection(o) {
    const s = o.settings, g = o.general, t = o.times;
    const lines = [];
    lines.push(`COST INDEX   ${str(g.costindex) || '---'}`);
    lines.push('');
    const wc = Math.round(num(g.avg_wind_comp));
    lines.push(`ROUTE   ${L(up(s.routeNumber) || 'R00', 3)} ${Z(num(g.route_distance), 4)}M    WIND ${wc < 0 ? 'M' : 'P'}${Z(wc, 3)} ETE ${hhmmDot(secs(t.est_time_enroute))}    TAXI IN ${hhmm(new Date(secs(t.taxi_in) * 1000))}`);
    lines.push('');
    let fpl = str(o.atc.flightplan_text);
    if (fpl) {
      fpl = fpl.replace(/^\(/, '.').replace(/\)\s*$/, '.');
      lines.push(...fpl.split(/\r?\n/).map((x) => x.toUpperCase().trimEnd()));
    } else {
      lines.push(`.FPL-${o.airline}${o.flt}-IS`);
      lines.push(`-${o.icaoType}/${up(o.raw.aircraft?.equip)}`);
      lines.push(`-${o.origin?.icao}${hhmm(date(t.sched_out))}`);
      lines.push(...wrap(`-${up(g.route)}`));
      lines.push(`-${o.dest?.icao}${hhmm(new Date(secs(t.est_time_enroute) * 1000))}.`);
    }
    lines.push('');
    const sOut = date(t.sched_out) || date(t.est_out);
    const until = addMin(sOut, 120);
    lines.push(`FLIGHT PLAN VALID FOR DEPARTURE UNTIL       ${hhmm(until)}   ${ddmmmyy(until)}`);
    lines.push('');
    lines.push('... A/C INFO ...');
    lines.push('PLACARD.......DESCRIPTION.....................................');
    const plac = String(s.placards || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    if (!plac.length) lines.push('NONE');
    plac.forEach((p) => {
      const m = p.match(/^(\S+)\s+(.*)$/);
      lines.push(m ? L(up(m[1]), 14) + up(m[2]) : up(p));
    });
    return lines.join('\n');
  }

  function navlogSection(o) {
    const nav = o.navlog;
    const W = o.W;
    const lines = [];
    lines.push('CKPT     LAT         LONG            SEG         SEG     TTL    ADBO');
    lines.push('FREQ     FL WIND     TEMP MH     MC  DIST  GS    TIME    TIME   FRMG');
    lines.push('');
    lines.push(L(o.origin?.icao, 63) + Z(W(o.fuel.plan_takeoff), 5));
    lines.push('');
    let afterTod = false;
    nav.forEach((f, i) => {
      const id = up(f.ident);
      const last = i === nav.length - 1;
      const fob = Z(W(f.fuel_plan_onboard), 5);
      if (last) {
        lines.push(L(id, 9) + L(latFmt(f.pos_lat), 12) + L(lonFmt(f.pos_long), 16) + L(Z(num(f.distance), 3), 12) +
          L(hhmmDot(secs(f.time_leg)), 8) + L(hhmmDot(secs(f.time_total)), 6) + fob);
        return;
      }
      const isToc = id === 'TOC';
      const isTod = id === 'TOD';
      const stage = up(f.stage);
      const climb = stage === 'CLB';
      const desc = afterTod || isTod || stage === 'DSC';
      const phase = climb ? 'CL' : desc ? 'DC' : '';
      const fl = phase || flFmt(f.altitude_feet);
      const showWind = !(desc && !isTod);
      const wind = showWind ? windFmt(f.wind_dir, f.wind_spd, 2) : '';
      const gs = phase || Z(num(f.groundspeed), 3);
      const next = nav[i + 1];
      const frmg = Z(W(next.fuel_leg) || W(f.fuel_plan_onboard) - W(next.fuel_plan_onboard), 5);
      lines.push(L(id, 9) + L(latFmt(f.pos_lat), 12) + L(lonFmt(f.pos_long), 13) + L('', 9) + L('...', 20) + fob);
      lines.push(L(freqFmt(f.frequency), 9) + L(fl, 3) + L(wind, 10) + L(tempFmt(f.oat), 4) + L(Z(num(f.heading_mag), 3), 7) +
        L(Z(num(f.track_mag), 3), 4) + L(Z(num(f.distance), 3), 6) + L(gs, 6) +
        L(hhmmDot(secs(f.time_leg)), 8) + L(hhmmDot(secs(f.time_total)), 6) + frmg);
      if (isTod) afterTod = true;
      void isToc;
    });
    return lines.join('\n');
  }

  // Interpolate wind at an altitude from a fix's wind_data levels (vector interpolation)
  function windAt(levels, alt) {
    const pts = levels.map((l) => ({ a: num(l.altitude), d: num(l.wind_dir), s: num(l.wind_spd) })).sort((x, y) => x.a - y.a);
    if (!pts.length) return null;
    const uv = (p) => ({ u: p.s * Math.sin((p.d * Math.PI) / 180), v: p.s * Math.cos((p.d * Math.PI) / 180) });
    let lo = pts[0], hi = pts[pts.length - 1];
    for (let i = 0; i < pts.length - 1; i++) if (pts[i].a <= alt && pts[i + 1].a >= alt) { lo = pts[i]; hi = pts[i + 1]; break; }
    if (alt <= pts[0].a) hi = lo = pts[0];
    if (alt >= pts[pts.length - 1].a) lo = hi = pts[pts.length - 1];
    if (lo.a === hi.a) return { d: Math.round(lo.d), s: Math.round(lo.s) };
    const k = (alt - lo.a) / (hi.a - lo.a);
    const a = uv(lo), b = uv(hi);
    const u = a.u + (b.u - a.u) * k, v = a.v + (b.v - a.v) * k;
    let d = Math.round((Math.atan2(u, v) * 180) / Math.PI);
    if (d <= 0) d += 360;
    return { d: d % 360 || 360, s: Math.round(Math.hypot(u, v)) };
  }

  function spotWindSection(o) {
    const nav = o.navlog;
    if (!nav.length || !nav.some((f) => f.wind_data.length)) return '';
    const cruiseAlts = nav.filter((f) => up(f.stage) === 'CRZ' && up(f.ident) !== 'TOD').map((f) => num(f.altitude_feet));
    const initAlt = num(o.general.initial_altitude) || cruiseAlts[0] || 0;
    const plannedAt = (i) => {
      const f = nav[i];
      if (up(f.stage) === 'CRZ' && up(f.ident) !== 'TOD') return num(f.altitude_feet);
      if (up(f.stage) === 'CLB') return initAlt;
      for (let j = i; j >= 0; j--) if (up(nav[j].stage) === 'CRZ') return num(nav[j].altitude_feet);
      return initAlt;
    };
    const cell = (levels, alt) => {
      const w = windAt(levels, alt);
      return w ? `${L(flFmt(alt), 2)} ${windFmt(w.d, w.s, 3)}` : '         ';
    };
    const lines = [];
    lines.push('                   ENROUTE SPOT WIND SUMMARY');
    lines.push('        HIGHER    PLANNED   LOWER LEVELS        FL100');
    lines.push('TO      FL WIND   FL WIND   FL WIND   FL WIND   WIND');
    const rows = [{ id: o.origin?.icao, levels: nav[0].wind_data, alt: plannedAt(0) }];
    nav.forEach((f, i) => {
      const id = up(f.ident);
      if (i === nav.length - 1 || id === 'TOC' || id === 'TOD' || !f.wind_data.length) return;
      rows.push({ id, levels: f.wind_data, alt: plannedAt(i) });
    });
    rows.forEach((r) => {
      const fl100 = windAt(r.levels, 10000);
      lines.push(L(r.id, 8) + [r.alt + 2000, r.alt, r.alt - 2000, r.alt - 4000].map((a) => cell(r.levels, a)).join(' ') +
        ' ' + (fl100 ? windFmt(fl100.d, fl100.s, 3) : ''));
    });
    return lines.join('\n');
  }

  function tlrSection(o) {
    const tlr = o.tlr;
    const sOut = date(o.times.sched_out);
    const gen = o.generated || new Date();
    const W = o.W;
    const h = (v) => (str(v) ? Math.round(W(v) / 100) : '');
    const two = (v) => (str(v) ? Z(num(v) % 100, 2) : '--');
    const lines = [];
    lines.push(`TAKEOFF AND LANDING REPORT ${o.airline} ${o.flt} ${o.origin?.code}-${o.dest?.code} ${ddmmmyy(sOut)}`);
    lines.push(`TLR-1 SEQ-${o.requestId} ${ddmmmyy(gen)} ${hhmm(gen)}Z`);
    lines.push(`A/C ${o.fleet} ${o.designation} ${o.engines}`);
    lines.push('');
    const to = tlr?.takeoff, ld = tlr?.landing;
    // ---- takeoff
    lines.push('/// TAKEOFF DATA ///');
    lines.push('APT PRWY POAT PWIND  PQNH  PMRTW FLP MAXV1 PTOW MFPTW');
    if (to?.conditions) {
      const c = to.conditions;
      const rwys = asArray(to.runway);
      const pr = rwys.find((r) => up(r.identifier) === up(c.planned_runway)) || rwys[0] || {};
      const mfptw = W(o.wts.max_ldw) + W(o.fuel.enroute_burn);
      lines.push(L(o.origin?.code, 4) + L(up(c.planned_runway), 5) + L(num(c.temperature).toFixed(1), 5) +
        L(windFmt(c.wind_direction, c.wind_speed, 3), 7) + L(str(c.altimeter), 6) + L(h(pr.max_weight), 6) +
        L(str(pr.flap_setting), 4) + L(str(pr.speeds_v1), 6) + L(h(c.planned_weight), 5) + mfptw);
      lines.push('RMKS NONE');
      lines.push('----------------------- ACARS RUNWAYS -----------------------');
      lines.push('RWY             LENGTH PMTOW EFP NOTES');
      rwys.forEach((r) => lines.push(L(up(r.identifier), 16) + R(Math.round(num(r.length)), 6) + ' ' + R(h(r.max_weight), 5)));
      lines.push(`---------------------- ${up(c.surface_condition) || 'DRY'} RWY - PTOW -----------------------`);
      lines.push('RWY  MTOW MT CONFIG                   N1  FL V1 VR V2 VT');
      rwys.forEach((r) => {
        const thr = up(r.thrust_setting).startsWith('FLEX') || up(r.thrust_setting).startsWith('D') ? 'FLX' : 'FUL';
        const bl = up(r.bleed_setting) === 'OFF' ? 'BLCL' : 'BLOP';
        const ai = up(r.anti_ice_setting) === 'ON' ? 'EAI' : '';
        const cfg = `${thr} RLG ${bl} ${ai}`.trim();
        lines.push(L(up(r.identifier), 5) + R(h(r.max_weight), 4) + ' ' + R(str(r.flex_temperature) || '--', 2) + ' ' +
          L(cfg, 21) + R('--.-', 6) + ' ' + R(str(r.flap_setting), 3) + ' ' + [r.speeds_v1, r.speeds_vr, r.speeds_v2, r.speeds_other].map(two).join(' '));
      });
    } else {
      lines.push(`${L(o.origin?.code, 4)}${L(o.origin?.rwy, 5)}`);
      lines.push('RMKS TLR NOT AVAILABLE FOR THIS AIRCRAFT TYPE');
    }
    lines.push('');
    // ---- landing
    lines.push('/// LANDING DATA ///');
    lines.push('APT PRWY POAT PWIND  PQNH  PMRLW FLP PLDW');
    if (ld?.conditions) {
      const c = ld.conditions;
      const rwys = asArray(ld.runway);
      const pr = rwys.find((r) => up(r.identifier) === up(c.planned_runway)) || rwys[0] || {};
      lines.push(L(o.dest?.code, 4) + L(up(c.planned_runway), 5) + L(num(c.temperature).toFixed(1), 5) +
        L(windFmt(c.wind_direction, c.wind_speed, 3), 7) + L(str(c.altimeter), 6) + L(h(pr.max_weight_dry), 6) +
        L(up(c.flap_setting), 4) + h(c.planned_weight));
      lines.push('RMKS NONE');
      lines.push('----------------------- ACARS RUNWAYS -----------------------');
      lines.push('RWY             LENGTH MRLW-DRY MRLW-WET');
      rwys.forEach((r) => lines.push(L(up(r.identifier), 16) + R(Math.round(num(r.length)), 6) + ' ' + R(h(r.max_weight_dry), 8) + ' ' + R(h(r.max_weight_wet), 8)));
      const dists = [['DRY', ld.distance_dry], ['WET', ld.distance_wet]].filter(([, d]) => d);
      if (dists.length) {
        lines.push(`------- MIN LDG DIST - FLAPS ${up(c.flap_setting)} - THR REV CREDIT ${up(dists[0][1].reverser_credit) === 'YES' ? 'YES' : 'NO'} -------`);
        lines.push('COND  LDW VREF  ACTUAL FACTORED');
        dists.forEach(([k, d]) => lines.push(L(k, 5) + R(h(d.weight), 4) + ' ' + R(str(d.speeds_vref), 4) + ' ' + R(Math.round(num(d.actual_distance)), 7) + ' ' + R(Math.round(num(d.factored_distance)), 8)));
      }
    } else {
      lines.push(`${L(o.dest?.code, 4)}${L(o.dest?.rwy, 5)}`);
      lines.push('RMKS TLR NOT AVAILABLE FOR THIS AIRCRAFT TYPE');
    }
    lines.push(`END TAKEOFF AND LANDING REPORT ${o.airline} ${o.flt} ${o.origin?.code}-${o.dest?.code} ${ddmmmyy(sOut)}`);
    return lines.join('\n');
  }

  function weatherSection(o) {
    const sOut = date(o.times.sched_out);
    const sIn = date(o.times.sched_in);
    const lines = [];
    const altCodes = o.alts.map((a) => a.code).join(' ') || 'N/R';
    lines.push(`WXM-FLT ${o.flt}/${sOut ? Z(sOut.getUTCDate(), 2) : '--'} ${o.origin?.code} ${o.dest?.code} RTE ALT ${altCodes} TOA ${ddhhmm(o.generated)}`);
    lines.push(`SKD ${hhmm(sOut)}/${hhmm(sIn)}Z`);
    lines.push(' MAP FEATURES ');
    lines.push(' NONE ');
    const ports = [o.origin, o.dest, ...o.alts].filter(Boolean);
    const seen = new Set();
    ports.forEach((p) => {
      if (seen.has(p.icao)) return;
      seen.add(p.icao);
      lines.push(p.code);
      if (p.metar) lines.push(...wrap(p.metar.replace(/\s+/g, ' '), WIDTH - 1).map((x) => ' ' + x.trimStart()));
      else lines.push(' METAR NOT AVAILABLE');
    });
    const sig = o.sigmets.map((x) => (typeof x === 'string' ? x : str(x.text) || str(x.raw) || str(x.sigmet_text))).filter(Boolean);
    if (sig.length) {
      lines.push('SIGMETS');
      sig.forEach((x) => { lines.push(...wrap(x, WIDTH - 1).map((y) => ' ' + y.trimStart())); lines.push(' '); });
    } else {
      ['TRMNL', 'CAT', 'TSTM', 'VASH', 'ICING'].forEach((k) => { lines.push(`${k} SIGMEC`); lines.push(' NONE ISSUED'); });
    }
    seen.clear();
    ports.forEach((p) => {
      if (seen.has(p.icao) || !p.taf) return;
      seen.add(p.icao);
      const tafLines = p.taf.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      tafLines.forEach((tl, i) => {
        const wrapped = wrap(tl, WIDTH - 5, ' ');
        wrapped.forEach((wl, j) => lines.push(i === 0 && j === 0 ? `${p.code} TAF ${wl}` : ` ${wl.trim()}`));
      });
    });
    return lines.join('\n');
  }

  // NOTAM grouping by ICAO Q-code
  const NOTAM_ORDER = ['AIRPORT', 'RUNWAY', 'APPROACH AND LANDING', 'ARRIVAL PROCEDURES', 'DEPARTURE PROCEDURES',
    'TAXIWAY', 'OBSTACLE', 'NAVAID', 'COMMUNICATION', 'AIRSPACE', 'OTHER'];
  function notamCategory(n) {
    if (n.notam_is_obstacle === true || n.notam_is_obstacle === '1') return 'OBSTACLE';
    const q = up(n.notam_qcode).replace(/^Q/, '');
    const a = q[0], b = q.slice(0, 2);
    const txt = up(n.notam_text);
    if (b === 'MR' || b === 'MD' || b === 'MT' || b === 'MU' || b === 'MW') return 'RUNWAY';
    if (b === 'MX' || b === 'MY' || b === 'MK') return 'TAXIWAY';
    if (a === 'M') return 'AIRPORT';
    if (a === 'L') {
      if (b === 'LA' || b === 'LB' || /\bALS\b/.test(txt)) return 'APPROACH AND LANDING';
      if (b === 'LX' || b === 'LY' || /\bTWY\b/.test(txt) && !/\bRWY\b/.test(txt)) return 'TAXIWAY';
      return 'RUNWAY';
    }
    if (a === 'I' || b === 'PI' || b === 'PK') return 'APPROACH AND LANDING';
    if (b === 'PA' || b === 'PE') return 'ARRIVAL PROCEDURES';
    if (b === 'PD') return 'DEPARTURE PROCEDURES';
    if (a === 'O') return 'OBSTACLE';
    if (a === 'N' || a === 'G') return 'NAVAID';
    if (a === 'C' || a === 'S') return 'COMMUNICATION';
    if (a === 'A' || a === 'R' || a === 'W' || a === 'P') return 'AIRSPACE';
    if (a === 'F') return 'AIRPORT';
    // no Q-code: keyword fallback
    if (/^RWY|\bRWY\b/.test(txt)) return 'RUNWAY';
    if (/^TWY|\bTWY\b/.test(txt)) return 'TAXIWAY';
    if (/\b(ILS|RNAV|LOC|IAP|VOR-|GPS)\b/.test(txt)) return 'APPROACH AND LANDING';
    if (/\b(CRANE|OBST|TOWER)\b/.test(txt)) return 'OBSTACLE';
    return a ? 'OTHER' : 'AIRPORT';
  }
  function notamDate(v, estimated) {
    const d = date(v);
    if (!d) return 'UFN';
    if (d.getUTCFullYear() >= 2090) return 'PERM';
    const s = `${ddmmmyy(d)}/${hhmm(d)}`;
    return estimated === true || estimated === '1' ? `${s}EST` : s;
  }

  function notamSection(o) {
    const lines = ['NOTAMS'];
    const ports = [o.origin, o.dest, ...o.alts].filter(Boolean);
    const seen = new Set();
    ports.forEach((p) => {
      if (seen.has(p.icao)) return;
      seen.add(p.icao);
      lines.push(`${p.code} NO/ `);
      lines.push('------------------------------------------------------');
      lines.push(` - ${p.icao}/${p.code} - ${p.name}`);
      lines.push('-----------------------------------------------------/');
      if (!p.notams.length) { lines.push(' NONE'); return; }
      const groups = {};
      p.notams.forEach((n) => { (groups[notamCategory(n)] ||= []).push(n); });
      NOTAM_ORDER.filter((k) => groups[k]).forEach((k) => {
        lines.push(`--------- ${k} ---------`);
        groups[k].forEach((n) => {
          const text = str(n.notam_text) || str(n.notam_raw);
          lines.push(...wrap('-' + text.replace(/\s+/g, ' ')));
          const exp = n.date_expire_is_estimated === true && date(n.date_expire)?.getUTCFullYear() >= 2090 ? 'UFN' : notamDate(n.date_expire, n.date_expire_is_estimated);
          lines.push(` ${notamDate(n.date_effective)} ${exp} ${up(n.location_icao) || p.icao} ${up(n.notam_id)} `);
        });
      });
    });
    lines.push(' END DATA');
    return lines.join('\n');
  }

  function format(ofp, settings) {
    if (!ofp || typeof ofp !== 'object') throw new Error('No flight plan data');
    if (ofp.fetch && ofp.fetch.status && !/success/i.test(ofp.fetch.status)) throw new Error(`SimBrief: ${ofp.fetch.status}`);
    const o = normalise(ofp, settings);
    const sec = [
      { id: 'release', title: 'Dispatch Release', text: releaseSection(o) },
      { id: 'route', title: 'Route & FPL', text: routeSection(o), newPage: true },
      { id: 'navlog', title: 'Nav Log', text: navlogSection(o) },
      { id: 'winds', title: 'Spot Winds', text: spotWindSection(o) },
      { id: 'tlr', title: 'TLR', text: tlrSection(o), newPage: true },
      { id: 'wx', title: 'Weather', text: weatherSection(o), newPage: true },
      { id: 'notams', title: 'NOTAMs', text: notamSection(o) },
    ];
    return sec.filter((s) => s.text);
  }

  const api = { format, normalise, _internal: { windAt, speedProfile, cruiseProfile, crewName, notamCategory, latFmt, lonFmt } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PSAFormat = api;
})(typeof window !== 'undefined' ? window : this);
