/*
 * Format: Republic Airways (RPA) flight brief / dispatch release (Navtech style).
 * Sections: release, ATC FPL + nav log, enroute winds + contingency route summary,
 * TLR, departure/arrival weather, NOTAMs.
 */
(function (root) {
  'use strict';
  const C = typeof module !== 'undefined' && module.exports ? require('./common.js') : root.OFPCommon;
  const { L, R, Z, b, up, str, num, asArray, secs, date, hColonMm, hhColonMm, hDotMm, hhmm, ddmmmyy, wrap, parseMap, pm, flOf, windAt } = C;

  const WIDTH = 80;
  const RULE = '_'.repeat(WIDTH);
  const center = (s, w = 74) => ' '.repeat(Math.max(0, Math.floor((w - s.length) / 2))) + s;
  const blanks = '______ ______';

  // "ATA | EXP | POS | DESCRIPTION" lines
  function itemRows(text) {
    return C.lines(text).map((ln) => {
      const p = ln.split('|').map((x) => x.trim());
      if (p.length < 2) return L('', 38) + up(ln);
      return L(up(p[0]), 13) + L(up(p[1] || '-------'), 13) + L(up(p[2] || ''), 12) + up(p.slice(3).join(' ') || '');
    });
  }

  function prep(ofp, s) {
    const o = C.base(ofp, s);
    const W = o.W, f = o.fuel, t = o.times, w = o.wts;
    o.n = {
      burn: W(f.enroute_burn), res: W(f.reserve), hold: W(f.contingency) + W(f.etops), alt: W(f.alternate_burn),
      extra: W(f.extra), taxi: W(f.taxi), ramp: W(f.plan_ramp), fod: W(f.plan_landing), tof: W(f.plan_takeoff),
      mel: 0, ballast: 0,
    };
    o.n.min = o.n.burn + o.n.res + o.n.hold + o.n.alt + o.n.mel;
    if (!o.n.ramp) o.n.ramp = o.n.min + o.n.taxi + o.n.extra;
    if (!o.n.tof) o.n.tof = o.n.ramp - o.n.taxi;
    if (!o.n.fod) o.n.fod = o.n.tof - o.n.burn;
    const holdSec = secs(t.contfuel_time) + secs(t.etopsfuel_time);
    const flow = holdSec && o.n.hold ? o.n.hold / holdSec : (secs(t.reserve_time) ? o.n.res / secs(t.reserve_time) : 0);
    o.tm = {
      burn: secs(t.est_time_enroute), res: secs(t.reserve_time), hold: holdSec,
      alt: secs(asArray(ofp.alternate)[0]?.ete), extra: secs(t.extrafuel_time) || (flow ? o.n.extra / flow : 0),
      taxi: secs(t.taxi_out) + secs(t.taxi_in),
    };
    o.tm.min = o.tm.burn + o.tm.res + o.tm.hold + o.tm.alt;
    o.tm.ramp = o.tm.min + o.tm.taxi + o.tm.extra;
    o.tm.fod = flow ? o.n.fod / flow : 0;
    const rampMap = parseMap(s.maxRamp);
    o.wt = {
      zfw: W(w.est_zfw), tow: W(w.est_tow), lgw: W(w.est_ldw),
      mzfw: W(w.max_zfw), mtowFlp: W(w.max_tow), mtowStruct: W(w.max_tow_struct) || W(w.max_tow), mlw: W(w.max_ldw),
    };
    o.wt.ramp = W(w.est_ramp) || o.wt.zfw + o.n.ramp;
    o.wt.mrampStruct = num(rampMap[o.icaoType]) || num(rampMap[o.reg]) || o.wt.mtowStruct + o.n.taxi;
    o.wt.mrampFlp = o.wt.mrampStruct;
    o.sOut = date(t.sched_out) || date(t.est_out);
    o.sIn = date(t.sched_in) || date(t.est_in);
    o.eOut = date(t.est_out) || o.sOut;
    o.eIn = date(t.est_in) || o.sIn;
    return o;
  }

  // ---------- page 1: release ----------
  function releaseSection(o) {
    const s = o.settings, n = o.n, tm = o.tm, wt = o.wt, w = o.wts, W = o.W;
    const airline = up(s.airlineName) || 'REPUBLIC AIRWAYS';
    const out = [];
    out.push(b(center(`${airline} ${o.flt}`)));
    out.push(b(center('IFR PART 121')));
    out.push(b(center(`RELEASE NO. ${o.release}`)));
    out.push('');
    out.push(b(L('CREW', 7) + L('EE#', 16) + 'NAME#'));
    const crewRow = (role, name, no) => L(`${role}:`, 7) + L(C.empNo(name, no), 16) + C.nameLastFirst(name);
    if (o.crew.cpt) out.push(crewRow('CA', o.crew.cpt, s.captEmp));
    if (o.crew.fo) out.push(crewRow('FO', o.crew.fo, s.foEmp));
    o.crew.fa.forEach((fa) => out.push(crewRow('FA', fa)));
    out.push('');
    out.push(`FLIGHT ${o.flt}//${o.origin?.icao}-${o.dest?.icao}//ETE ${hhColonMm(tm.burn)}`);
    const sfx = parseMap(s.acSuffix);
    out.push(b(`${o.reg} ${o.designation}${sfx[o.reg] || sfx[o.icaoType] || ''}`));
    out.push('', '', '');
    const maxPay = C.maxPayload(o, { mtow: wt.mtowFlp, tof: n.tof, fod: n.fod });
    const pv = (lbl, v) => L(lbl, 9) + R(v, 5);
    out.push(L('', 44) + b(L('PLANNED', 25) + 'ESTIMATED MAX'));
    out.push(b(L(L('AUTHORIZED DATE/TIME:', 22) + `${ddmmmyy(o.sOut)} ${hhmm(o.sOut)}Z`, 44)) + L(pv('PAYLOAD:', W(w.payload)), 25) + pv('PAYLOAD:', maxPay));
    out.push(L('SKED DEP DATE/TIME:', 22) + L(`${ddmmmyy(o.sOut)} ${hhmm(o.sOut)}Z`, 22) + L(pv('PAX:', Math.round(num(w.pax_count))), 25) + pv('PAX:', o.maxPax));
    out.push(L('SKED ARR DATE/TIME:', 22) + L(`${ddmmmyy(o.sIn)} ${hhmm(o.sIn)}Z`, 22) + L(pv('BAGS:', Math.round(num(w.bag_count))), 25) + pv('BAGS:', o.maxBags));
    out.push('');
    out.push(RULE);
    out.push('');
    const alt = (i) => o.alts[i]?.icao || '';
    out.push(b(L(`FMS PERF INIT (ATC FLIGHT ID: ${o.callsign})`, 43) + L('DEP', 7) + L('DEST', 7) + L('ALT1', 8) + L('ALT2', 8) + 'T/O ALT'));
    out.push(b(L('SPEEDS', 43)) + L(o.origin?.icao, 7) + L(o.dest?.icao, 7) + L(alt(0), 8) + L(alt(1), 8) + (o.toAlt?.icao || ''));
    out.push(b('  -CLIMB   ') + ' ' + C.speedProfile(o.general.climb_profile, 'climb'));
    out.push(b('  -CRUISE  ') + ' ' + up(o.general.cruise_profile));
    out.push(b('  -DESCENT ') + C.speedProfile(o.general.descent_profile, 'descent'));
    out.push('');
    const g = o.general;
    const dev = Math.round(num(g.avg_temp_dev));
    out.push(`${b('CRZ ALT/WIND(ISA DEV)')} FL${Z(flOf(g.initial_altitude), 3)} ${Z(num(g.avg_wind_dir), 3)}/${Z(num(g.avg_wind_spd), 3)} (${dev < 0 ? '-' : '+'}${Z(dev, 2)})`);
    out.push(`${b('ROUTE')} // TOTAL DISTANCE: ${Z(num(g.route_distance), 4)}NM`);
    out.push(...wrap(`${o.origin?.icao} ${up(g.route).replace(/^DCT\s+/, '')} ${o.dest?.icao}`, WIDTH));
    out.push('');
    out.push(RULE);
    // fuel block
    const fr = (lbl, v, sec) => L(lbl, 13) + R(v, 4) + ' ' + L(sec == null ? '' : hColonMm(sec), 4);
    const mr = (lbl, v, sec) => L(lbl, 9) + R(v, 4) + ' ' + L(sec == null ? '' : hColonMm(sec), 4);
    const gap1 = '       ', gap2 = '        ';
    const wrow = (lbl, p, m, st) => L(lbl, 6) + L(p, 8) + L(m, 9) + st;
    out.push(L('', 13) + 'FUEL TIME' + L('', 16) + 'FUEL TIME' + L('', 8) + `ETD ${o.origin?.icao} ${ddmmmyy(o.eOut)} ${hhmm(o.eOut)}Z`);
    out.push(fr('BURN', n.burn, tm.burn) + gap1 + mr('MIN', n.min, tm.min) + gap2 + `ETA ${o.dest?.icao} ${ddmmmyy(o.eIn)} ${hhmm(o.eIn)}Z`);
    out.push(fr('RESERVE', n.res, tm.res) + gap1 + mr('TAXI', n.taxi, tm.taxi));
    out.push(fr('HOLD', n.hold, tm.hold) + gap1 + mr('EXTRA', n.extra, tm.extra) + gap2 + b(L('PLANNED', 14) + L('MAX FLP', 9) + 'STRUC'));
    out.push(fr('ALT', n.alt, tm.alt) + gap1 + b(mr('RAMP', n.ramp, tm.ramp)) + gap2 + wrow('RAMP:', wt.ramp, wt.mrampFlp, wt.mrampStruct));
    out.push(fr('BALLAST', n.ballast, null) + gap1 + L('', 18) + gap2 + wrow('ZFW:', wt.zfw, wt.mzfw, wt.mzfw));
    out.push(fr('MEL', n.mel, 0) + gap1 + mr('FOD', n.fod, tm.fod) + gap2 + L('TOW:', 6) + b(L(wt.tow, 8) + L(wt.mtowFlp, 9)) + wt.mtowStruct);
    out.push(b(fr('MIN', n.min, tm.min)) + gap1 + L('  FUEL OPTION 2', 18) + gap2 + wrow('LGW:', wt.lgw, wt.mlw, wt.mlw));
    if (o.units !== 'LBS') out.push(`ALL WEIGHTS IN ${o.units}`);
    out.push('', '', '');
    out.push(RULE);
    out.push(b(L('', 38) + 'MEL/NEF'));
    out.push(b(L('ATA#', 13) + L('EXPIRATION', 11) + L('POSITION', 12) + 'DESCRIPTION'));
    out.push(...itemRows(s.melList));
    out.push('');
    out.push(b(L('', 40) + 'CDL'));
    out.push(b(L('ATA#', 13) + L('EXPIRATION', 13) + L('POSITION', 12) + 'DESCRIPTION'));
    out.push(...itemRows(s.cdlList));
    out.push('');
    out.push(b('REMARKS:'));
    asArray(g.dx_rmk).map(up).filter((r) => r && r !== 'NONE').forEach((r) => out.push(...wrap(r, WIDTH)));
    out.push('');
    out.push(`GENERATED ${ddmmmyy(o.generated)} ${hhmm(o.generated)}Z`);
    out.push(`DISPATCHER ${up(o.crew.dx) || 'N/A'}${s.dispatchDesk ? ` DESK ${up(s.dispatchDesk)}` : ''}`);
    out.push('');
    out.push('I CERTIFY THAT I AM FIT FOR DUTY PRIOR TO COMMENCING THIS FLIGHT PER 14 CFR');
    out.push('117.5 AND I AM AFFIRMING THAT THIS FLIGHT CAN BE CONDUCTED SAFELY PER 14 CFR');
    out.push('121.663.');
    return out.join('\n');
  }

  // ---------- page 2: ATC FPL + nav log ----------
  function navlogSection(o) {
    const W = o.W, nav = o.navlog, n = o.n;
    const out = [];
    out.push(b('*SIGNATURES ARE RECORDED AND RETAINED PER THE ELECTRONIC COMPLIANCE MANUAL*'));
    out.push(RULE);
    out.push(b('ATC FLIGHT PLAN'));
    const fpl = str(o.atc.flightplan_text);
    if (fpl) out.push(...fpl.split(/\r?\n/).map((x) => x.toUpperCase().trimEnd()));
    out.push(RULE);
    const H = (cols) => cols.reduce((acc, [pos, txt]) => L(acc, pos) + txt, '');
    out.push(b(H([[0, 'WPT'], [8, 'ALT'], [15, 'WIND'], [20, 'TEMP'], [26, 'COURSE'], [36, 'SPEED'], [42, 'DIST'], [48, 'TIME'], [54, 'FUEL'], [60, 'ACTUAL'], [67, 'DIFF'], [73, 'MIN RQD']])));
    out.push(b(H([[8, 'FL'], [15, 'DIR'], [20, 'OAT'], [26, 'MAG HDG'], [36, 'IAS'], [42, 'LEG'], [48, 'LEG'], [54, 'LEG']])));
    out.push(b(H([[8, 'AIRWAY'], [15, 'SPD'], [20, 'ISA'], [26, 'MAG CRS'], [36, 'MACH'], [42, 'TOTAL'], [48, 'TOTAL'], [54, 'TOTAL']])));
    out.push(b(H([[8, 'MORA'], [15, 'EDR'], [36, 'TAS'], [42, 'REM'], [48, 'REM'], [54, 'REM']])));
    out.push(RULE);
    out.push(L(o.origin?.icao, 58) + R(n.min, 22));
    out.push(o.origin?.rwy || '');
    out.push(RULE);
    const ete = o.tm.burn;
    const dist = num(o.general.route_distance) || nav.reduce((a, f) => a + num(f.distance), 0);
    let cumDist = 0;
    nav.forEach((f) => {
      cumDist += num(f.distance);
      const stage = up(f.stage);
      const ph = stage === 'CLB' ? 'CLB' : stage === 'DSC' ? 'DSC' : '';
      const fl = ph || Z(flOf(f.altitude_feet), 3);
      const used = W(f.fuel_totalused) || (n.tof - W(f.fuel_plan_onboard));
      const rem = Math.max(0, n.burn - used);
      const tTot = secs(f.time_total);
      const mach = num(f.mach) ? `M${Z(Math.round(num(f.mach) * 100), 2)}` : '';
      const l1 = L(up(f.ident), 8) + L(fl, 7) + L(Z(num(f.wind_dir), 3), 5) + L(ph || pm(f.oat), 6) + L(Z(num(f.heading_mag), 3), 10) +
        L(ph || Z(num(f.ind_airspeed), 3), 6) + L(Z(num(f.distance), 3), 6) + L(hColonMm(secs(f.time_leg)), 6) + Z(W(f.fuel_leg), 4);
      out.push(l1 + R(rem + n.res + n.alt, WIDTH - l1.length));
      out.push(L('', 8) + L(up(f.via_airway).slice(0, 6), 7) + L(Z(num(f.wind_spd), 3), 5) + L(ph || pm(f.oat_isa_dev), 6) + L(Z(num(f.track_mag), 3), 10) +
        L(ph || mach, 6) + L(Z(cumDist, 3), 6) + L(hColonMm(tTot), 6) + L(Z(used, 4), 4) + '    ' + blanks);
      out.push(L('', 8) + L(str(f.mora), 7) + L('', 21) + L(Z(num(f.true_airspeed), 3), 6) + L(Z(Math.max(0, dist - cumDist), 3), 6) +
        L(hColonMm(Math.max(0, ete - tTot)), 6) + R(rem, 4) + '    ' + blanks);
      out.push(RULE);
    });
    out.push(L(o.dest?.icao, 58) + R(n.res + n.hold + n.alt, 22));
    out.push(o.dest?.rwy || '');
    return out.join('\n');
  }

  // ---------- page 3: enroute winds + contingency route summary ----------
  function windsSection(o) {
    const nav = o.navlog, n = o.n, W = o.W;
    const out = [];
    out.push(b(L('', 23) + 'ENROUTE WIND DATA'));
    out.push('');
    out.push(b('CRUISE WINDS'));
    out.push(b(L('WAYPOINT', 9) + L('FL-4000FT', 19) + L('FL-2000FT', 19) + L('FL PLAN', 24) + 'FL+4000FT'));
    const cell = (lv, alt) => { const x = windAt(lv, alt); return x ? `FL${flOf(alt)} ${Z(x.d, 3)}/${Z(x.s, 3)} ${pm(x.t)}` : ''; };
    const cruise = nav.filter((f) => up(f.stage) === 'CRZ' && !/^TO[CD]$/.test(up(f.ident)) && f.wind_data.length);
    if (!cruise.length) out.push('NO CRUISE WIND DATA');
    cruise.forEach((f) => {
      const a = num(f.altitude_feet);
      out.push(L(up(f.ident), 9) + L(cell(f.wind_data, a - 4000), 19) + L(cell(f.wind_data, a - 2000), 19) + L(cell(f.wind_data, a), 24) + cell(f.wind_data, a + 4000));
    });
    out.push('');
    out.push(b('CONTINGENCY ROUTE SUMMARY'));
    out.push(b(L('RTE', 17) + L('FL', 6) + L('WIND', 12) + L('ETE', 9) + L('BURN', 9) + L('MIN', 9) + L('RAMP', 11) + L('PYLD', 13) + 'LGW'));
    out.push('');
    const g = o.general;
    out.push(L('R1', 17) + L(Z(flOf(g.initial_altitude), 3), 6) + L(`${Z(num(g.avg_wind_dir), 3)}/${Z(num(g.avg_wind_spd), 3)}`, 11) +
      L(hDotMm(o.tm.burn), 9) + L(n.burn, 10) + L(n.min, 9) + L(n.ramp, 11) + L(W(o.wts.payload), 13) + o.wt.lgw);
    out.push(...wrap(`${o.origin?.icao} ${up(g.route).replace(/^DCT\s+/, '')} ${o.dest?.icao}`, WIDTH));
    out.push('DISPATCHER INITIALS:________________ TIME:__________');
    return out.join('\n');
  }

  // NOTAM ids that mention a runway
  function rwyNotams(notams, id) {
    const base = id.split('/')[0];
    const re = new RegExp(`\\bRWY\\s*(\\d{2}[LRC]?/)?${base}(/\\d{2}[LRC]?)?\\b`);
    return notams.filter((x) => re.test(up(x.notam_text))).map((x) => up(x.notam_id));
  }
  function notesCol(ids, prefix, col, width) {
    if (!ids.length) return [prefix.trimEnd()];
    const words = ['NOTAMS', ...ids];
    const rows = [];
    let line = '';
    words.forEach((wd) => { if ((line + ' ' + wd).trim().length > width && line) { rows.push(line); line = wd; } else line = line ? `${line} ${wd}` : wd; });
    rows.push(line);
    return rows.map((r, i) => (i === 0 ? prefix : ' '.repeat(col)) + r);
  }

  // ---------- page 4: TLR ----------
  function tlrSection(o) {
    const W = o.W, t10 = (v) => (str(v) ? Math.floor(W(v) / 10) : '');
    const two = (v) => (str(v) ? Z(num(v) % 100, 2) : '--');
    const windM = (d, sp) => `${Z(num(d), 3)}M${Z(num(sp), 2)}`;
    const out = [];
    const route = `${o.origin?.icao}-${o.dest?.icao}`;
    out.push(`TAKEOFF AND LANDING REPORT ${o.airline} ${o.flt} ${route} ${ddmmmyy(o.sOut)}`);
    out.push(`TLR-${o.release} SEQ-${o.requestId} ${ddmmmyy(o.generated)} ${hhmm(o.generated)}Z`);
    out.push(`A/C ${o.reg} ${o.designation} ${o.engines}`);
    out.push('', '/// TAKEOFF DATA ///', '');
    out.push(L('APT PRWY', 15) + L('POAT', 5) + L('PWIND', 7) + L('PQNH', 6) + L('PMRTW', 6) + L('FL', 3) + 'V1 VR V2 ' + L('PTOW', 5) + 'MFPTW');
    const to = o.tlr?.takeoff, ld = o.tlr?.landing;
    if (to?.conditions) {
      const c = to.conditions, rwys = asArray(to.runway);
      const pr = rwys.find((r) => up(r.identifier) === up(c.planned_runway)) || rwys[0] || {};
      const mfptw = Math.floor((W(o.wts.max_ldw) + o.n.burn) / 10);
      out.push(L(`${o.origin?.icao} ${up(c.planned_runway)}`, 15) + L(num(c.temperature).toFixed(1), 5) + L(windM(c.wind_direction, c.wind_speed), 7) +
        L(str(c.altimeter), 6) + L(t10(pr.max_weight), 6) + L(str(pr.flap_setting), 3) + [pr.speeds_v1, pr.speeds_vr, pr.speeds_v2].map(two).join(' ') + ' ' +
        L(t10(c.planned_weight), 5) + mfptw);
      out.push('', 'RMKS NONE', '', '');
      out.push('----------------------- ACARS RUNWAYS -----------------------');
      out.push(L('RWY', 13) + L('ACARS', 6) + L('LENGTH', 7) + L('PMTOW', 6) + L('EFP', 9) + 'NOTES');
      rwys.forEach((r) => {
        const pre = L(up(r.identifier), 20) + R(Math.round(num(r.length)), 6) + ' ' + L(t10(r.max_weight), 5) + L('', 9);
        out.push(...notesCol(rwyNotams(o.origin?.notams || [], up(r.identifier)), pre, 41, 24));
      });
    } else {
      out.push(L(`${o.origin?.icao} ${o.origin?.rwy}`, 15));
      out.push('', 'RMKS TLR NOT AVAILABLE FOR THIS AIRCRAFT TYPE');
    }
    out.push('', '', '/// LANDING DATA ///', '');
    out.push(L('APT PRWY', 17) + L('POAT', 5) + L('PWIND', 7) + L('PQNH', 6) + L('PMRLW', 6) + L('FLP', 4) + 'PLDW');
    if (ld?.conditions) {
      const c = ld.conditions, rwys = asArray(ld.runway);
      const pr = rwys.find((r) => up(r.identifier) === up(c.planned_runway)) || rwys[0] || {};
      out.push(L(`${o.dest?.icao} ${up(c.planned_runway)}`, 17) + L(num(c.temperature).toFixed(1), 5) + L(windM(c.wind_direction, c.wind_speed), 7) +
        L(str(c.altimeter), 6) + L(t10(pr.max_weight_dry), 6) + L(up(c.flap_setting), 4) + t10(c.planned_weight));
      out.push('', 'RMKS NONE', '');
      out.push('------ --- ------ ----- ------ --- ----- --- ----------------');
      out.push('RWY    OAT WIND   QNH   MRLW   FLP VREF PWR CONFIG/CONDITION');
      out.push('');
      out.push('----------------------- ACARS RUNWAYS -----------------------');
      out.push(L('RWY', 13) + L('ACARS', 6) + L('LENGTH', 7) + 'NOTES');
      rwys.forEach((r) => {
        const pre = L(up(r.identifier), 20) + R(Math.round(num(r.length)), 6) + ' ';
        out.push(...notesCol(rwyNotams(o.dest?.notams || [], up(r.identifier)), pre, 27, 32));
      });
    } else {
      out.push(L(`${o.dest?.icao} ${o.dest?.rwy}`, 17));
      out.push('', 'RMKS TLR NOT AVAILABLE FOR THIS AIRCRAFT TYPE');
    }
    out.push('', '');
    out.push(`END TAKEOFF AND LANDING REPORT ${o.airline} ${o.flt} ${route} ${ddmmmyy(o.sOut)}`);
    return out.join('\n');
  }

  // ---------- page 5: weather ----------
  function weatherSection(o) {
    const out = [];
    const tlrRwys = (which) => asArray(o.tlr?.[which]?.runway);
    const block = (title, p, rwys) => {
      if (!p) return;
      out.push(b(title));
      const ends = rwys.map((r) => ({ id: up(r.identifier), len: Math.round(num(r.length)) }))
        .filter((r) => /^\d{2}[LRC]?$/.test(r.id)).sort((a, c) => a.id.localeCompare(c.id));
      const head = L(`${p.icao} ${p.iata || ''}`, 10);
      if (!ends.length) out.push(head.trimEnd());
      for (let i = 0; i < ends.length; i += 3) {
        out.push((i === 0 ? head : L('', 10)) + ends.slice(i, i + 3).map((e) => L(`RWY${e.id}`, 10) + L(`${e.len}FT`, 10)).join('').trimEnd());
      }
      out.push('');
      if (p.metar) wrap(`METAR ${p.metar.replace(/^METAR\s+/i, '')}`, 70, '  ').forEach((x) => out.push(x));
      else out.push('METAR NOT AVAILABLE');
      out.push('');
      if (p.taf) {
        const tl = p.taf.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
        tl.forEach((x, i) => wrap(i === 0 ? `TAF ${x.replace(/^TAF\s+/i, '')}` : x, 68, '  ').forEach((y) => out.push(i === 0 && !y.startsWith(' ') ? y : `  ${y.trim()}`)));
      }
      out.push('', '');
    };
    block('DEPARTURE', o.origin, tlrRwys('takeoff'));
    block('ARRIVAL', o.dest, tlrRwys('landing'));
    o.alts.forEach((a, i) => block(o.alts.length > 1 ? `ALTERNATE ${i + 1}` : 'ALTERNATE', a, []));
    const sig = o.sigmets.map((x) => (typeof x === 'string' ? x : str(x.text) || str(x.raw) || str(x.sigmet_text))).filter(Boolean);
    if (sig.length) sig.forEach((x) => { out.push(...wrap(x, 76, '  ')); out.push(''); });
    else out.push('NO SIGMET REPORTS FOUND WITHIN TIME SPECIFIED');
    out.push('NO AIRMET REPORTS FOUND WITHIN TIME SPECIFIED');
    return out.join('\n');
  }

  // ---------- pages 6+: NOTAMs ----------
  const SUBJECT_ORDER = ['RUNWAY', 'TAXIWAY(S)', 'APRON', 'APPROACH LIGHT SYSTEM', 'PRECISION APPROACH PATH INDICATOR',
    'TAXIWAY CENTRELINE LIGHTS', 'TAXIWAY EDGE LIGHTS', 'INSTRUMENT LANDING SYSTEM', 'INSTRUMENT APPROACH PROCEDURE',
    'STANDARD INSTRUMENT ARRIVAL (STAR)', 'STANDARD INSTRUMENT DEPARTURE (SID)', 'OBSTACLE', 'UNCATEGORISED'];
  function subjectOf(x) {
    let sub = up(x.notam_qcode_subject);
    if (x.notam_is_obstacle === true || x.notam_is_obstacle === '1') sub = 'OBSTACLE';
    if (sub === 'TAXIWAY') sub = 'TAXIWAY(S)';
    return sub || 'UNCATEGORISED';
  }
  function notamSection(o) {
    const out = [];
    const ports = [o.origin, o.dest, ...o.alts].filter(Boolean);
    const gen = o.generated || new Date();
    out.push(`           ${o.origin?.icao} (${o.origin?.name}) - ${o.dest?.icao} (${o.dest?.name})`);
    out.push('');
    out.push(`Briefing generated: ${ddmmmyy(gen)} ${hhmm(gen)}    (All times in UTC unless otherwise stated)` + L('', 10) + `FLT ${o.callsign}`);
    out.push(b('NTM No:    Eff from:Eff to:   Description:'));
    out.push(b('GENERAL'));
    out.push(L('', 30) + 'NO GENERAL COMPANY NOTAMS/DOCS FOR THIS FLIGHT');
    out.push('');
    const firs = { [o.origin?.icao]: up(o.atc.fir_orig), [o.dest?.icao]: up(o.atc.fir_dest) };
    const seen = new Set();
    ports.forEach((p) => {
      if (seen.has(p.icao)) return;
      seen.add(p.icao);
      out.push(b(`${p.name} (${p.icao}${p.iata ? `/${p.iata}` : ''})${firs[p.icao] ? ` FIR (${firs[p.icao]})` : ''}`));
      if (p.elev) out.push(L('', 30) + `ELEV. ${Math.round(p.elev)}FT`);
      const rw = [...asArray(o.tlr?.takeoff?.conditions?.airport_icao === p.raw?.icao_code ? o.tlr.takeoff.runway : []),
        ...asArray(o.tlr?.landing?.conditions?.airport_icao === p.raw?.icao_code ? o.tlr.landing.runway : [])];
      C.runwayStrips(rw).forEach((r) => out.push(L('', 30) + `RWY ${r.name} - ${r.len}FT`));
      out.push('');
      if (!p.notams.length) { out.push(L('', 30) + 'NO NOTAMS'); out.push(''); return; }
      const groups = {};
      p.notams.forEach((x) => { (groups[subjectOf(x)] ||= []).push(x); });
      const keys = Object.keys(groups).sort((a, c) => {
        const ia = SUBJECT_ORDER.indexOf(a), ic = SUBJECT_ORDER.indexOf(c);
        return (ia < 0 ? 50 : ia) - (ic < 0 ? 50 : ic) || a.localeCompare(c);
      });
      keys.forEach((k) => {
        out.push(L('', 30) + b(k));
        groups[k].forEach((x) => {
          const eff = date(x.date_effective), exp = date(x.date_expire);
          const perm = !exp || exp.getUTCFullYear() >= 2090 || ((x.date_expire_is_estimated === true || x.date_expire_is_estimated === '1') && !exp);
          const text = wrap((str(x.notam_text) || str(x.notam_raw)).replace(/\s+/g, ' '), 66);
          out.push(L(up(x.notam_id), 11) + L(ddmmmyy(eff), 8) + L(perm ? 'UFN' : ddmmmyy(exp), 8) + (text[0] || ''));
          out.push((L('', 11) + L(eff ? hhmm(eff) : '', 8) + L(perm ? '' : hhmm(exp), 8) + (text[1] || '')).trimEnd());
          text.slice(2).forEach((t) => out.push(L('', 27) + t));
          out.push('');
        });
      });
    });
    return out.join('\n');
  }

  function format(ofp, settings) {
    if (!ofp || typeof ofp !== 'object') throw new Error('No flight plan data');
    if (ofp.fetch && ofp.fetch.status && !/success/i.test(ofp.fetch.status)) throw new Error(`SimBrief: ${ofp.fetch.status}`);
    const o = prep(ofp, settings || {});
    const tidy = (t) => t.split('\n').map((x) => x.replace(/\s+$/, '').replace(/\s+(\u0003)$/, '$1')).join('\n');
    return [
      { id: 'release', title: 'Release', text: tidy(releaseSection(o)) },
      { id: 'navlog', title: 'FPL & Nav Log', text: tidy(navlogSection(o)), newPage: true },
      { id: 'winds', title: 'Winds', text: tidy(windsSection(o)), newPage: true },
      { id: 'tlr', title: 'TLR', text: tidy(tlrSection(o)), newPage: true },
      { id: 'wx', title: 'Weather', text: tidy(weatherSection(o)), newPage: true },
      { id: 'notams', title: 'NOTAMs', text: tidy(notamSection(o)), newPage: true },
    ];
  }

  const def = {
    id: 'rpa',
    name: 'Republic Airways (E-Jet)',
    description: 'Republic Airways flight brief: release with crew/fuel/weights, ATC FPL, 4-line nav log, cruise winds, TLR, WX, NOTAMs.',
    settingsGroup: 'rpa',
    format,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = def;
  else root.OFPFormats.register(def);
})(typeof window !== 'undefined' ? window : this);
