/*
 * Format: Mission+ (iPad EFB) — Dashboard page.
 * Renders an HTML "device" view (section.html) plus a plain-text summary (section.text)
 * used for Copy / Download .txt. Browser: registers with window.OFPFormats. Node: module.exports.
 */
(function (root) {
  'use strict';
  const C = typeof module !== 'undefined' && module.exports ? require('./common.js') : root.OFPCommon;
  const { up, str, num, asArray, secs, date, Z } = C;

  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const zt = (d) => (d ? `${Z(d.getUTCHours(), 2)}:${Z(d.getUTCMinutes(), 2)}Z` : '--:--Z');
  const lt = (d, tz) => (d && tz != null ? (() => { const x = new Date(d.getTime() + tz * 3600000); return `${Z(x.getUTCHours(), 2)}:${Z(x.getUTCMinutes(), 2)}(L)`; })() : '');
  const dMon = (d) => (d ? `${d.getUTCDate()} ${MON[d.getUTCMonth()]}` : '');
  const hm = (sec) => { const m = Math.round(Math.abs(sec) / 60); return `${Z(Math.floor(m / 60), 2)}:${Z(m % 60, 2)}`; };
  const lb = (n) => `${Math.round(n)} lb`;
  const addSec = (d, s) => (d ? new Date(d.getTime() + s * 1000) : null);
  const tzOf = (port, fallback) => {
    const v = str(port?.raw?.timezone) || str(fallback);
    return v === '' ? null : num(v);
  };

  // Simple line icons (generic, not app artwork)
  const I = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 17c6-1 2-8 8-10"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    mark: '<path d="M7 3h10v18l-5-4-5 4z"/>',
    eyeo: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>',
    filter: '<path d="M3 4h18l-7 9v6l-4 2v-8z"/>',
    cal: '<rect x="4" y="5" width="16" height="15" rx="1"/><path d="M4 10h16M8 3v4M16 3v4"/>',
    more: '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
    home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
    prep: '<path d="M5 20V8l7-4 7 4v12"/><path d="M9 20v-6h6v6M9 10h6"/>',
    plane: '<path d="M2 16h20M4 16l3-4h4l6-3 3 1-5 4"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h1M4 12h1M4 18h1"/>',
    folder: '<path d="M3 7h6l2 2h10v10H3z"/>',
    wx: '<path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11 2 3 3 0 0 0 1 6z"/><path d="M9 4v2M4 9h2M5.5 5.5l1.4 1.4"/>',
    post: '<path d="M3 18h18M5 18l2-6h10l2 6M9 12V8h6v4"/>',
    doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7"/>',
    dxml: '<path d="M5 2.5h10l4 4v15H5z"/><path d="M15 2.5v4h4"/><rect x="2.5" y="8" width="13" height="6" rx="1" fill="currentColor" stroke="none"/><text x="9" y="12.6" font-size="4.4" font-weight="700" text-anchor="middle" fill="#2e4a8f" stroke="none" font-family="sans-serif">XML</text><path d="M8 17.5h8"/>',
    dtxt: '<path d="M5 2.5h10l4 4v15H5z"/><path d="M15 2.5v4h4"/><rect x="2.5" y="8" width="13" height="6" rx="1" fill="currentColor" stroke="none"/><text x="9" y="12.6" font-size="4.4" font-weight="700" text-anchor="middle" fill="#2e4a8f" stroke="none" font-family="sans-serif">TXT</text><path d="M8 17.5h8"/>',
    dimg: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="M3 18l5.5-6 4 4 3-3 5.5 5"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    expand: '<path d="M4 9V4h5M4 4l6 6M20 9V4h-5M20 4l-6 6M4 15v5h5M4 20l6-6M20 15v5h-5M20 20l-6-6"/>',
    mapdoc: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 10l3 2 3-3M9 15l3-2 3 3"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/><path d="M4 20L20 4"/>',
    sun: '<circle cx="9" cy="9" r="3"/><path d="M9 2v2M2 9h2M4 4l1.4 1.4M14 4l-1.4 1.4"/><path d="M8 19h10a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.4 1.6A2.8 2.8 0 0 0 8 19z"/>',
    swap: '<path d="M3 9h14l-3-3M21 15H7l3 3"/>',
    crew: '<circle cx="12" cy="7" r="3"/><path d="M6 21v-4a6 6 0 0 1 12 0v4M9 14l3 4 3-4"/>',
    batt: '<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M21 10v4"/><rect x="4" y="9" width="6" height="6" fill="currentColor" stroke="none"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    up: '<path d="M5 15l7-7 7 7"/>',
    down: '<path d="M5 9l7 7 7-7"/>',
    expand: '<path d="M4 9V4h5M4 4l6 6M20 15v5h-5M20 20l-6-6M15 4h5v5M20 4l-6 6M9 20H4v-5M4 20l6-6"/>',
    db: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3 3 7 3s7-1.3 7-3"/>',
  };
  const ico = (k, cls = '') => `<svg class="mp-ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;

  function prep(ofp, s) {
    const o = C.base(ofp, s);
    const W = o.W, f = o.fuel, t = o.times, w = o.wts;
    const alt = o.alts[0] || null;
    const altRaw = asArray(ofp.alternate)[0] || {};

    const sOut = date(t.sched_out) || date(t.est_out);
    const sIn = date(t.sched_in) || date(t.est_in);
    const eOut = date(t.est_out) || sOut;
    const eIn = date(t.est_in) || sIn;
    const eOff = date(t.est_off) || addSec(eOut, secs(t.taxi_out));
    const eOn = date(t.est_on) || addSec(eOff, secs(t.est_time_enroute)) || addSec(eIn, -secs(t.taxi_in));

    const toc = o.navlog.find((x) => up(x.ident) === 'TOC');
    const res = W(f.reserve), altBurn = W(f.alternate_burn);
    const minLdg = res + altBurn;
    const planLdg = W(f.plan_landing);
    const minTo = W(f.min_takeoff) || W(f.enroute_burn) + W(f.contingency) + res + altBurn;

    const enrouteNotams = asArray(ofp.notams?.notamdrec).length + o.alts.reduce((n, a) => n + a.notams.length, 0);
    const now = new Date();
    return {
      o, alt,
      altEte: secs(altRaw.ete),
      flightId: `${o.callsign}/${o.fleet}`,
      dateTag: dMon(sOut),
      current: !eIn || eIn.getTime() > now.getTime(),
      sOut, sIn, eOut, eIn, eOff, eOn,
      tzO: tzOf(o.origin, t.orig_timezone), tzD: tzOf(o.dest, t.dest_timezone),
      block: sOut && sIn ? (sIn - sOut) / 1000 : secs(t.sched_block),
      air: secs(t.est_time_enroute),
      intl: o.origin && o.dest && o.origin.icao[0] !== o.dest.icao[0],
      etops: (ofp.general?.is_etops === '1' || ofp.general?.is_etops === true || !!ofp.etops?.equal_time_point) ? (ofp.etops || {}) : null,
      tracks: (Object.values(ofp.tracks?.nat_notams || {}).some((x) => str(x)) || asArray(ofp.tracks?.nat).length || /\bNAT[A-Z]\b/.test(up(ofp.general?.route))) ? [1] : [],
      fuel: {
        tow: W(w.est_tow), ldw: W(w.est_ldw), block: W(f.plan_ramp), minTo,
        toc: toc ? W(toc.fuel_plan_onboard) : 0, planLdg, minLdg, delay: Math.max(0, planLdg - minLdg),
      },
      notams: { o: o.origin?.notams.length || 0, e: enrouteNotams, d: o.dest?.notams.length || 0 },
      crewDeck: [
        o.crew.cpt && { name: up(o.crew.cpt), role: 'Captain', emp: C.empNo(o.crew.cpt, s.captEmp) },
        o.crew.fo && { name: up(o.crew.fo), role: 'First Officer', emp: C.empNo(o.crew.fo, s.foEmp) },
      ].filter(Boolean),
      crewCabin: o.crew.fa.map((n, i) => ({ name: up(n), role: i === 0 && asArray(ofp.crew?.pu).length ? 'Purser' : 'Flight Attendant', emp: C.empNo(n) })),
      now,
    };
  }

  // [icon, label, page, drawer]
  const TABS = [
    ['home', 'Dashboard', 'dashboard'], ['prep', 'Flt Prep', null, 'prep'], ['plane', 'In Flight', null, 'inflight'], ['list', 'Nav Log', 'navlog'],
    ['folder', 'NOTAM', null, 'notam'], ['wx', 'Weather', null, 'wx'], ['folder', 'Other Docs', null, 'docs'], ['post', 'Post Flight', null, 'post'], ['more', 'Others', null, 'others'],
  ];

  // Tab drawers, as in the real app. [id, label, icon xml|txt|img, unread by default, sub-label]
  // Unread = bright left bar; a tab's badge = its unread count (matches Cole's photos: 7/2/4/10/1).
  function drawerMenus(m) {
    const h = m.eOut ? m.eOut.getUTCHours() : 21;
    const tpFrom = (Math.ceil((h + 1) / 3) * 3) % 24;
    const tpWin = `${Z(tpFrom, 2)}Z-${Z((tpFrom + 6) % 24, 2)}Z`;
    return {
      prep: [
        ['Release Acknowledgment', [['fdra', 'FDRA', 'xml', 1, 'To Sign']]],
        ['General', [['finfo', 'Flight Information', 'xml', 0], ['faddl', 'Flight Additional Information', 'xml', 0], ['loadfuel', 'Load & Fuel', 'xml', 0],
          ['lfrmk', 'Load & Fuel Remarks', 'xml', 0], ['fprmk', 'Flight Plan Remarks', 'xml', 0], ['corm', 'Company Remarks', 'txt', 0],
          ['adr', 'Aircraft Discrepancy Report', 'txt', 1], ['gate', 'Gate Message', 'txt', 1]]],
        ['LATT Calculation', [['fdplatt', 'FDP LATT', 'xml', 1], ['blklatt', 'Block LATT', 'xml', 1]]],
        ['In Flight Deck', [['fmsinit', 'FMS Initialization', 'xml', 0]]],
        ['Crew Information', [['crewlist', 'Crew List', 'xml', 1], ['crewconn', 'Crew Connections', 'xml', 1]]],
        ...(m.air > 5 * 3600 ? [['Crew Rest Calculation', [['rest', 'Rest Context and Settings', 'xml', 0], ['rest3', 'Three Pilots Planning', 'xml', 0], ['rest4', 'Four Pilots Planning', 'xml', 0]]]] : []),
      ],
      inflight: [
        ['Enroute', [['enrinfo', 'Enroute Information', 'xml', 1], ['altsum', 'Alternates Summary', 'xml', 1], ...(m.etops ? [['etops', 'ETOPS', 'xml', 0]] : [])]],
        ...(m.tracks.length ? [['Navigation', [['oceanic', 'Oceanic Tracks', 'txt', 1]]]] : []),
      ],
      notam: [['', [['onotam', 'Origin NOTAMs', 'xml', 1], ['aenotam', 'Alternate & Enroute NOTAMs', 'xml', 1],
        ['dnotam', 'Destination NOTAMs', 'xml', 1], ['allnotam', 'All NOTAMs', 'xml', 1]]]],
      wx: [
        ['Airport Weather', [['owx', 'Origin METAR & TAF', 'xml', 0], ['ewx', 'Enroute METAR & TAF', 'xml', 1], ['dwx', 'Destination METAR & TAF', 'xml', 1],
          ['awx', 'Alternates METAR & TAF', 'xml', 1], ['atis', 'ATIS', 'xml', 1]]],
        ['General Weather', [['winds', 'Forecasted Winds & Temp', 'xml', 1], ['fieldc', 'Field Conditions', 'txt', 1]]],
        ['Threat Plots', [['tp', 'Threat Plots', 'xml', 1], ['tpfcst', `U.S. Fcst TPs ${tpWin}`, 'img', 1], ['tpcur', 'U.S. Current TPs', 'img', 1],
          ['tpcurf', 'U.S. Curr Fcst TPs', 'img', 1]]],
      ],
      docs: [
        ['Dispatch Information', [['fpadd', 'Flight Plan Addendum', 'txt', 1]]],
        ['Legacy Flight Briefing', [['cbp', 'CBP', 'txt', 0]]],
        ['Help', [['aboutfp', 'About Flight Plan', 'xml', 0], ['aboutwx', 'About Airport Weather', 'xml', 0]]],
      ],
      post: [['', [['!close', 'Close Flight', 'act', 0], ['!pfr', 'Send PFR & Close', 'act', 0]]]],
      others: [['Obsolete', [['~', 'No obsolete documents', 'note', 0]]], ['Trash', [['~', 'Trash is empty', 'note', 0]]]],
    };
  }

  // Documents that have content; any other drawer button shows an empty page with its title
  function docPages(m) {
    const { o } = m;
    const hmm = (sec) => { const mn = Math.round(sec / 60); return `${Z(Math.floor(mn / 60), 2)}:${Z(mn % 60, 2)}`; };
    const altRows = o.alts.map((a) => {
      const r = a.raw || {};
      const ete = secs(r.ete);
      const eta = m.eOn && ete ? new Date(m.eOn.getTime() + ete * 1000) : null;
      const fl = num(r.cruise_altitude) ? Z(Math.round(num(r.cruise_altitude) / 100), 3) : '-';
      return `
        <div class="mp-asrow">
          <div class="c-alt"><b>*${esc(a.icao)}*</b><b>${esc(a.iata || a.code || '')}</b></div>
          <div class="c-dist"><b>${num(r.distance) ? Math.round(num(r.distance)) : '-'}</b><b class="nm">${esc(a.name || '')}</b></div>
          <div><b>${esc(fl)}</b></div>
          <div><b>${ete ? esc(hmm(ete)) : '-'}</b></div>
          <div>${dynZ(eta)}</div>
          <div><b>${str(r.burn) ? o.W(r.burn) : '-'}</b></div>
        </div>`;
    }).join('');
    const docs = {};
    if (m.etops) docs['inflight:etops'] = { title: 'ETOPS', html: etopsPage(m) };
    docs['prep:finfo'] = { title: 'Flight Information', html: flightInfoPage(m) };
    const O = o.origin, D = o.dest;
    const nAll = Array.isArray(o.raw.notams) ? o.raw.notams : asArray(o.raw.notams?.notamdrec);
    const known = new Set([O, D, ...o.alts].filter(Boolean).flatMap((p) => p.notams.map((n) => up(n.notam_id))));
    const enr = nAll.filter((n) => n && !known.has(up(n.notam_id)));
    const altSecs = o.alts.filter(Boolean).map((a) => ({ title: 'Alternate Airport', port: a, list: a.notams }));
    const byLoc = {};
    enr.forEach((n) => { const k = up(n.icao_id || n.location_icao || n.cns_location_id) || 'ENROUTE'; (byLoc[k] = byLoc[k] || []).push(n); });
    const enrSec = Object.keys(byLoc).map((k) => ({ title: 'Enroute', port: null, list: byLoc[k] }));
    docs['notam:onotam'] = { title: 'Origin NOTAMs', kind: 'notam', html: notamPage(m, [{ title: 'Origin Airport', port: O, list: O?.notams || [] }]) };
    docs['notam:aenotam'] = { title: 'Alternate & Enroute NOTAMs', kind: 'notam', html: notamPage(m, [...altSecs, ...enrSec]) };
    docs['notam:dnotam'] = { title: 'Destination NOTAMs', kind: 'notam', html: notamPage(m, [{ title: 'Destination Airport', port: D, list: D?.notams || [] }]) };
    docs['notam:allnotam'] = { title: 'All NOTAMs', kind: 'notam', html: notamPage(m, [
      { title: 'Origin Airport', port: O, list: O?.notams || [] }, { title: 'Destination Airport', port: D, list: D?.notams || [] }, ...altSecs, ...enrSec]) };
    Object.assign(docs, {
      'prep:fdra': { title: 'FDRA', html: fdraPage(m) },
      'prep:loadfuel': { title: 'Load & Fuel', html: loadFuelPage(m) },
      'prep:lfrmk': { title: 'Load & Fuel Remarks', html: lfRemarksPage(m) },
      'prep:fprmk': { title: 'Flight Plan Remarks', html: fpRemarksPage(m) },
      'prep:corm': { title: 'Company Remarks', html: companyRemarksPage(m) },
      'prep:adr': { title: 'Aircraft Discrepancy Report', html: adrPage(m) },
      'prep:gate': { title: 'Gate Message', html: gatePage(m) },
      'prep:fdplatt': { title: 'FDP LATT', html: fdpLattPage(m) },
      'prep:blklatt': { title: 'Block LATT', html: blockLattPage(m) },
      'prep:crewlist': { title: 'Crew List', html: crewListPage(m) },
      'prep:crewconn': { title: 'Crew Connections', html: crewConnPage(m) },
      'inflight:enrinfo': { title: 'Enroute Information', html: enrInfoPage(m) },
      'wx:owx': { title: 'Origin METAR & TAF', html: wxPage(m, 'o') },
      'wx:ewx': { title: 'Enroute METAR & TAF', html: wxPage(m, 'e') },
      'wx:dwx': { title: 'Destination METAR & TAF', html: wxPage(m, 'd') },
      'wx:awx': { title: 'Alternates METAR & TAF', html: wxPage(m, 'a') },
      'wx:atis': { title: 'ATIS', html: atisPage(m) },
      'wx:winds': { title: 'Forecasted Winds & Temp', html: windsPage(m) },
      'wx:fieldc': { title: 'Field Conditions', html: fieldCondPage(m) },
      'wx:tp': { title: 'Threat Plots', html: threatPage(m) },
      'wx:tpfcst': { title: 'U.S. Fcst TPs', html: imgDocPage() },
      'wx:tpcur': { title: 'U.S. Current TPs', html: imgDocPage() },
      'wx:tpcurf': { title: 'U.S. Curr Fcst TPs', html: imgDocPage() },
      'docs:fpadd': { title: 'Flight Plan Addendum', html: addendumPage(m) },
      'docs:cbp': { title: 'CBP', html: cbpPage(m) },
      'docs:aboutfp': { title: 'About Flight Plan', html: aboutFpPage() },
      'docs:aboutwx': { title: 'About Airport Weather', html: aboutWxPage() },
    });
    if (m.tracks.length) docs['inflight:oceanic'] = { title: 'Oceanic Tracks', html: oceanicPage(m) };
    if (m.air > 5 * 3600) {
      docs['prep:rest'] = { title: 'Rest Context and Settings', html: restPage(m, 'ctx') };
      docs['prep:rest3'] = { title: 'Three Pilots Planning', html: restPage(m, 'three') };
      docs['prep:rest4'] = { title: 'Four Pilots Planning', html: restPage(m, 'four') };
    }
    docs['prep:fmsinit'] = { title: 'FMS Initialization', html: fmsInitPage(m) };
    docs['prep:faddl'] = { title: 'Flight Additional Information', html: flightAddlPage(m) };
    return {
      ...docs,
      'inflight:altsum': {
        title: 'Alternates Summary',
        html: `
      <div class="mp-as">
        <div class="mp-ash">Destination Alternates Summary</div>
        <div class="mp-asrow mp-ascols"><div class="c-alt">Alternate</div><div class="c-dist">Distance (NM)</div><div>FL</div><div>Time</div><div>ETA</div><div>Trip (lb)</div></div>
        ${altRows || '<div class="mp-asnone">NO ALTERNATE PLANNED</div>'}
      </div>`,
      },
    };
  }
  // Shared by Flight Information and FMS Initialization: perf factor, speeds, TOC data, route, FL steps
  function fiBits(m) {
    const { o } = m;
    const ofp = o.raw, g = o.general, ac = ofp.aircraft || {};
    const O = o.origin || {}, D = o.dest || {};
    // performance factor e.g. "P2.7" / "+2.7" / "-1.0" -> "+02.7%"
    const pfRaw = str(ac.fuelfact ?? ac.fuelfactor ?? ac.perf_factor);
    const pfm = /^([PM+-]?)\s*(\d+(?:\.\d+)?)/i.exec(pfRaw);
    const pf = pfm ? `${/^[M-]/i.test(pfm[1]) ? '-' : '+'}${Number(pfm[2]).toFixed(1).padStart(4, '0')}%` : '-';
    // speeds
    const ci = str(g.costindex);
    const spd = (p) => { const v = up(p); return /^CI/.test(v) ? v.replace(/\s+/g, '') : v || '-'; };
    // Mission+ shows CLB / CIxx / CIxx (Flight Information) and CLB / VCI/CI0xx/TASnnn / DES/CI0xx (FMS Init)
    const ciMode = /CI/.test(up(g.cruise_profile)) || !str(g.cruise_profile);
    const cruise = ciMode ? (ci ? `CI${ci}` : '-') : up(g.cruise_profile);
    const tas = Math.round(num(g.cruise_tas));
    const sp = {
      climb: 'CLB', cruise, descent: ci ? `CI${ci}` : '-',
      fmsCruise: ciMode && ci ? `VCI/CI${Z(num(ci), 3)}${tas ? `/TAS${Z(tas, 3)}` : ''}` : cruise,
      fmsDescent: ci ? `DES/CI${Z(num(ci), 3)}` : '-',
    };
    // TOC data
    const toc = o.navlog.find((x) => up(x.ident) === 'TOC');
    const tocWind = toc && str(toc.wind_dir) !== '' ? `${Z(Math.round(num(toc.wind_dir)), 3)}/${Z(Math.round(num(toc.wind_spd)), 3)}` : '-';
    const tocOat = toc && str(toc.oat) !== '' ? String(Math.round(num(toc.oat))) : '-';
    // route string: fixes white, airways / DCT / SID / STAR green
    const isAwy = (t) => t === 'DCT' || /^NAT[A-Z]$/.test(t) || /^[A-Z]{1,3}\d{1,4}[A-Z]?$/.test(t) || /^[A-Z]{3,6}\d[A-Z]?$/.test(t);
    const toks = up(g.route).split(/\s+/).filter(Boolean).map((t) => t.replace(/\/.*$/, ''));
    const route = [O.icao, ...toks, D.icao].filter(Boolean)
      .map((t, i, a) => (i > 0 && i < a.length - 1 && isAwy(t) ? `<span class="g">${esc(t)}</span>` : esc(t))).join(' ');
    // initial level + step climbs (fix where the new level starts)
    const steps = [];
    const fl0 = num(g.initial_altitude);
    if (fl0) steps.push([O.icao, Math.round(fl0 / 100)]);
    let cur = fl0, past = false;
    o.navlog.forEach((f, i, a) => {
      if (up(f.ident) === 'TOC') { past = true; return; }
      if (up(f.ident) === 'TOD') past = false;
      const alt = num(f.altitude_feet);
      if (past && alt && cur && alt - cur >= 1000 && up(f.ident) !== 'TOD') {
        const prev = a[i - 1] && !['TOC', 'TOD'].includes(up(a[i - 1].ident)) ? a[i - 1] : f;
        steps.push([up(prev.ident), Math.round(alt / 100)]);
        cur = alt;
      }
    });
    const stepHtml = steps.map(([fx, fl]) => `${esc(fx)}/<span class="b">FL${Z(fl, 3)}</span>`).join('  ');
    return { pf, spd, cruise, sp, toc, tocWind, tocOat, route, steps, stepHtml };
  }

  // Flt Prep > Flight Information (per Cole's DAL0183 LIRF-KJFK photos)
  function flightInfoPage(m) {
    const { o } = m;
    const ofp = o.raw, g = o.general, ac = ofp.aircraft || {}, s = o.settings || {};
    const O = o.origin || {}, D = o.dest || {}, A = o.alts[0];
    const d3 = (d) => (d ? `${Z(d.getUTCDate(), 2)} ${MON[d.getUTCMonth()]} ${Z(d.getUTCFullYear() % 100, 2)}` : '-');
    const fltNum = up(g.flight_number).replace(/\D/g, '');
    const iataAl = up(g.iata_airline);
    const port = (p) => (p ? [p.icao, p.iata || p.code, p.name].filter(Boolean).join(' / ') : '-');
    const lt2 = (d, tz) => lt(d, tz) || '-';
    const hmm = (sec) => { const mn = Math.round(sec / 60); return `${Z(Math.floor(mn / 60), 2)}:${Z(mn % 60, 2)}`; };
    const { pf, sp, tocWind, tocOat, route, stepHtml } = fiBits(m);
    // ATC flight plan remarks: equipment line + item 18 + field elevations
    const fpl = str(ofp.atc?.flightplan_text).replace(/[()]/g, '');
    const segs = fpl.split(/\s*\n?-\s*(?=[A-Z0-9])/).map((x) => x.trim()).filter(Boolean);
    const item10 = segs.find((x) => /^[A-Z0-9]{2,4}\/[LMHJ]-\S+/.test(x)) || (o.icaoType && ac.equip ? `${o.icaoType}/${/^[LMHJ]-/.test(up(ac.equip)) ? '' : `${up(ac.wake || 'M')}-`}${up(ac.equip)}` : '');
    const item18 = str(ofp.atc?.section18) || segs.filter((x) => /^[A-Z]{2,4}\//.test(x) && !/^[A-Z0-9]{2,4}\/[LMHJ]-/.test(x)).pop() || '';
    const wrap = (txt, w = 55) => {
      const out = []; let line = '';
      up(txt).replace(/\s+/g, ' ').trim().split(' ').forEach((wd) => {
        if (line && (line + ' ' + wd).length > w) { out.push(line); line = wd; } else line = line ? `${line} ${wd}` : wd;
      });
      if (line) out.push(line);
      return out;
    };
    const elevs = [O, D].filter((p) => p && p.icao).map((p) => `${p.iata || p.code}/${p.icao} ${Math.round(p.elev || 0)} FT`).join(' ');
    const atcLines = ['IFR ICAO FLIGHT PLAN', `SHIP ${o.fleet} ${up(item10.split(/\s+/)[0] || '')}`.trim(), ...wrap(item18), elevs ? `ELEVATION  ${elevs}` : ''].filter(Boolean);
    const mel = str(s.mpMel).split(/\n/).map((x) => x.trim()).filter(Boolean);
    const melLines = [`MEL ITEMS FOR SHIP NUMBER ${o.fleet}`, ...(mel.length ? mel.flatMap((x, i) => wrap(`${Z(i + 1, 2)} ${x}`, 60)) : ['NIL'])];
    const kv = (k, v) => `<div class="mp-fik">${esc(k)}</div><div class="mp-fiv">${v}</div>`;
    return `
      <div class="mp-fih">Flight Plan Reference</div>
      <div class="mp-fip mp-fi4">
        ${kv('Release', `${esc(o.release)}.0`)}${kv('Generated', esc(zt(o.generated)))}
        ${kv('Dispatcher', esc(up(s.mpDispatcher) || up(ofp.crew?.dx) || '-'))}${kv('Tel/Desk', esc(up(s.mpDeskTel) || up(s.dispatchDesk) || '-'))}
      </div>
      <div class="mp-fih">Flight Information</div>
      <div class="mp-fip mp-fi2">
        ${kv('Flight Origin Date', esc(d3(m.sOut)))}
        ${kv('Flight No', `${esc(o.airline)}${esc(Z(fltNum || 0, 4))}${iataAl ? `<br>${esc(iataAl)}${esc(fltNum)}` : ''}`)}
        ${kv('From', esc(port(O)))}${kv('To', esc(port(D)))}${kv('Alternate', esc(port(A)))}
        ${m.etops ? kv('ETOPS (MIN)', esc(str(m.etops.rule) || '-')) : ''}
        <div class="mp-fisp"></div><div></div>
        ${kv('SELCAL', esc(up(ac.selcal) || '-'))}${kv('ATC Call Sign', esc(o.callsign))}
        ${kv('ACARS Use', esc(`${Z(fltNum || 0, 4)}/${m.sOut ? Z(m.sOut.getUTCDate(), 2) : '--'}`))}
      </div>
      <div class="mp-fip mp-fitimes">
        <div></div><div>STD</div><div>ETD</div><div>STA</div><div>ETA</div><div>ETE</div>
        <b>${esc(d3(m.sOut))}</b><b>${esc(zt(m.sOut))}</b><b>${esc(zt(m.eOut))}</b><b>${esc(zt(m.sIn))}</b><b>${esc(zt(m.eIn))}</b><b class="g">${m.air ? esc(hmm(m.air)) : '-'}</b>
        <div>Local Time</div><b>${esc(lt2(m.sOut, m.tzO))}</b><b>${esc(lt2(m.eOut, m.tzO))}</b><b>${esc(lt2(m.sIn, m.tzD))}</b><b>${esc(lt2(m.eIn, m.tzD))}</b><b></b>
      </div>
      <div class="mp-fih">Aircraft Information</div>
      <div class="mp-fip mp-fi4">
        ${kv('Registration', `${esc(o.reg)}<br>${esc(o.icaoType)}`)}${kv('Performance Factor', esc(pf))}
        ${kv('Ship number', esc(o.fleet))}<div></div><div></div>
      </div>
      <div class="mp-fih">Route Information</div>
      <div class="mp-fip">
        <div class="mp-firt">
          <div class="mp-fik">Speed:</div><div class="l">Climb</div><div class="l">Cruise</div><div class="l">Descent</div>
          <div></div><b>${esc(sp.climb)}</b><b>${esc(sp.cruise)}</b><b>${esc(sp.descent)}</b>
          <div class="mp-fik">Route:</div><div class="l">TOC Wind</div><div class="l">TOC Temp (°C)</div><div class="l">Ground Distance (NM)</div>
          <div></div><b class="s">${esc(tocWind)}</b><b class="s">${esc(tocOat)}</b><b class="s">${num(g.route_distance) ? Math.round(num(g.route_distance)) : '-'}</b>
          <div></div><div></div><div class="l">Company Route</div><div></div>
          <div></div><div></div><b class="s">${esc(up(g.route_name) || '-')}</b><div></div>
        </div>
        <div class="mp-fimono">${route}</div>
        ${stepHtml ? `<div class="mp-fimono">${stepHtml}</div>` : ''}
      </div>
      <div class="mp-fih">Remarks</div>
      <div class="mp-fip">
        <div class="mp-fisub">ATC Flight Plan</div>
        <pre class="mp-fipre">${esc(atcLines.join('\n'))}</pre>
        <div class="mp-fisub">MEL/CDL Information</div>
        <pre class="mp-fipre">${esc(melLines.join('\n'))}</pre>
      </div>`;
  }

  // NOTAM pages (per Cole's screen recording of KATL Origin NOTAMs): a sticky "Origin Airport  KATL/ATL"
  // bar; general NOTAMs first, then one "Impacted Runway <rwy>" group per runway named in the text,
  // each split into sub-groups (Runway, ApproachProcedures …). Cards: id | From … To … | days in effect,
  // priority ring + ⋮ menu (Undefined/Low/Medium/High), bookmark, blue bar while unviewed.
  const NOTAM_BOLD = /\b(AD|RWY|TWY|ILS|LOC|RNAV|VNAV|VOR|DME|NDB|CRANES?|OBST|APN|TACAN)\b/g;
  const NOTAM_WARN = /(U\/S|\bINOP\b|\bCLSD\b|\bUNSERVICEABLE\b)/g;
  // Enroute (FIR) NOTAMs come in ICAO format with their own field names: normalize to the airport shape
  function nrmNotam(n) {
    if (n.date_effective || !n.notam_effective_dtg) return n;
    const iso = (v) => { const d = dtg(v); return d ? d.toISOString() : ''; };
    const raw = str(n.notam_text);
    const e = /\bE\)\s*([\s\S]*?)(?=\n\s*[FG]\)|\s*$)/.exec(raw);
    const q = /Q\)\s*\w+\/(Q\w{4})/.exec(raw);
    return {
      ...n, notam_text: e ? e[1].trim() : raw, location_icao: n.icao_id || n.cns_location_id,
      date_effective: iso(n.notam_effective_dtg), date_expire: iso(n.notam_expire_dtg || n.notam_expire_dtg_estimated),
      date_expire_is_estimated: !n.notam_expire_dtg && !!n.notam_expire_dtg_estimated, date_created: iso(n.notam_created_dtg),
      notam_qcode: n.notam_qcode || (q ? q[1] : ''),
    };
  }
  function notamPage(m, sections) {
    const DAY = 86400e3;
    const nd = (d) => (d ? `${Z(d.getUTCDate(), 2)} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()} ${Z(d.getUTCHours(), 2)}:${Z(d.getUTCMinutes(), 2)}` : '');
    const rw = (x) => { const mt = /^0?(\d{1,2})([LRC]?)$/.exec(x); return mt ? `${Z(Number(mt[1]), 2)}${mt[2]}` : x; };
    const sub = (n, txt) => {
      const q = up(n.notam_qcode).replace(/^Q/, '');
      if (/^(P|I[CDGLMSTUWXY])/.test(q) || /\bIAP\b|\b(ILS|LOC|RNAV|GLS|LPV)\b.*\bRWY\b|\bAPCH\b|\bSID\b|\bSTAR\b/.test(txt)) return /\bSID\b|\bODP\b|\bDP\b/.test(txt) ? 'DepartureProcedures' : 'ApproachProcedures';
      if (n.notam_is_obstacle === true || n.notam_is_obstacle === '1' || /^O/.test(q) || /\bOBST\b|\bCRANE/.test(txt)) return 'Obstacles';
      if (/^M[RDTU]|^L/.test(q) || /\bRWY\b/.test(txt)) return 'Runway';
      if (/^M[XNY]/.test(q) || /\bTWY\b/.test(txt)) return 'Taxiway';
      if (/^MA|^MP|^MK/.test(q) || /\bAPN\b|\bRAMP\b/.test(txt)) return 'Apron';
      if (/^N/.test(q) || /\b(VOR|NDB|DME|TACAN)\b/.test(txt)) return 'Navaids';
      if (/^[AR]/.test(q)) return 'Airspace';
      if (/^S/.test(q)) return 'Services';
      return 'Airport';
    };
    // NOTAM age = days since publication (created, else effective); "new" (yellow) under 5 days
    const card = (n, ctx) => {
      const txt = up(str(n.notam_text) || str(n.notam_raw)).trim();
      const id = up(n.notam_id);
      const eff = date(n.date_effective), exp = date(n.date_expire);
      const pub = date(n.date_created) || eff;
      const perm = !exp || /PERM/.test(up(n.date_expire));
      const days = pub ? Math.floor((m.now - pub) / DAY) : null;
      const dtxt = days == null ? '' : days <= 0 ? 'Today' : `${days} Days`;
      const isNew = days != null && days < 5;
      const body = esc(txt).replace(NOTAM_BOLD, '<b>$1</b>').replace(NOTAM_WARN, '<em>$1</em>');
      return `
        <div class="mp-nc" data-nid="${esc(id)}" data-port="${esc(ctx.port)}" data-rwy="${esc(ctx.rwy)}" data-asp="${esc(ctx.asp)}" data-new="${isNew ? 1 : ''}">
          <div class="mp-nch"><span>${esc(id.replace(/^([A-Z])(\d)/, '$1 $2'))}</span><i></i>${ico('cal', 'mp-ncal')}<span>From ${esc(nd(eff))} To ${perm ? 'PERM' : esc(nd(exp))}${n.date_expire_is_estimated === true || n.date_expire_is_estimated === '1' ? ' EST' : ''}</span>${dtxt ? `<i></i><span class="mp-ndays${isNew ? ' new' : ''}">${dtxt}</span>` : ''}
            <span class="mp-grow"></span><span class="mp-npri" role="button" tabindex="0" title="Priority"></span><i class="tall"></i><span class="mp-nkb" role="button" tabindex="0">${ico('more')}</span>
            <div class="mp-nmenu" hidden>${['Undefined', 'Low', 'Medium', 'High'].map((p) => `<div data-pri="${p.toLowerCase()}"><span class="mp-npri" data-p="${p.toLowerCase()}"></span>${p}</div>`).join('')}</div></div>
          <div class="mp-ncb"><div class="mp-nct">${body}</div><span class="mp-nbm" role="button" tabindex="0">${ico('mark')}</span></div>
        </div>`;
    };
    const ORDER = ['Airport', 'Runway', 'Taxiway', 'Apron', 'ApproachProcedures', 'DepartureProcedures', 'Navaids', 'Obstacles', 'Airspace', 'Services'];
    const groupHtml = (items, rwy, port, asp) => {
      const by = {};
      items.forEach((n) => { (by[n._sub] = by[n._sub] || []).push(n); });
      return ORDER.filter((k) => by[k]).map((k) => `
        <div class="mp-nsub"><div class="mp-nsubh"><span>${k}</span><span class="r">${esc(rwy || '')}</span></div>${by[k].map((n) => card(n, { rwy: rwy || '', port: port || up(n.location_icao), asp: asp ? up(n.location_icao) || up(n.location_name) : '' })).join('')}</div>`).join('');
    };
    let total = 0;
    const secHtml = sections.map((sec) => {
      const list = asArray(sec.list).filter((n) => n && (str(n.notam_text) || str(n.notam_raw))).map(nrmNotam);
      total += list.length;
      const general = [], byRwy = {};
      list.forEach((n) => {
        const txt = up(str(n.notam_text) || str(n.notam_raw));
        n._sub = sub(n, txt);
        const rws = [...new Set([...txt.matchAll(/\bRWY\s+(\d{1,2}[LRC]?)(?=[\s\/,.]|$)|\bRW(\d{2}[LRC]?)\b/g)].map((x) => rw(x[1] || x[2])))];
        if (!rws.length) general.push(n);
        rws.forEach((r) => { (byRwy[r] = byRwy[r] || []).push(n); });
      });
      const rKeys = Object.keys(byRwy).sort((a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b));
      const port = sec.port ? `${sec.port.icao}/${sec.port.iata || sec.port.code}` : (list[0] ? up(list[0].location_icao) : '');
      return `
      <section class="mp-nsec" data-port="${esc(sec.port?.icao || '')}">
        <div class="mp-nsech"><span>${esc(sec.title)}</span><span>${esc(port)}</span></div>
        ${general.length ? groupHtml(general, '', sec.port?.icao, !sec.port) : ''}
        ${rKeys.map((r) => `<div class="mp-nrwy"><span>Impacted Runway</span><span class="y">${esc(r)}</span></div>${groupHtml(byRwy[r], r, sec.port?.icao, !sec.port)}`).join('')}
        ${list.length ? '' : '<div class="mp-nnone">NO NOTAMS</div>'}
      </section>`;
    }).join('');
    const sel = (k, opts) => `<select data-nf="${k}"><option value="">-</option>${opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>`;
    return `<div class="mp-nwrap"><div class="mp-notams" data-total="${total}">${secHtml}</div>
      <aside class="mp-nfilter" hidden>
        <label>Keyword<input data-nf="kw" placeholder="e.g. ILS, CLSD" autocomplete="off" spellcheck="false"></label>
        <label>Airport${sel('apt', [])}</label>
        <label>Airspace${sel('asp', [])}</label>
        <label>Importance${sel('imp', [['undefined', 'Undefined'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High']])}</label>
        <label>Bookmarks${sel('bm', [['1', 'Bookmarked'], ['0', 'Not bookmarked']])}</label>
        <label>Viewed Status${sel('vw', [['1', 'Viewed'], ['0', 'Unviewed']])}</label>
        <label class="mp-nnew">New : 5 days<input type="checkbox" data-nf="new"><span class="mp-sw"></span></label>
        <button type="button" class="mp-nclear">CLEAR ALL</button>
      </aside></div>`;
  }

  // NOTAM page behaviour: unviewed count (a card counts as viewed once fully on screen), priority menu,
  // bookmarks, sticky sub-headers that pick up the runway once stuck. Saved per flight ('mp.notam').
  const NOTAM_KEY = 'mp.notam';
  const notamStore = {
    all() { try { return JSON.parse(localStorage.getItem(NOTAM_KEY)) || {}; } catch { return {}; } },
    get(f) { const a = this.all()[f] || {}; return { v: a.v || {}, p: a.p || {}, b: a.b || {} }; },
    put(f, d) { const all = this.all(); all[f] = d; try { localStorage.setItem(NOTAM_KEY, JSON.stringify(all)); } catch { /* storage unavailable */ } },
  };
  function wireNotams(screen, dv, body) {
    const wrap = body.querySelector('.mp-notams');
    const title = dv.querySelector('.mp-dvt');
    title.querySelectorAll('.mp-dvcount, .mp-nchip').forEach((x) => x.remove());
    dv.classList.remove('nf-open');
    if (!wrap) return;
    const flight = screen.dataset.flight;
    const st = notamStore.get(flight);
    const cards = [...wrap.querySelectorAll('.mp-nc')];
    const ids = [...new Set(cards.map((c) => c.dataset.nid))];
    const panel = body.querySelector('.mp-nfilter');
    const F = { kw: '', apt: '', asp: '', imp: '', bm: '', vw: '', new: false };
    cards.forEach((c) => { const t = c.querySelector('.mp-nct'); c._html = t.innerHTML; c._text = t.textContent.toUpperCase(); });
    // filter options from what's on the page
    const aptSel = panel.querySelector('[data-nf="apt"]'), aspSel = panel.querySelector('[data-nf="asp"]');
    const ports = [...new Set(cards.map((c) => c.dataset.port).filter((p, i, a) => p && !cards.find((x) => x.dataset.port === p && x.dataset.asp)))];
    ports.forEach((p) => {
      aptSel.add(new Option(`${p} (Entire Airport)`, p));
      [...new Set(cards.filter((c) => c.dataset.port === p && c.dataset.rwy).map((c) => c.dataset.rwy))].forEach((r) => aptSel.add(new Option(`${p} RWY ${r}`, `${p}|${r}`)));
    });
    [...new Set(cards.map((c) => c.dataset.asp).filter(Boolean))].forEach((a) => aspSel.add(new Option(a, a)));
    aspSel.disabled = aspSel.options.length < 2;

    const count = document.createElement('small');
    count.className = 'mp-dvcount';
    title.appendChild(count);
    const chips = document.createElement('span');
    chips.className = 'mp-nchip';
    title.appendChild(chips);

    const kws = () => F.kw.split(',').map((k) => k.trim().toUpperCase()).filter(Boolean);
    const match = (c) => {
      const id = c.dataset.nid;
      const k = kws();
      if (k.length && !k.some((w) => c._text.includes(w))) return false;
      if (F.apt) { const [p, r] = F.apt.split('|'); if (c.dataset.port !== p || (r && c.dataset.rwy !== r)) return false; }
      if (F.asp && c.dataset.asp !== F.asp) return false;
      if (F.imp && (st.p[id] || 'undefined') !== F.imp) return false;
      if (F.bm && (!!st.b[id]) !== (F.bm === '1')) return false;
      if (F.vw && (!!st.v[id]) !== (F.vw === '1')) return false;
      if (F.new && !c.dataset.new) return false;
      return true;
    };
    const hl = (c) => {
      const k = kws();
      const t = c.querySelector('.mp-nct');
      if (!k.length) { t.innerHTML = c._html; return; }
      const all = k.every((w) => c._text.includes(w));
      const re = new RegExp(k.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
      t.innerHTML = c._html.split(/(<[^>]+>)/).map((seg) => (seg.startsWith('<') ? seg : seg.replace(re, (x) => `<mark class="${all && k.length > 1 ? 'w' : ''}">${x}</mark>`))).join('');
    };
    const paint = () => {
      const shown = new Set();
      cards.forEach((c) => {
        const id = c.dataset.nid;
        c.classList.toggle('unv', !st.v[id]);
        c.querySelector('.mp-nch > .mp-npri').dataset.p = st.p[id] || '';
        c.querySelector('.mp-nbm').classList.toggle('on', !!st.b[id]);
        const ok = match(c);
        c.hidden = !ok;
        if (ok) shown.add(id);
        hl(c);
      });
      wrap.querySelectorAll('.mp-nsub').forEach((g) => { g.hidden = !g.querySelector('.mp-nc:not([hidden])'); });
      wrap.querySelectorAll('.mp-nrwy').forEach((h) => {
        let n = h.nextElementSibling, any = false;
        while (n && n.classList.contains('mp-nsub')) { if (!n.hidden) any = true; n = n.nextElementSibling; }
        h.hidden = !any;
      });
      const unv = ids.filter((id) => shown.has(id) && !st.v[id]).length;
      count.textContent = ` ${shown.size}/${ids.length} results${unv ? ` (${unv} Unviewed)` : ''}`;
      const lab = { apt: 'Airport', asp: 'Airspace', imp: 'Importance', bm: '', vw: '', kw: 'Keyword' };
      chips.innerHTML = Object.entries(F).filter(([, v]) => v).map(([k, v]) => {
        const txt = k === 'bm' ? (v === '1' ? 'Bookmarked' : 'Not bookmarked') : k === 'vw' ? (v === '1' ? 'Viewed' : 'Unviewed') : k === 'new' ? 'New : 5 days'
          : `${lab[k]}: ${k === 'imp' ? v[0].toUpperCase() + v.slice(1) : k === 'apt' ? v.replace('|', ' RWY ') : v}`;
        return `<i>${esc(txt)}</i>`;
      }).join('');
    };
    paint();
    const save = () => notamStore.put(flight, st);
    const markViewed = (c) => { if (st.v[c.dataset.nid]) return; st.v[c.dataset.nid] = 1; c.classList.add('seen'); save(); setTimeout(paint, 700); };
    // Viewed = tapped, or on screen for at least 1 s (user guide 4.5.1.2)
    const onScreen = (c, vr) => { const r = c.getBoundingClientRect(); return r.height && !c.hidden && r.bottom > vr.top + 60 && r.top < vr.bottom - 20; };
    let tmr = null;
    const check = () => {
      const vr = dv.getBoundingClientRect();
      const seen = cards.filter((c) => !st.v[c.dataset.nid] && onScreen(c, vr));
      setTimeout(() => { const v2 = dv.getBoundingClientRect(); seen.forEach((c) => { if (onScreen(c, v2) && document.body.contains(c)) markViewed(c); }); }, 1000);
      const top = wrap.querySelector('.mp-nsech')?.getBoundingClientRect().bottom || vr.top;
      wrap.querySelectorAll('.mp-nsubh').forEach((h) => h.classList.toggle('stuck', h.getBoundingClientRect().top <= top + 1 && h.parentElement.getBoundingClientRect().bottom > top + h.offsetHeight));
    };
    const onScroll = () => { clearTimeout(tmr); tmr = setTimeout(check, 150); };
    if (dv._notamScroll) dv.removeEventListener('scroll', dv._notamScroll);
    dv._notamScroll = onScroll;
    dv.addEventListener('scroll', onScroll);
    setTimeout(check, 300);
    wrap.addEventListener('click', (e) => {
      const card = e.target.closest('.mp-nc');
      if (!card) return;
      const id = card.dataset.nid;
      const menu = card.querySelector('.mp-nmenu');
      const opt = e.target.closest('[data-pri]');
      if (opt) {
        const p = opt.dataset.pri;
        if (p === 'undefined') delete st.p[id]; else st.p[id] = p;
        menu.hidden = true; save(); paint(); e.stopPropagation(); return;
      }
      if (e.target.closest('.mp-nkb') || e.target.closest('.mp-nch > .mp-npri')) {
        const open = menu.hidden;
        wrap.querySelectorAll('.mp-nmenu').forEach((x) => { x.hidden = true; });
        menu.hidden = !open; e.stopPropagation(); return;
      }
      if (e.target.closest('.mp-nbm')) { if (st.b[id]) delete st.b[id]; else st.b[id] = 1; save(); paint(); return; }
      wrap.querySelectorAll('.mp-nmenu').forEach((x) => { x.hidden = true; });
      markViewed(card);
    });
    // filter panel
    const read = () => {
      panel.querySelectorAll('[data-nf]').forEach((el) => { F[el.dataset.nf] = el.type === 'checkbox' ? el.checked : el.value.trim(); });
      paint();
    };
    panel.addEventListener('input', read);
    panel.addEventListener('change', read);
    panel.querySelector('.mp-nclear').addEventListener('click', () => {
      panel.querySelectorAll('[data-nf]').forEach((el) => { if (el.type === 'checkbox') el.checked = false; else el.value = ''; });
      read();
    });
    const ftool = dv.querySelector('.mp-t-filter');
    const toggle = () => { panel.hidden = !panel.hidden; dv.classList.toggle('nf-open', !panel.hidden); ftool.classList.toggle('on', !panel.hidden); };
    ftool.classList.remove('on');
    ftool.onclick = toggle;
    // ALL: from a pre-filtered document, switch to the All NOTAMs document
    const allBtn = dv.querySelector('.mp-t-all');
    const isAll = !!wrap.closest('.mp-dvb') && title.textContent.startsWith('All NOTAMs');
    allBtn.hidden = isAll;
    allBtn.onclick = () => screen.querySelector('.mp-dri[data-mp-doc="notam:allnotam"]')?.click();
  }


  // ===================================================================================================
  // Documents built from the Mission+ v2.3.0 User Guide (Feb 2026) where no photo was available.
  // ===================================================================================================
  const hmS = (sec) => { if (sec == null || Number.isNaN(sec)) return ''; const mn = Math.round(Math.abs(sec) / 60); return `${Z(Math.floor(mn / 60), 2)}:${Z(mn % 60, 2)}`; };
  // A time that follows the Nav Log (white = plan, green = revised by an ATA): see liveDocs()
  const dynZ = (d, cls = '') => (d ? `<b class="${cls}" data-dyn="${d.getTime()}">${esc(zt(d))}</b>` : '<b>-</b>');
  const txtDoc = (lines) => `<pre class="mp-txt">${esc(lines.filter((x) => x != null).join('\n'))}</pre>`;
  const pnl = (title, inner, cls = '') => `<div class="mp-pn ${cls}">${title ? `<div class="mp-pnh">${title}</div>` : ''}${inner}</div>`;
  const wrapTxt = (txt, w = 64) => {
    const out = [];
    String(txt || '').split('\n').forEach((para) => {
      let line = '';
      para.replace(/\s+/g, ' ').trim().split(' ').forEach((wd) => {
        if (line && `${line} ${wd}`.length > w) { out.push(line); line = wd; } else line = line ? `${line} ${wd}` : wd;
      });
      out.push(line);
    });
    return out;
  };
  const dtg = (v) => { const mt = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(str(v)); return mt ? new Date(Date.UTC(+mt[1], +mt[2] - 1, +mt[3], +mt[4], +mt[5])) : null; };
  const ddMon = (d) => (d ? `${Z(d.getUTCDate(), 2)} ${MON[d.getUTCMonth()]}` : '');

  // ---------------- Flt Prep > Load & Fuel (guide 4.2.4) ----------------
  function loadFuelPage(m) {
    const { o } = m;
    const f = o.fuel, w = o.wts, t = o.times, W = o.W;
    const A = o.alts[0], D = o.dest || {};
    const altRaw = asArray(o.raw.alternate)[0] || {};
    const n = (v) => (str(v) === '' ? '-' : String(W(v)));
    const loading = [
      ['Passengers', String(Math.round(num(w.pax_count)))],
      ['Cargo', n(w.cargo)],
      ['Zero Fuel Weight', n(w.est_zfw)],
      ['Ramp Weight', String(W(w.est_zfw) + W(f.plan_ramp))],
      ['Block Fuel', n(f.plan_ramp), 'g'],
      ['Taxi Out', n(f.taxi)],
      ['Min Fuel for T/O', String(m.fuel.minTo), 'g'],
      ['Takeoff Gross Wt', n(w.est_tow)],
      ['Trip Fuel', n(f.enroute_burn)],
      ['FMS Reserve Fuel', String(m.fuel.minLdg)],
      ['Landing Weight', n(w.est_ldw)],
      ['Landing Fuel', n(f.plan_landing)],
    ];
    const resMin = Math.round(secs(t.reserve_time) / 60);
    const extras = asArray(o.raw.fuel_extra?.bucket).filter((b) => num(b.fuel) > 0);
    const rows = [
      ['Trip', D.icao, n(f.enroute_burn), hmS(secs(t.est_time_enroute)), ''],
      ['Contingency Fuel', '', n(f.contingency), hmS(secs(t.contfuel_time)), str(o.general.cont_rule) ? `CONT ${up(o.general.cont_rule)}` : ''],
      ['Alternate', A?.icao || '', A ? n(f.alternate_burn) : '', A ? hmS(secs(altRaw.ete)) : '', ''],
      ['Reserve', '', n(f.reserve), hmS(secs(t.reserve_time)), resMin ? `-${resMin} MIN HOLD AT ${A ? 'ALTN' : 'DEST'}` : ''],
      ['Minimum Reserve', '', '', '', ''],
      ...(num(f.etops) > 0 ? [['ETOPS Fuel', '', n(f.etops), hmS(secs(t.etopsfuel_time)), 'ETOPS CRITICAL FUEL']] : []),
      ['Discrnry Cont Fuel', '', n(f.extra), num(f.extra) ? hmS(secs(t.extrafuel_time)) : '', extras.map((b) => up(b.label)).join(' / ')],
      ['Take Off Fuel', '', n(f.plan_takeoff), '', '', 'b'],
      ['Taxi Out', '', n(f.taxi), hmS(secs(t.taxi_out)), ''],
      ['Fuel Required To Dest', '', n(f.plan_ramp), '', ''],
      ['Block Fuel', '', n(f.plan_ramp), '', '', 'b'],
      ['Plan T/O Fuel', '', n(f.plan_takeoff), '', ''],
      ['Plan Landing Fuel', '', n(f.plan_landing), '', '', 'g'],
      ['Min Lndg Fuel at Dest', '', String(m.fuel.minLdg), '', ''],
      ['Available Delay Fuel', '', String(m.fuel.delay), num(f.avg_fuel_flow) ? hmS((m.fuel.delay / W(f.avg_fuel_flow)) * 3600) : '', ''],
      ['Taxi In', D.icao, '', hmS(secs(t.taxi_in)), ''],
    ];
    return `
      ${pnl('Aircraft Loading', `<table class="mp-lf"><tr><th></th><th>Planned<br>(lb)</th></tr>${loading.map(([k, v, c]) => `<tr><td>${k}</td><td class="${c || ''}">${esc(v)}</td></tr>`).join('')}</table>`)}
      ${pnl('Mission Fueling', `<table class="mp-lf mp-lf2"><tr><th></th><th></th><th>Planned<br>(lb)</th><th>Time</th><th class="l">Information</th></tr>${rows.map(([k, code, v, tm, info, c]) => `
        <tr class="${c === 'b' ? 'b' : ''}"><td>${k}</td><td class="code">${esc(code)}</td><td class="${c === 'g' ? 'g' : ''}">${esc(v)}</td><td>${esc(tm)}</td><td class="l">${esc(info)}</td></tr>`).join('')}</table>`)}`;
  }

  // ---------------- Flt Prep > FDRA "To Sign" (guide 4.2.1): pilot info + accept, then Flight Information + Load & Fuel
  function fdraPage(m) {
    const { o } = m;
    const lastFirst = (nm) => { const p = up(nm).split(/\s+/).filter(Boolean); return p.length > 1 ? `${p.slice(1).join(' ')} ${p[0]}` : p[0] || ''; };
    const names = m.crewDeck.map((c) => ({ n: lastFirst(c.name), e: c.emp }));
    return `
      <div class="mp-fdra">
        <div class="mp-fdrah"><span class="mp-fih">Pilot Information</span><button type="button" class="mp-btn mp-accept">ACCEPT</button></div>
        <div class="mp-fip">
          <div class="mp-fdrag">
            <label>Name *<select data-fdra="name">${names.map((x) => `<option value="${esc(x.n)}" data-emp="${esc(x.e)}">${esc(x.n)}</option>`).join('')}<option value="">+ Add New Item</option></select>
              <input data-fdra="newname" placeholder="LAST FIRST" hidden></label>
            <label>Staff No<input data-fdra="staff" value="${esc(names[0]?.e || '')}" inputmode="numeric"></label>
          </div>
          <p class="mp-fdrat"><b>CAPTAIN(S)</b><br>By accepting, the captain confirms review of this release, the weather and NOTAMs for the departure, destination and alternate airports, and any special airport qualification required for this flight, and agrees the flight can be operated safely as planned.</p>
          <p class="mp-fdrat"><b>FIRST OFFICER(S)</b><br>By accepting, the first officer confirms review of this release.</p>
          <p class="mp-fdrat">Each pilot also confirms being fit for duty for this flight.</p>
          <p class="mp-fdrat">BY TAPPING ACCEPT, I AGREE WITH AND ACCEPT THE ABOVE STATEMENT</p>
          <div class="mp-fdras" hidden></div>
        </div>
        ${flightInfoPage(m)}
        <div class="mp-fih">Load &amp; Fuel</div>${loadFuelPage(m)}
      </div>`;
  }

  // ---------------- Flt Prep > remarks / text documents ----------------
  const remList = (v) => asArray(v).map(str).filter((x) => x && up(x) !== 'NONE');
  function lfRemarksPage(m) {
    const { o } = m;
    const f = o.fuel, W = o.W;
    const ex = asArray(o.raw.fuel_extra?.bucket).filter((b) => num(b.fuel) > 0);
    return txtDoc([
      'LOAD AND FUEL REMARKS', '',
      `PAYLOAD ${W(o.wts.payload)} LB   MAX PAYLOAD ${C.maxPayload(o)} LB`,
      `PAX ${Math.round(num(o.wts.pax_count))}   BAGS ${Math.round(num(o.wts.bag_count))}   CARGO ${W(o.wts.cargo)} LB`,
      '',
      'DISCRETIONARY FUEL',
      ...(ex.length ? ex.map((b) => `  ${C.L(up(b.label), 12)} ${C.L(String(W(b.fuel)), 8)} LB  ${hmS(num(b.time) * 60)}`) : ['  NIL']),
      '',
      num(f.extra_optional) > 0 ? `TANKERING/OPTIONAL FUEL ${W(f.extra_optional)} LB` : 'NO TANKERING PLANNED',
      `MAX TANKS ${W(f.max_tanks)} LB   AVG FUEL FLOW ${W(f.avg_fuel_flow)} LB/HR`,
    ]);
  }
  function fpRemarksPage(m) {
    const { o } = m;
    const dx = remList(o.general.dx_rmk);
    const mel = str(o.settings.mpMel).split('\n').map((x) => x.trim()).filter(Boolean);
    const sec = (t, lines) => `<div class="mp-fisub">${esc(t)}</div><pre class="mp-fipre">${esc(lines.join('\n'))}</pre>`;
    return pnl('', [
      sec('Dispatcher Remarks', dx.length ? dx.flatMap((x) => wrapTxt(up(x))) : ['NIL']),
      sec('ATC Flight Plan', [str(o.atc.flightplan_text) || 'NOT AVAILABLE']),
      sec('MEL', mel.length ? mel.map(up) : ['MEL-CDL NIR']),
      sec('Gate Info', [`ARR GATE ${o.dest?.icao || ''} TBA`]),
    ].join(''));
  }
  function companyRemarksPage(m) {
    const { o } = m;
    const sys = remList(o.general.sys_rmk);
    const ports = [o.origin, o.dest, ...o.alts].filter(Boolean);
    return txtDoc([
      'COMPANY REMARKS', '',
      'FLIGHT OPERATIONS AND MAINTENANCE REMARKS',
      ...(sys.length ? sys.flatMap((x) => wrapTxt(up(x))) : ['  NIL']), '',
      `CITY PAIR REMARKS ${o.origin?.icao || ''}-${o.dest?.icao || ''}`, '  NIL', '',
      'AIRPORT REMARKS', ...ports.map((p) => `  ${p.icao}: NIL`), '',
      'WAYPOINT NOTAMS', '  NIL',
    ]);
  }
  function adrPage(m) {
    const { o } = m;
    const mel = str(o.settings.mpMel).split('\n').map((x) => x.trim()).filter(Boolean);
    return txtDoc([
      'AIRCRAFT DISCREPANCY REPORT', '',
      `SHIP ${o.fleet}   REG ${o.reg}   TYPE ${o.icaoType}`,
      `AS OF ${ddMon(o.generated)} ${zt(o.generated)}`, '',
      'MEL:', ...(mel.length ? mel.map((x, i) => `  ${Z(i + 1, 2)} ${up(x)}`) : ['  NIL']),
      'CDL:', '  NIL', 'NEF:', '  NIL', 'SPL:', '  NIL',
    ]);
  }
  const gatePage = () => txtDoc(['NO GATE MESSAGE']);

  // ---------------- Flt Prep > Crew List / Crew Connections (guide 4.2.14-15) ----------------
  function crewPilots(m) {
    const s = m.o.settings || {};
    const n = num(s.mpPilots) || (m.air > 12 * 3600 ? 4 : m.air > 8.5 * 3600 ? 3 : 2);
    const p = m.crewDeck.map((c) => ({ ...c }));
    while (p.length < n) p.push({ name: `RELIEF PILOT ${p.length - 1}`, role: 'Relief Pilot', emp: '' });
    return p.slice(0, Math.max(n, p.length));
  }
  function crewListPage(m) {
    const pos = (r) => (r === 'Captain' ? 'CA' : r === 'First Officer' ? 'FO' : r === 'Purser' ? 'FA-A' : r === 'Relief Pilot' ? 'RFO' : 'FA');
    const tbl = (list) => `<table class="mp-crt"><tr><th>Position</th><th>Name</th><th>Rank</th><th>Employee #</th></tr>${list.map((c) => `<tr><td>${pos(c.role)}</td><td>${esc(c.name)}</td><td>${esc(c.role)}</td><td>${esc(c.emp || '-')}</td></tr>`).join('')}</table>`;
    return `
      ${pnl('Flight Deck Crew', tbl(crewPilots(m)))}
      ${pnl('Cabin Crew', m.crewCabin.length ? tbl(m.crewCabin) : '<p class="mp-dvempty">No cabin crew listed</p>')}`;
  }
  function crewConnPage(m) {
    const pos = (r) => (r === 'Captain' ? 'CA' : r === 'First Officer' ? 'FO' : r === 'Purser' ? 'FA-A' : r === 'Relief Pilot' ? 'RFO' : 'FA');
    const list = (rows) => rows.map((c) => `<tr><td>${pos(c.role)}</td><td>${esc(c.name)}</td><td>-</td><td>-</td><td>-</td></tr>`).join('');
    return `
      ${pnl('Incoming flights', `<table class="mp-crt"><tr><th colspan="2">Flight Deck Crew</th><th colspan="3">Flights</th></tr>${list(crewPilots(m))}
        <tr><th colspan="2">Cabin Crew</th><th colspan="3">Flights</th></tr>${list(m.crewCabin)}</table>`)}
      ${pnl('Outgoing flights', '<p class="mp-dvempty c">No outbound connection information</p>')}`;
  }

  // ---------------- Flt Prep > FDP LATT / Block LATT (guide 4.2.11-12) ----------------
  // SimBrief has no duty data, so limits come from 14 CFR 117: Table B (unaugmented FDP by local report
  // time, 1-2 segments), Table C (augmented, class 1 rest) and Table A (flight time). Report = STD − 60 min.
  const FDP_B = [[0, 9], [4, 10], [5, 12], [6, 13], [7, 14], [12, 13], [13, 12], [17, 12], [22, 11], [23, 10]];
  const FDP_C = [[0, 15, 17], [6, 16, 18.5], [7, 17, 19], [13, 16, 18.5], [17, 15, 17]];
  function lattData(m) {
    const s = m.o.settings || {};
    const pilots = crewPilots(m);
    const nP = pilots.length;
    const rep = str(s.mpReport) === '' ? 60 : num(s.mpReport);
    const report = m.sOut ? new Date(m.sOut.getTime() - rep * 60e3) : null;
    const lh = report ? new Date(report.getTime() + (m.tzO || 0) * 3600e3).getUTCHours() : 12;
    const fdp = nP <= 2 ? [...FDP_B].reverse().find(([h]) => lh >= h)[1] : [...FDP_C].reverse().find(([h]) => lh >= h)[nP === 3 ? 1 : 2];
    const ftl = nP <= 2 ? (lh >= 5 && lh < 20 ? 9 : 8) : nP === 3 ? 13 : 17;
    const taxiIn = secs(m.o.times.taxi_in);
    return { pilots, nP, report, lh, fdp, ftl, taxiIn };
  }
  function fdpLattPage(m) {
    const L = lattData(m);
    const ete = m.air;
    const latt = L.report ? new Date(L.report.getTime() + (L.fdp * 3600 - ete - L.taxiIn) * 1000) : null;
    const ext = latt ? new Date(latt.getTime() + 2 * 3600e3) : null;
    const cell = (d) => `<b data-latt="${d ? d.getTime() : ''}">${esc(zt(d))}</b><b class="g" data-rev>—</b>`;
    return `
      <div class="mp-latt" data-kind="fdp" data-ete="${ete}">
        <div class="mp-lattop">
          ${pnl('ETE', `<div class="mp-lc"><small>Planned</small><small>Revised</small><b>${esc(hmS(ete))}</b><input class="mp-in w4" data-latt-in placeholder="hhmm" maxlength="5" inputmode="numeric"></div>`)}
          ${pnl('Most Restrictive FDP LATT', `<div class="mp-lc"><small>Planned</small><small>Revised</small>${cell(latt)}</div>`, 'c')}
          ${pnl('Most Restrictive LATT With Extension', `<div class="mp-lc"><small>Planned</small><small>Revised</small>${cell(ext)}</div>`, 'c')}
        </div>
        <div class="mp-fih">Details</div>
        <div class="mp-lattd">
          ${pnl('Crew List', L.pilots.map((p) => `<div class="mp-lcrew"><b>${esc(p.name)}</b><small>${esc(p.role.replace(' ', ''))}</small></div>`).join(''))}
          ${pnl('FDP LATT', `<div class="mp-lc mp-lcol"><small>Planned</small><small>Revised</small>${L.pilots.map(() => cell(latt)).join('')}</div>`, 'c')}
          ${pnl('FDP LATT With Extension', `<div class="mp-lc mp-lcol"><small>Planned</small><small>Revised</small>${L.pilots.map(() => cell(ext)).join('')}</div>`, 'c')}
        </div>
        <p class="mp-lnote">Limits: 14 CFR 117 ${L.nP <= 2 ? 'Table B' : 'Table C (class 1 rest)'} · ${L.nP} pilots · report ${esc(zt(L.report))} (${Z(L.lh, 2)}L) · max FDP ${L.fdp} h, +2 h extension. Pilots and report time are in Settings.</p>
      </div>`;
  }
  function blockLattPage(m) {
    const L = lattData(m);
    const maxTaxi = L.ftl * 3600 - m.air - L.taxiIn;
    const latt = m.eOut ? new Date(m.eOut.getTime() + maxTaxi * 1000) : null;
    const cell = (d) => `<b data-latt="${d ? d.getTime() : ''}">${esc(zt(d))}</b><b class="g" data-rev>—</b>`;
    return `
      <div class="mp-latt" data-kind="block" data-etd="${m.eOut ? m.eOut.getTime() : ''}">
        <div class="mp-lattop">
          ${pnl('ETD', `<div class="mp-lc"><small>Planned</small><small>Revised</small><b>${esc(zt(m.eOut))}</b><input class="mp-in w4" data-latt-in placeholder="hhmm" maxlength="5" inputmode="numeric"></div>`)}
        </div>
        <div class="mp-fih">Details</div>
        <div class="mp-lattd">
          ${pnl('Crew List', L.pilots.map((p) => `<div class="mp-lcrew"><b>${esc(p.name)}</b><small>${esc(p.role.replace(' ', ''))}</small></div>`).join(''))}
          ${pnl('Max Taxi Time', `<div class="mp-lcol1"><small>&nbsp;</small>${L.pilots.map(() => `<b>${esc(hmS(maxTaxi))}</b>`).join('')}</div>`, 'c')}
          ${pnl('Block LATT', `<div class="mp-lc mp-lcol"><small>Planned</small><small>Revised</small>${L.pilots.map(() => cell(latt)).join('')}</div>`, 'c')}
        </div>
        <p class="mp-lnote">Limits: 14 CFR 117 Table A flight time ${L.ftl} h (${L.nP} pilots). Max taxi time = flight time limit − ETE − taxi-in.</p>
      </div>`;
  }

  // ---------------- Flt Prep > Crew Rest Calculation (guide 4.2.16; flights over 5 h) ----------------
  function restPage(m, kind) {
    const pilots = crewPilots(m);
    const ini = (n) => n.split(/\s+/).filter(Boolean).map((x) => x[0]).slice(0, 2).join('');
    return `<div class="mp-rest" data-rest="${kind}" data-off="${m.eOff ? m.eOff.getTime() : ''}" data-on="${m.eOn ? m.eOn.getTime() : ''}" data-air="${m.air}"
      data-pilots="${esc(JSON.stringify(pilots.map((p) => [p.name, ini(p.name)])))}"></div>`;
  }

  // ---------------- In Flight > Enroute Information (guide 4.3.1) ----------------
  function enrInfoPage(m) {
    const { o } = m;
    const rows = navRows(m, o.raw);
    const at = (r) => dynZ(r.eta, '');
    const tocF = o.navlog.find((x) => up(x.ident) === 'TOC');
    const trop0 = num(tocF?.tropopause_feet) || num(o.general.avg_tropopause);
    let tropRow = null, past = false;
    rows.forEach((r) => {
      if (r.toc) past = true;
      if (r.tod) past = false;
      const tf = num(r.f?.tropopause_feet);
      if (!tropRow && past && trop0 && tf && tf < trop0 - 4000) tropRow = r;
    });
    // FIR entries: navlog fir_crossing, else a change of the fix's FIR
    const firs = [];
    let prevFir = up(o.navlog[0]?.fir);
    rows.forEach((r) => {
      const fc = asArray(r.f?.fir_crossing).filter((x) => x && x.fir_icao);
      fc.forEach((x) => firs.push({ r, fir: up(x.fir_icao), name: up(x.fir_name), lat: num(x.pos_lat_entry), lon: num(x.pos_long_entry) }));
      if (!fc.length && r.fir && prevFir && r.fir !== prevFir && !firs.some((x) => x.fir === r.fir)) firs.push({ r, fir: r.fir, name: '', lat: r.lat, lon: r.lon });
      if (r.fir) prevFir = r.fir;
    });
    const pos = (lat, lon) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '';
      const f = (v, w) => { const a = Math.abs(v); const d = Math.floor(a); const mm = ((a - d) * 60).toFixed(1); return `${Z(d, w)}${mm.padStart(4, '0')}`; };
      return `${lat >= 0 ? 'N' : 'S'}${f(lat, 2)} ${lon >= 0 ? 'E' : 'W'}${f(lon, 3)}`;
    };
    const terrain = rows.filter((r) => num(r.f?.mora) >= 10000 && !r.origin);
    // Key info
    const key = [];
    const O = o.origin || {}, D = o.dest || {};
    key.push({ id: O.icao, d: m.eOut, info: ['Departure'] });
    key.push({ id: '', d: m.eOff, info: ['Take off'] });
    let lastFl = num(o.general.initial_altitude);
    const steps = fiBits(m).steps.slice(1);
    rows.forEach((r, i) => {
      if (r.origin) return;
      const info = [], act = [];
      if (r.toc) info.push(`Top of climb FL${Z(C.flOf(r.f.altitude_feet), 3)}`);
      if (r.tod) info.push('Top of descent');
      firs.filter((x) => x.r === r).forEach((x) => info.push(`Entering FIR ${x.fir}${x.name ? ` (${x.name})` : ''}`));
      if (r.rpt) { act.push('ACTION'); info.push(`Reporting Point (${r.id})`); }
      steps.filter(([fx]) => fx === r.id).forEach(([, fl]) => { if (fl * 100 !== lastFl) { act.push('ACTION'); info.push(`Climb to reach FL${Z(fl, 3)} at ${rows[i + 1]?.id || r.id}`); lastFl = fl * 100; } });
      if (tropRow === r) { act.push('FMS'); info.push(`Consider FMS Tropopause Update (Tropopause = ${Math.round(num(r.f.tropopause_feet) / 100)})`); }
      if (terrain.includes(r)) info.push('TERRAIN');
      if (/^ETP/.test(r.id)) { act.push('FMS'); info.push(`ETOPS ${r.f?.name || 'equal time point'}`); }
      if (info.length) key.push({ id: fixName(r.id), d: r.eta, act, info });
    });
    key.push({ id: D.icao, d: m.eOn, info: ['Landing'] });
    const tbl = (head, body) => `<table class="mp-eit"><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>${body}</table>`;
    return `
      ${pnl('Tropopause and FMS Setting:', tropRow
    ? `<p class="mp-eip">Arriving On Waypoint <b>${esc(tropRow.id)}</b> (${dynZ(tropRow.eta, 'gr')}) - Consider FMS Tropopause Update. (Tropopause = ${Math.round(num(tropRow.f.tropopause_feet) / 100)})</p>`
    : '<p class="mp-eip">No tropopause drop of more than 4000 ft from the top of climb value.</p>', 'c')}
      ${pnl('Terrain:', terrain.length ? `<div class="mp-eis">Critical Terrain Summary:</div>${tbl(['Waypoint', 'ETA', 'Critical Terrain Info'], terrain.map((r) => `<tr><td>${esc(r.id)}</td><td>${at(r)}</td><td>** MORA ${Math.round(num(r.f.mora) / 100) * 100} FT ** ${esc(pos(r.lat, r.lon))} **</td></tr>`).join(''))}` : '<p class="mp-eip">No critical terrain information for this route.</p>', 'c')}
      ${pnl('Navigation:', firs.length ? `<div class="mp-eis">FIR Information:</div>${tbl(['Waypoint', 'ETA', 'Entering'], firs.map((x) => `<tr><td>${esc(x.r.id)}</td><td>${at(x.r)}</td><td>** FIR ${esc(x.fir)}${x.name ? ` (${esc(x.name)})` : ''} ** ${esc(pos(x.lat, x.lon))} **</td></tr>`).join(''))}` : '<p class="mp-eip">No FIR boundary crossed.</p>', 'c')}
      ${pnl('Key info / Activities during flight:', tbl(['Waypoint', 'Time', 'Action', 'Info / Event / Actions'], key.map((k) => `<tr><td>${esc(k.id)}</td><td>${dynZ(k.d, '').replace(/Z<\/b>$/, '</b>').replace(/>(\d\d:\d\d)Z</, '>$1<')}</td><td>${(k.act || []).map(esc).join('<br>')}</td><td>${k.info.map(esc).join('<br>')}</td></tr>`).join('')), 'c')}`;
  }

  // ---------------- In Flight > Oceanic Tracks (guide 4.3.5) ----------------
  function oceanicPage(m) {
    const t = m.o.raw.tracks || {};
    const msgs = [];
    Object.entries(t.nat_notams || {}).forEach(([k, v]) => { if (str(v)) msgs.push(['North Atlantic Tracks', up(k), str(v)]); });
    Object.entries(t).filter(([k]) => k !== 'nat_notams').forEach(([k, v]) => {
      asArray(v).forEach((x) => { if (typeof x === 'string') msgs.push([up(k), '', x]); else if (x && (x.ident || x.route)) msgs.push([up(k), '', `${up(x.ident)} ${up(x.route)}`]); });
    });
    if (!msgs.length) return txtDoc(['NO OCEANIC TRACK MESSAGE IN THIS FLIGHT PLAN']);
    const bar = '#'.repeat(40);
    return txtDoc(msgs.flatMap(([title, src, body]) => [bar, `# ${title}${src ? ` - ${src}` : ''} #`, bar, '', ...body.trimEnd().split('\n'), '']));
  }

  // ---------------- Weather > METAR & TAF (guide 4.6.1) ----------------
  const WX_RED = /(TS|FZ|IC|PL|GR|GS|FG|VA|PO|SQ|FC|SS|DS)/;
  const WX_AMB = /(SH|DZ|RA|SN|SG|UP)/;
  const sev = (cls) => (cls === 'r' ? 2 : cls === 'a' ? 1 : 0);
  function wxColor(tok, isMetar, afterWind) {
    let mt;
    if (/^(\+|-|VC)?(MI|PR|BC|DR|BL|SH|TS|FZ)?(DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PO|SQ|FC|SS|DS)+$/.test(tok) || /^(\+|-|VC)?(TS|SH)$/.test(tok)) {
      return WX_RED.test(tok.replace(/^(\+|-|VC)/, '')) ? 'r' : WX_AMB.test(tok) ? 'a' : '';
    }
    if ((mt = /^(\d{3}|VRB)(\d{2,3})(G(\d{2,3}))?(KT|MPS)$/.exec(tok))) {
      const k = mt[5] === 'MPS' ? 1.944 : 1;
      const v = Math.max(num(mt[2]), num(mt[4])) * k;
      return v > 30 ? 'r' : v > 20 ? 'a' : '';
    }
    if (/^[MP]?(\d+|\d\/\d)SM$/.test(tok)) {
      const x = tok.replace(/^[MP]/, '').replace('SM', '');
      const v = x.includes('/') ? num(x.split('/')[0]) / num(x.split('/')[1]) : num(x);
      return v < 1 ? 'r' : v < 3 ? 'a' : '';
    }
    if (afterWind && /^\d{4}(NDV)?$/.test(tok)) {
      const v = num(tok.slice(0, 4));
      return v >= 9999 ? '' : v < 1600 ? 'r' : v < 4800 ? 'a' : '';
    }
    if (isMetar && (mt = /^(M?\d{2})\/(M?\d{2})?$/.exec(tok))) {
      const t = num(mt[1].replace('M', '-'));
      return t < -5 ? 'r' : t < 11 ? 'a' : '';
    }
    return '';
  }
  function wxHtml(text, isMetar) {
    let rmk = false, prev = '';
    return esc(text).split(/(\s+)/).map((tok) => {
      if (!tok || /^\s+$/.test(tok)) return tok;
      if (tok === 'RMK') rmk = true;
      const c = rmk ? '' : wxColor(tok, isMetar, /(KT|MPS)$|^\d{3}V\d{3}$/.test(prev));
      prev = tok;
      return c ? `<span class="wx${c}">${tok}</span>` : tok;
    }).join('');
  }
  // METAR obs "ddhhmmZ"; TAF issue "ddhhmmZ" + validity "ddhh/ddhh" -> Dates around a reference
  const wxDate = (dd, hh, mm, ref) => {
    if (!ref) ref = new Date();
    let best = null;
    [-1, 0, 1].forEach((k) => {
      const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + k, +dd, +hh % 24, +mm));
      if (+hh === 24) d.setUTCDate(d.getUTCDate() + 1);
      if (!best || Math.abs(d - ref) < Math.abs(best - ref)) best = d;
    });
    return best;
  };
  const dmy = (d) => (d ? `${Z(d.getUTCDate(), 2)} ${MON[d.getUTCMonth()]} ${Z(d.getUTCHours(), 2)}:${Z(d.getUTCMinutes(), 2)}` : '');
  function wxTiles(port, label, ref, refLabel, metars, tafs) {
    const icao = up(port.icao || port.icao_code);
    const iata = up(port.iata || port.iata_code || port.code);
    const now = new Date();
    const mt = asArray(metars).map(str).filter(Boolean);
    const tf = asArray(tafs).map(str).filter(Boolean);
    const metarTile = (txt) => {
      const g = /\b(\d{2})(\d{2})(\d{2})Z\b/.exec(txt);
      const obs = g ? wxDate(g[1], g[2], g[3], ref || now) : null;
      const st = !ref || !obs ? '' : obs >= ref - 2 * 3600e3 && obs <= +ref + 3600e3 ? 'ok' : 'old';
      const kind = /^SPECI/.test(txt) ? 'SPECI' : 'METAR';
      return `<div class="mp-wxt"><div class="mp-wxh"><span class="k">${kind}</span><i></i><span class="${st}">${esc(dmy(obs))}</span><span class="mp-grow"></span><span>${esc(icao)}</span></div>
        <div class="mp-wxrow"><span class="k">Original text</span><span class="mp-wxtx">${wxHtml(txt.replace(/\s+/g, ' ').trim(), true)}</span></div></div>`;
    };
    const tafTile = (txt) => {
      const flat = txt.replace(/\s+/g, ' ').trim();
      const g = /\b(\d{2})(\d{2})(\d{2})Z\b/.exec(flat);
      const v = /\b(\d{2})(\d{2})\/(\d{2})(\d{2})\b/.exec(flat);
      const iss = g ? wxDate(g[1], g[2], g[3], ref || now) : null;
      const from = v ? wxDate(v[1], v[2], '00', iss || ref || now) : null;
      const to = v ? wxDate(v[3], v[4], '00', from || ref || now) : null;
      const st = !ref || !from ? '' : from <= ref - 3600e3 && to >= +ref + 3600e3 ? 'ok' : 'old';
      const body = flat.replace(/\s(?=(BECMG|TEMPO|FM\d{6}|PROB\d{2}|RMK)\b)/g, '\n');
      return `<div class="mp-wxt"><div class="mp-wxh"><span class="k">TAF</span><i></i><span>${esc(dmy(iss))}</span>${from ? ` <span>(From <b class="${st}">${esc(dmy(from))}</b> to <b class="${st}">${esc(dmy(to))}</b>)</span>` : ''}<span class="mp-grow"></span><span>${esc(icao)}</span></div>
        <div class="mp-wxrow"><span class="k">Original text</span><span class="mp-wxtx">${body.split('\n').map((l) => wxHtml(l, false)).join('<br>')}</span></div></div>`;
    };
    return `
      <section class="mp-wxsec">
        <div class="mp-wxsh"><b>${esc(label)}</b><span>${refLabel ? `(${esc(refLabel)}: ${esc(dmy(ref))})` : ''}</span><b class="y">${esc(icao)}${iata ? ` / ${esc(iata)}` : ''}</b></div>
        <div class="mp-wxsub">Observation</div>${mt.length ? mt.map(metarTile).join('') : '<p class="mp-dvempty">No METAR available</p>'}
        <div class="mp-wxsub">Forecast</div>${tf.length ? tf.map(tafTile).join('') : '<p class="mp-dvempty">No TAF available</p>'}
      </section>`;
  }
  function wxPage(m, which) {
    const { o } = m;
    const wx = o.raw.weather || {};
    const O = o.origin, D = o.dest;
    const portWx = (p, fm, ft) => [p?.raw?.metar || fm, p?.raw?.taf || ft];
    if (which === 'o') return O ? wxTiles(O, 'Departure Airport', m.eOut, 'ETD', ...portWx(O, wx.orig_metar, wx.orig_taf)) : '';
    if (which === 'd') return D ? wxTiles(D, 'Arrival Airport', m.eIn, 'ETA', ...portWx(D, wx.dest_metar, wx.dest_taf)) : '';
    if (which === 'a') {
      const list = o.alts.filter(Boolean).map((a, i) => wxTiles(a, i === 0 ? 'Planned Alternate Airport' : 'Alternate Airport', null, '', a.raw?.metar, a.raw?.taf));
      if (o.toAlt) list.push(wxTiles(o.toAlt, 'Takeoff Alternate Airport', null, '', o.toAlt.raw?.metar, o.toAlt.raw?.taf));
      return list.join('') || '<p class="mp-dvempty">No alternate airport in this flight plan</p>';
    }
    // enroute: ETOPS suitable airports + enroute alternates
    const enr = [...asArray(o.raw.etops?.suitable_airport), ...asArray(o.raw.enroute_altn)].filter((x) => x && x.icao_code);
    const seen = new Set();
    const list = enr.filter((x) => !seen.has(x.icao_code) && seen.add(x.icao_code))
      .map((x) => wxTiles(x, m.etops ? 'ETOPS Suitable Airport' : 'Enroute Airport', null, '', x.metar, x.taf));
    return list.join('') || '<p class="mp-dvempty">No enroute airports in this flight plan</p>';
  }
  function atisPage(m) {
    const { o } = m;
    const order = [['Departure Airport', o.origin], ['Arrival Airport', o.dest], ...o.alts.filter(Boolean).map((a) => ['Alternate Airport', a])];
    const out = order.map(([lab, p]) => {
      const list = asArray(p?.raw?.atis).filter((x) => x && str(x.message)).sort((a, b) => (date(b.issued) || 0) - (date(a.issued) || 0));
      if (!list.length) return '';
      return `<section class="mp-wxsec"><div class="mp-wxsh"><b>${esc(lab)}</b><span></span><b class="y">${esc(p.icao)}${p.iata ? ` / ${esc(p.iata)}` : ''}</b></div>${list.map((x) => `
        <div class="mp-wxt"><div class="mp-wxh"><span class="k">ATIS ${esc(up(x.letter))}</span><i></i><span>${esc(dmy(date(x.issued)))}</span><span class="mp-grow"></span><span>${esc(up(x.type))} · ${esc(up(x.network))}</span></div>
        <div class="mp-wxrow"><span class="k">Message</span><span class="mp-wxtx">${esc(up(x.message)).replace(/\n/g, '<br>')}</span></div></div>`).join('')}</section>`;
    }).join('');
    return out || '<p class="mp-dvempty">No ATIS available for this flight</p>';
  }

  // ---------------- Weather > Forecasted Winds & Temp (guide 4.6.2) ----------------
  function windsPage(m) {
    const { o } = m;
    const isa = (ft) => Math.max(15 - 1.98 * (ft / 1000), -56.5);
    const tocF = o.navlog.find((x) => up(x.ident) === 'TOC');
    const trop0 = num(tocF?.tropopause_feet) || num(o.general.avg_tropopause);
    const fixes = o.navlog.filter((f) => !['TOC', 'TOD'].includes(up(f.ident)) && asArray(f.wind_data).length);
    const rows = fixes.map((f) => {
      const lv = asArray(f.wind_data).filter((x) => x && str(x.altitude) !== '').sort((a, b) => num(b.altitude) - num(a.altitude));
      const plan = num(f.altitude_feet);
      const near = lv.reduce((b, x) => (b == null || Math.abs(num(x.altitude) - plan) < Math.abs(num(b.altitude) - plan) ? x : b), null);
      const idx = Math.max(0, lv.indexOf(near));
      const pick = lv.slice(Math.max(0, Math.min(idx - 2, lv.length - 5)), Math.max(0, Math.min(idx - 2, lv.length - 5)) + 5);
      const tf = num(f.tropopause_feet);
      return `<div class="mp-wtr"><div class="mp-wtf">${esc(up(f.ident))}</div>
        <div class="mp-wtc"><small>Trop</small><b class="${trop0 && tf && tf < trop0 - 4000 ? 'a' : ''}">${tf ? Math.round(tf / 100) : '-'}</b></div>
        ${pick.map((x) => {
    const alt = num(x.altitude), oat = Math.round(num(x.oat)), dev = Math.round(oat - isa(alt));
    const dc = dev >= 15 ? 'r' : dev >= 11 ? 'a' : '';
    return `<div class="mp-wtc${x === near && plan > 10000 ? ' on' : ''}"><small>FL</small><b>FL${Z(Math.round(alt / 100), 3)}</b><small>Wind</small><b>${Z(num(x.wind_dir), 3)}/${Z(num(x.wind_spd), 2)}</b><small>OAT/ΔISA</small><b>${oat} <span class="${dc}">Δ${dev < 0 ? '-' : '+'}${Z(Math.abs(dev), 2)}</span></b></div>`;
  }).join('')}</div>`;
    }).join('');
    return `<div class="mp-wt">${rows || '<p class="mp-dvempty">No wind data in this flight plan</p>'}</div>
      <p class="mp-lnote">Static data from flight plan generation. ΔISA +11 to +14 amber, +15 or more red; TROP amber when more than 4,000 ft below the top-of-climb value.</p>`;
  }

  // ---------------- Weather > Field Conditions (guide 4.6.4) ----------------
  function fieldCondPage(m) {
    const { o } = m;
    const ports = [o.origin, o.dest, ...o.alts].filter(Boolean);
    const lines = ['FIELD CONDITIONS', ''];
    ports.forEach((p) => {
      const fc = p.notams.map((n) => up(str(n.notam_text) || str(n.notam_raw)).replace(/\s+/g, ' ').trim())
        .filter((t) => /FICON|RWYCC|\bRSC\b|SNOWTAM|BRAKING|CONTAMINATED|\bRWY\b.*\bCLSD\b|\bTWY\b.*\bCLSD\b|\bWET\b|\bICE\b|\bSNOW\b/.test(t));
      lines.push(`* ${p.icao}/${p.iata || p.code} FIELD REPORT *`, '-'.repeat(60));
      if (!fc.length) lines.push('NO FIELD CONDITION REPORTS - SEE NOTAMS');
      fc.slice(0, 12).forEach((t) => lines.push(...wrapTxt(t, 60), ''));
      lines.push('');
    });
    return txtDoc(lines);
  }

  // ---------------- Weather > Threat Plots (guide 4.6.3): SIGMETs along the route ----------------
  function threatPage(m) {
    const sig = m.o.sigmets.filter(Boolean);
    if (!sig.length) return '<p class="mp-dvempty">No threat plots (SIGMETs) for this flight</p>';
    return sig.map((x) => {
      if (typeof x === 'string') return pnl('', `<pre class="mp-fipre">${esc(x)}</pre>`);
      const haz = up(x.hazard) || 'SIGMET';
      const kind = /CONVECT|TS/.test(haz) ? 'ALERT' : /TURB/.test(haz) ? 'ALERT' : 'ADVISORY';
      const top = /TOPS?\s+(TO|ABV)?\s*FL(\d{3})/.exec(up(x.text));
      const rng = /FL(\d{3})\/(\d{3})|BTN\s+FL(\d{3})\s+AND\s+FL(\d{3})/.exec(up(x.text));
      return `<div class="mp-tp"><div class="mp-tph"><span class="k">${kind} ${esc(haz)}</span><b>${esc(up(x.fir) || '')}${x.id ? `–${esc(up(x.id))}` : ''}</b><i></i><span>${esc(dmy(date(x.issued)))} | From ${esc(dmy(date(x.start)))} To ${esc(dmy(date(x.end)))}</span></div>
        <div class="mp-tpr"><span class="k">Forecasted Location:<br>Area</span><span>${esc(up(x.fir_name) || up(x.fir) || '-')}</span></div>
        <div class="mp-tpr"><span class="k">Altitude</span><span>${rng ? `From FL ${rng[1] || rng[3]} To FL ${rng[2] || rng[4]}` : top ? `Tops FL ${top[2]}` : '-'}</span></div>
        <div class="mp-tpr"><span class="k">Advisory:</span><span>${esc(up(x.text))}</span></div></div>`;
    }).join('');
  }
  const imgDocPage = () => '<p class="mp-dvempty">Graphical threat plot charts are image products that SimBrief does not provide, so this page is empty in the converter.</p>';

  // ---------------- Other Docs ----------------
  function addendumPage(m) {
    const { o } = m;
    const L = lattData(m);
    const latt = L.report ? new Date(L.report.getTime() + (L.fdp * 3600 - m.air - L.taxiIn) * 1000) : null;
    const ext = latt ? new Date(latt.getTime() + 2 * 3600e3) : null;
    const d = (x) => (x ? `${Z(x.getUTCDate(), 2)}/${Z(x.getUTCHours(), 2)}${Z(x.getUTCMinutes(), 2)}Z` : '--/----Z');
    const mel = str(o.settings.mpMel).split('\n').map((x) => x.trim()).filter(Boolean);
    const fn = up(o.general.flight_number).replace(/\D/g, '');
    return txtDoc([
      '                    FLIGHT PLAN ADDENDUM', '',
      'STAY AT GATE FOR WDR', 'NONE', '',
      `FLT ${Z(fn || 0, 4)}/${Z(m.sOut?.getUTCDate() || 0, 2)}${up(MON[m.sOut?.getUTCMonth() || 0])}  SHIP ${o.fleet}  ${o.origin?.iata || o.origin?.icao}-${o.dest?.iata || o.dest?.icao}  RLS ${o.release}`, '',
      '-'.repeat(60),
      '****  LATEST ALLOWABLE TAKEOFF TIME                    ****',
      '****     DUE MAXIMUM FLIGHT DUTY PERIOD LIMIT           ****', '',
      ...L.pilots.flatMap((p) => [`${up(p.role)}  ${up(p.name)}`, `    DUTY LATT DUE MAX FDP LIMIT:                    ${d(latt)}`, `    DUTY LATT DUE MAX FDP LIMIT WITH EXTENSION:     ${d(ext)}`, '']),
      '-'.repeat(60), '',
      `PSGR CONFIG ${o.maxPax || '-'}  BOOKED ${Math.round(num(o.wts.pax_count))}`, '',
      'MEL NOTES:', ...(mel.length ? mel.map(up) : ['NIL']), '',
      'FLIGHT ATTENDANT BRIEFING GUIDE',
      `  FLIGHT TIME ${hmS(m.air)}   ${m.crewCabin.length} FLIGHT ATTENDANTS`,
    ]);
  }
  function cbpPage(m) {
    const html = str(m.o.raw.text?.plan_html);
    if (!html) return txtDoc(['NO CREW BRIEFING PACKAGE TEXT IN THIS FLIGHT PLAN']);
    const t = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(div|p|tr|h\d)>/gi, '\n').replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\n{3,}/g, '\n\n');
    return `<pre class="mp-txt mp-cbp">${esc(t.trim())}</pre>`;
  }
  function aboutFpPage() {
    const li = (a) => `<ul class="mp-help">${a.map((x) => `<li>${x}</li>`).join('')}</ul>`;
    return pnl('About Flight Plan', li([
      'Times are UTC (Z) unless marked (L) for local time.',
      'Weights and fuel are in pounds. FMS pages show thousands of pounds.',
      '<span class="g">Green</span> values are calculated or revised: planned block fuel, minimum fuel for takeoff, plan landing fuel, and any time revised from a Nav Log ATA.',
      'Route strings: waypoints and airports in white; airways, DCT, SID and STAR in <span class="g">green</span>; FL steps in <span class="b">blue</span> (amber for a step descent).',
      'ETA columns in Enroute Information, Alternates Summary and ETOPS start white (flight plan) and turn green once a Nav Log ATA revises them.',
      'Unread documents carry a bright bar in the drawer; the tab badge counts them.',
    ]));
  }
  function aboutWxPage() {
    const li = (a) => `<ul class="mp-help">${a.map((x) => `<li>${x}</li>`).join('')}</ul>`;
    return pnl('About Airport Weather', li([
      'METAR time is <span class="g">green</span> when the observation falls in the operating window (ETD/ETA −2 h to +1 h) and <span class="wxa">amber</span> when it is older.',
      'TAF validity is <span class="g">green</span> when it covers ETD/ETA ±1 h, <span class="wxa">amber</span> when it does not.',
      'Weather: <span class="wxr">red</span> for TS, FZ, IC, PL, GR, GS, FG, VA, PO, SQ, FC, SS, DS; <span class="wxa">amber</span> for SH, DZ, RA, SN, SG, UP.',
      'Wind and gusts: <span class="wxa">amber</span> above 20 kt, <span class="wxr">red</span> above 30 kt.',
      'Visibility: <span class="wxa">amber</span> below 3 SM, <span class="wxr">red</span> below 1 SM.',
      'METAR temperature: <span class="wxa">amber</span> below 11 °C, <span class="wxr">red</span> below −5 °C.',
    ]));
  }

  // ---------------- live behaviour for the documents above (called when a document opens) ----------------
  const LIVE_KEY = 'mp.docs';
  const liveStore = {
    get(f) { try { return (JSON.parse(localStorage.getItem(LIVE_KEY)) || {})[f] || {}; } catch { return {}; } },
    set(f, k, v) {
      try { const all = JSON.parse(localStorage.getItem(LIVE_KEY)) || {}; all[f] = { ...(all[f] || {}), [k]: v }; localStorage.setItem(LIVE_KEY, JSON.stringify(all)); } catch { /* storage unavailable */ }
    },
  };
  const hhmmZ = (d) => `${Z(d.getUTCHours(), 2)}:${Z(d.getUTCMinutes(), 2)}Z`;
  const parseHm = (v) => { const mt = /^(\d{1,2}):?([0-5]\d)$/.exec(String(v || '').trim()); return mt ? (+mt[1] * 60 + +mt[2]) * 60 : null; };
  function liveDocs(root, screen, body) {
    const flight = screen.dataset.flight;
    // 1) times that follow the Nav Log ATAs
    const shift = Number(root.dataset.mpShift) || 0;
    const rev = !!root.dataset.mpRev;
    body.querySelectorAll('[data-dyn]').forEach((el) => {
      const t = Number(el.dataset.dyn);
      if (!t) return;
      const d = new Date(t + (rev ? shift : 0));
      el.textContent = /Z$/.test(el.textContent) ? hhmmZ(d) : hhmmZ(d).slice(0, 5);
      el.classList.toggle('g', rev);
    });
    // 2) FDRA accept
    const fdra = body.querySelector('.mp-fdra');
    if (fdra) {
      const st = liveStore.get(flight).fdra;
      const btn = fdra.querySelector('.mp-accept'), msg = fdra.querySelector('.mp-fdras');
      const sel = fdra.querySelector('[data-fdra="name"]'), nn = fdra.querySelector('[data-fdra="newname"]'), staff = fdra.querySelector('[data-fdra="staff"]');
      const show = (x) => { btn.disabled = true; btn.textContent = 'ACCEPTED'; msg.hidden = false; msg.textContent = `Accepted by ${x.name}${x.staff ? ` (${x.staff})` : ''} at ${x.at}`; };
      if (st) show(st);
      sel.addEventListener('change', () => { nn.hidden = sel.value !== ''; const o = sel.selectedOptions[0]; if (o?.dataset.emp) staff.value = o.dataset.emp; });
      btn.addEventListener('click', () => {
        const name = sel.value || nn.value.trim().toUpperCase();
        if (!name) { nn.hidden = false; nn.focus(); return; }
        const x = { name, staff: staff.value.trim(), at: hhmmZ(new Date()) };
        liveStore.set(flight, 'fdra', x); show(x);
        root.querySelectorAll('.mp-dri[data-mp-doc="prep:fdra"] span').forEach((s) => { s.innerHTML = 'FDRA<br>Signed'; });
      });
    }
    // 3) LATT recalculation
    const latt = body.querySelector('.mp-latt');
    if (latt) {
      const kind = latt.dataset.kind;
      const inp = latt.querySelector('[data-latt-in]');
      const saved = liveStore.get(flight)[`latt-${kind}`];
      if (saved) inp.value = saved;
      const calc = () => {
        let delta = null;
        if (kind === 'fdp') { const s = parseHm(inp.value); if (s != null) delta = -(s - Number(latt.dataset.ete)); } else {
          const s = parseHm(inp.value), etd = Number(latt.dataset.etd);
          if (s != null && etd) { const d = new Date(etd); d.setUTCHours(0, 0, 0, 0); let r = d.getTime() + s * 1000; if (r - etd > 12 * 3600e3) r -= 86400e3; else if (etd - r > 12 * 3600e3) r += 86400e3; delta = r - etd; delta /= 1000; }
        }
        latt.querySelectorAll('[data-latt]').forEach((b) => {
          const r = b.nextElementSibling;
          const t = Number(b.dataset.latt);
          r.textContent = delta == null || !t ? '—' : hhmmZ(new Date(t + delta * 1000));
        });
        inp.classList.toggle('set', delta != null);
      };
      inp.addEventListener('input', () => { liveStore.set(flight, `latt-${kind}`, inp.value.trim()); calc(); });
      calc();
    }
    // 4) Crew rest
    const rest = body.querySelector('.mp-rest');
    if (rest) wireRest(root, screen, rest);
  }

  // Crew Rest: Rest Context and Settings (inputs), Three / Four Pilots Planning (timelines)
  function wireRest(root, screen, el) {
    const flight = screen.dataset.flight;
    const kind = el.dataset.rest;
    const st = { ato: '', after: '00:15', before: '00:45', wake: '00:10', order3: null, order4: null, pick4: 0, ...(liveStore.get(flight).rest || {}) };
    const save = () => liveStore.set(flight, 'rest', st);
    const pilots = JSON.parse(el.dataset.pilots || '[]');
    const off = Number(el.dataset.off), on = Number(el.dataset.on);
    const hm = (s) => hmS(s);
    const navAto = () => root.querySelector('.mp-nlrow input[data-k$=":ata"]')?.value || '';
    const times = () => {
      const ato = st.ato || navAto();
      let to = off;
      const s = parseHm(ato);
      if (s != null && off) { const d = new Date(off); d.setUTCHours(0, 0, 0, 0); to = d.getTime() + s * 1000; if (to - off > 12 * 3600e3) to -= 86400e3; else if (off - to > 12 * 3600e3) to += 86400e3; }
      const shift = root.dataset.mpRev ? Number(root.dataset.mpShift) || 0 : (to - off);
      const land = on + shift;
      const start = to + (parseHm(st.after) || 0) * 1000;
      const end = land - (parseHm(st.before) || 0) * 1000;
      return { to, land, start, end, total: Math.max(0, (end - start) / 1000), actual: s != null };
    };
    const z = (t) => hhmmZ(new Date(t));
    const colors = ['#b0508f', '#159a6e', '#6c8fd6', '#c58a2a'];
    const bar = (segs) => `<div class="mp-rbar">${segs.map((x) => `<div style="flex:${x.d};background:${colors[x.p % 4]}"><i>${esc(pilots[x.p]?.[1] || '?')}</i></div>`).join('')}</div>
      <div class="mp-rticks">${segs.slice(0, -1).map((x, i) => `<span style="left:${(segs.slice(0, i + 1).reduce((a, y) => a + y.d, 0) / segs.reduce((a, y) => a + y.d, 0)) * 100}%">${z(x.end)}</span>`).join('')}</div>`;
    const details = (segs) => `<div class="mp-rdet">${segs.map((x, i) => `<div style="background:${colors[x.p % 4]}"><b>${i + 1}${['st', 'nd', 'rd', 'th'][Math.min(i, 3)]} break</b>
      <span>Start</span><em>${z(x.start)}</em><span>End</span><em>${z(x.end)}</em><span>Wake up</span><em>${z(x.end - (parseHm(st.wake) || 0) * 1000)}</em><small>${esc(pilots[x.p]?.[1] || '')} ${esc(pilots[x.p]?.[0] || '')}</small></div>`).join('')}</div>`;
    const plan = (start, durs, ps) => { let t = start; return durs.map((d, i) => { const s = t; t += d * 1000; return { start: s, end: t, d, p: ps[i] }; }); };
    const editor = (n, key) => {
      const ord = st[key] || [...Array(n).keys()];
      return `<div class="mp-redit" hidden><b>Edit Pilot</b>${ord.map((p, i) => `<label>${n === 3 ? `${i + 1}${['st', 'nd', 'rd'][i]} rest` : i < 2 ? `1st Pair` : '2nd Pair / Central Block'}<select data-slot="${i}">${pilots.map((x, j) => `<option value="${j}"${j === p ? ' selected' : ''}>${esc(x[0])}</option>`).join('')}</select></label>`).join('')}
        <p class="mp-rwarn" hidden>Please select a unique pilot for each slot</p><button type="button" class="mp-btn" data-confirm>CONFIRM</button></div>`;
    };
    const render = () => {
      const T = times();
      if (kind === 'ctx') {
        el.innerHTML = `<div class="mp-rgrid">
          ${pnl('Flight Data', `<div class="mp-rkv"><span>Planned Take Off</span><b>${z(off)}</b><span>Actual Take Off</span><input class="mp-in w4" data-r="ato" value="${esc(st.ato || navAto())}" placeholder="hhmm"><span>Flight Time</span><b>${hm(Number(el.dataset.air))}</b><span>Planned Landing</span><b class="g">${z(T.land)}</b></div>`, 'mp-rbox')}
          ${pnl('Margins', `<div class="mp-rkv"><span>After Take Off</span><input class="mp-in w4" data-r="after" value="${esc(st.after)}"><span>Before Landing</span><input class="mp-in w4" data-r="before" value="${esc(st.before)}"></div>`, 'mp-rbox')}
          ${pnl('Rest Period', `<div class="mp-rkv"><span>Start</span><b class="g">${z(T.start)}</b><span>Total Break Duration</span><b class="g">${hm(T.total)}</b><span>End</span><b class="g">${z(T.end)}</b></div>`, 'mp-rbox')}
          ${pnl('Break Timer', `<div class="mp-rkv"><span>Wake Up</span><input class="mp-in w4" data-r="wake" value="${esc(st.wake)}"><span></span><small>(before the end of each break)</small></div>`, 'mp-rbox')}
        </div>`;
        el.querySelectorAll('[data-r]').forEach((i) => i.addEventListener('change', () => { st[i.dataset.r] = i.value.trim(); save(); render(); }));
        return;
      }
      const n = kind === 'three' ? 3 : 4;
      if (pilots.length < n) { el.innerHTML = `<p class="mp-dvempty">This plan lists ${pilots.length} pilots. Set the number of pilots to ${n} in Settings to plan ${n}-pilot rest.</p>`; return; }
      const key = n === 3 ? 'order3' : 'order4';
      const ord = st[key] || [...Array(n).keys()];
      const head = `<div class="mp-rhead"><b>${n === 3 ? 'Three' : 'Four'} Pilots</b><span class="mp-grow"></span><button type="button" class="mp-btn" data-edit>EDIT PILOT</button></div>${editor(n, key)}
        <div class="mp-rse"><span>Start <b class="g">${z(T.start)}</b></span><span><b class="g">${z(T.end)}</b> End</span></div>`;
      if (n === 3) {
        const d = T.total / 3;
        const segs = plan(T.start, [d, d, d], ord);
        el.innerHTML = `${head}<div class="mp-rdur">${segs.map((x, i) => `<div><small>${i + 1}${['st', 'nd', 'rd'][i]} Break Duration</small><b class="g">${hm(x.d)}</b></div>`).join('')}</div>${bar(segs)}${details(segs)}`;
      } else {
        const t = T.total;
        const options = [
          ['Central Block', plan(T.start, [t / 4, t / 2, t / 4], [0, 2, 0].map((i) => ord[i]))],
          ['Short Break / Long Break', plan(T.start, [t / 6, t / 3, t / 3, t / 6], [ord[0], ord[2], ord[0], ord[2]])],
          ['Short Break / Long Break', plan(T.start, [t / 3, t / 6, t / 6, t / 3], [ord[0], ord[2], ord[0], ord[2]])],
        ];
        el.innerHTML = `${head}${options.map(([lab, segs], i) => `<div class="mp-ropt"><label><input type="radio" name="mp-r4" value="${i}"${st.pick4 === i ? ' checked' : ''}> ${lab}</label>${bar(segs)}<details${st.pick4 === i ? ' open' : ''}><summary>Details</summary>${details(segs)}</details></div>`).join('')}
          <p class="mp-lnote">Each break is shared by a pair: pilots ${esc(pilots[ord[0]][1])}+${esc(pilots[ord[1]][1])} and ${esc(pilots[ord[2]][1])}+${esc(pilots[ord[3]][1])}.</p>`;
        el.querySelectorAll('input[name="mp-r4"]').forEach((r) => r.addEventListener('change', () => { st.pick4 = Number(r.value); save(); }));
      }
      const ed = el.querySelector('.mp-redit');
      el.querySelector('[data-edit]').addEventListener('click', () => { ed.hidden = !ed.hidden; });
      ed.querySelector('[data-confirm]').addEventListener('click', () => {
        const v = [...ed.querySelectorAll('select')].map((s) => Number(s.value));
        if (new Set(v).size !== v.length) { ed.querySelector('.mp-rwarn').hidden = false; return; }
        st[key] = v; save(); render();
      });
    };
    render();
  }

  // Flt Prep > FMS Initialization (per Cole's DAL0183 A333 screenshot). The top mirrors the aircraft's
  // FMS: Airbus types get the MCDU INIT A / INIT FUEL PREDICTION pages; other types show the lower panels.
  function fmsInitPage(m) {
    const { o } = m;
    const ofp = o.raw, g = o.general, f = o.fuel, w = o.wts, t = o.times;
    const O = o.origin || {}, D = o.dest || {}, A = o.alts[0];
    const { pf, sp, toc, tocWind, route, stepHtml } = fiBits(m);
    const k = (v) => (str(v) === '' ? '' : (o.W(v) / 1000).toFixed(1));
    const hmm = (sec) => { const mn = Math.round(sec / 60); return `${Z(Math.floor(mn / 60), 2)}:${Z(mn % 60, 2)}`; };
    const box = (v, cls = '', html = false) => `<span class="mp-fb ${cls}">${v == null ? '' : html ? v : esc(String(v))}</span>`;
    const tmp = (c) => (str(c) === '' ? '' : `${num(c) < 0 ? 'M' : 'P'}${Z(Math.abs(Math.round(num(c))), 2)}`);
    const fl0 = num(g.initial_altitude);
    const trop = num(toc?.tropopause_feet) || num(g.avg_tropopause);
    const avgW = str(g.avg_wind_dir) !== '' ? `${Z(Math.round(num(g.avg_wind_dir)), 3)}/${Z(Math.round(num(g.avg_wind_spd)), 3)}` : tocWind;
    const altRaw = asArray(ofp.alternate)[0] || {};
    const airbus = /^A3\d\d|^A2\d\d|^BCS/.test(o.icaoType);
    const mcdu = airbus ? `
      <div class="mp-fms">
        <div class="mp-fmsc"><div class="mp-fmst">INIT</div><div class="mp-fmsp">
          <div class="r2"><span>CO RTE</span><span class="rt">FROM / TO</span></div>
          <div class="r2"><span>${box('', 'w6')}</span><span class="rt">${box(O.icao, 'w3 ra')} / ${box(D.icao, 'w3')}</span></div>
          <div class="r2"><span>ALTN&nbsp;&nbsp;&nbsp;/ CO RTE</span></div>
          <div class="r2"><span>${box(A?.icao || '', 'w3')} / ${box('', 'w5')}</span></div>
          <div class="r2"><span>FLT NBR</span></div>
          <div class="r2"><span>${box(o.callsign, 'w6')}</span><span class="rt lk">IRS INIT&gt;</span></div>
          <div class="r2"><span>PAX NBR</span></div>
          <div class="r2"><span>${box(Math.round(num(w.pax_count)) || '', 'w3')}</span><span class="rt lk">WIND&gt;</span></div>
          <div class="r2"><span>COST INDEX</span><span class="rt">TROPO</span></div>
          <div class="r2"><span>${box(str(g.costindex), 'w3')}</span><span class="rt">${trop ? box(String(Math.round(trop / 100) * 100), 'w3 ra') : box('', 'w3')}</span></div>
          <div class="r2"><span>CRZ FL&nbsp;&nbsp;&nbsp;/ TEMP</span><span class="rt">GND TEMP</span></div>
          <div class="r2"><span>${box(fl0 ? `FL${Z(Math.round(fl0 / 100), 3)}` : '', 'w3')} / ${box(tmp(toc?.oat), 'w3 ra')}</span><span></span></div>
        </div></div>
        <div class="mp-fmsc"><div class="mp-fmst">INIT FUEL PREDICTION</div><div class="mp-fmsp">
          <div class="r3"><span>TAXI</span><span class="c">ZFW&nbsp;&nbsp;&nbsp;&nbsp;/</span><span class="rt">ZFW CG</span></div>
          <div class="r3"><span>${box(k(f.taxi), 'w3 ra')}</span><span class="c">${box(k(w.est_zfw), 'w3 ra')} /</span><span></span></div>
          <div class="r3"><span>TRIP&nbsp;&nbsp;&nbsp;&nbsp;/ TIME</span><span></span><span class="rt">BLOCK</span></div>
          <div class="r3 v"><span>${esc(k(f.enroute_burn))} / ${esc(hmm(secs(t.est_time_enroute)))}</span><span></span><span class="rt">${box(k(f.plan_ramp), 'w3 ra')}</span></div>
          <div class="r3"><span>RTE RSV / %</span></div>
          <div class="r3"><span>${box('', 'w3')} /</span></div>
          <div class="r3"><span>ALTN&nbsp;&nbsp;&nbsp;&nbsp;/ TIME</span><span class="c">TOW&nbsp;&nbsp;&nbsp;&nbsp;/</span><span class="rt">LW</span></div>
          <div class="r3 v"><span>${esc(k(f.alternate_burn))} / ${esc(secs(altRaw.ete) ? hmm(secs(altRaw.ete)) : '')}</span><span class="c">${esc(k(w.est_tow))} /</span><span class="rt">${esc(k(w.est_ldw))}</span></div>
          <div class="r3"><span>FINAL&nbsp;&nbsp;&nbsp;/ TIME</span><span></span><span class="rt">TRIP WIND</span></div>
          <div class="r3"><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/ ${box(secs(t.reserve_time) ? hmm(secs(t.reserve_time)) : '', 'w3')}</span><span></span><span class="rt">${box(avgW === '-' ? '' : avgW, 'w3 ra')}</span></div>
          <div class="r3 sp"><span>MIN DEST FOB</span><span class="c">EXTRA&nbsp;&nbsp;/</span><span class="rt">TIME</span></div>
          <div class="r3 v"><span>&nbsp;&nbsp;${esc((m.fuel.minLdg / 1000).toFixed(1))}</span><span class="c">${esc((m.fuel.delay / 1000).toFixed(1))} /</span><span></span></div>
        </div></div>
        <div class="mp-fmsfoot">${esc(o.icaoType)} FMGC</div>
      </div>` : (() => {
        // Boeing-style CDU (Cole's DAL B739 screenshots): RTE + PERF INIT. Used for every non-Airbus type.
        const oat = toc && str(toc.oat) !== '' ? num(toc.oat) : null;
        const oatF = oat == null ? '' : tmp(oat * 9 / 5 + 32);
        const zfw = num(k(w.est_zfw)), ramp = num(k(f.plan_ramp));
        const fam = /^B7(\d)/.exec(o.icaoType);
        return `
      <div class="mp-fms">
        <div class="mp-fmsc"><div class="mp-fmst">RTE</div><div class="mp-fmsp mp-cdu">
          <div class="r2"><span>ORIGIN</span><span class="rt">DEST</span></div>
          <div class="r2"><span>${box(O.icao, 'w5 ct')}</span><span class="rt">${box(D.icao, 'w5 ct')}</span></div>
          <div class="r2"><span>CO ROUTE</span><span class="rt">FLT NO.</span></div>
          <div class="r2"><span>${box('', 'w5')}</span><span class="rt">${box(o.callsign, 'w5 ct')}</span></div>
          <div class="r2"><span>RUNWAY</span><span class="rt">FLT PLAN</span></div>
          <div class="r2"><span>${box('', 'w5')}</span><span class="rt lk">REQUEST&gt;&nbsp;&nbsp;</span></div>
          <div class="mp-cdudash"></div>
          <div class="r2"><span class="lk">&lt;ALTN DEST</span></div>
          <div class="r2 sp"><span class="lk">&lt;RTE 2</span><span class="rt lk">ACTIVATE&gt;</span></div>
        </div></div>
        <div class="mp-fmsc"><div class="mp-fmst">PERF INIT</div><div class="mp-fmsp mp-cdu">
          <div class="r2"><span>GW&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/ CRZ CG</span><span class="rt">TRIP&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;CRZ ALT</span></div>
          <div class="r2"><span class="v">&nbsp;&nbsp;${zfw && ramp ? esc((zfw + ramp).toFixed(1)) : ''}&nbsp;&nbsp;&nbsp;/</span><span class="rt">${box(fl0 ? `FL${Z(Math.round(fl0 / 100), 3)}` : '', 'w3 ct')}</span></div>
          <div class="r2"><span>PLAN&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;FUEL</span><span class="rt">CRZ WIND</span></div>
          <div class="r2"><span>${box(k(f.plan_ramp), 'w3 ct')} /</span><span class="rt">${box(avgW === '-' ? '' : avgW, 'w5 ct')}</span></div>
          <div class="r2"><span>ZFW</span><span class="rt">T/C OAT</span></div>
          <div class="r2"><span>${box(k(w.est_zfw), 'w3 ct')}</span><span class="rt">${box(oatF ? `${oatF}<small>°F</small>` : '', 'w3 ct', true)} ${box(oat == null ? '' : `${tmp(oat)}<small>°C</small>`, 'w3 ct', true)}</span></div>
          <div class="r2"><span>RESERVES</span><span class="rt">TRANS ALT</span></div>
          <div class="r2"><span>${box((m.fuel.minLdg / 1000).toFixed(1), 'w3 ct')}</span><span></span></div>
          <div class="r2"><span>COST INDEX</span><span class="rt">PERF INIT</span></div>
          <div class="r2"><span>${box(str(g.costindex), 'w3 ct')}</span><span class="rt lk">REQUEST&gt;</span></div>
        </div></div>
        <div class="mp-fmsfoot">${esc(fam ? `B7${fam[1]}7` : o.icaoType)}</div>
      </div>`;
      })();
    const skip = new Set(['TOC', 'TOD']);
    const fixes = [O.icao, ...o.navlog.filter((x) => {
      const id = up(x.ident), ty = String(x.type || '').toLowerCase();
      return id && !skip.has(id) && !/^(ETP|EEP|EXP|ETOPS|DER\d|RW\d)/.test(id) && !['toc', 'tod', 'etp', 'apt'].includes(ty);
    }).map((x) => up(x.ident)), D.icao].filter(Boolean)
      .filter((x, i, a) => i === 0 || x !== a[i - 1]);
    const dev = str(g.avg_temp_dev) === '' ? '-' : tmp(g.avg_temp_dev);
    return `${mcdu}
      <div class="mp-fmsb"><b>Flight Plan:</b><div>${route}</div></div>
      ${stepHtml ? `<div class="mp-fmsb"><b>FL Steps:</b><div>${stepHtml.replace(/  /g, ' ')}</div></div>` : ''}
      <div class="mp-fmsb"><b>FMS Crosscheck Fix List:</b><div>${esc(fixes.join(' '))}</div></div>
      <hr class="mp-fmshr">
      <div class="mp-fmsb mp-fms2">
        <div><b>Origin:</b><div class="kv"><span>Elevation:</span><span>${Math.round(O.elev || 0)} ft</span></div></div>
        <div><b>Destination:</b><div class="kv"><span>Elevation:</span><span>${Math.round(D.elev || 0)} ft</span></div></div>
      </div>
      <hr class="mp-fmshr">
      <div class="mp-fmsb mp-fms2">
        <div class="kv3"><b>Performance Factor:</b><span>${esc(pf)}</span><b>Ground Distance:</b><span>${num(g.route_distance) ? Math.round(num(g.route_distance)) : '-'}</span><b>ISA Deviation:</b><span>${esc(dev)}</span></div>
        <div><b>Speeds:</b><div class="kv3 in"><span>Climb:</span><span>${esc(sp.climb)}</span><span>Cruise:</span><span>${esc(sp.fmsCruise)}</span><span>Descent:</span><span>${esc(sp.fmsDescent)}</span></div></div>
      </div>
      <hr class="mp-fmshr">`;
  }

  // Flt Prep > Flight Additional Information: operation type + target landing window
  function flightAddlPage(m) {
    const from = m.eOn ? new Date(m.eOn.getTime() - 4 * 60000) : null;
    const loc = (d) => (d && m.tzD != null ? lt(d, m.tzD).replace('(L)', 'L') : '');
    const t = (d) => `<b>${esc(zt(d))}</b><b>${esc(loc(d))}</b>`;
    return `
      <div class="mp-fa">
        <div class="mp-fah">Flight Operation Type</div>
        <div class="mp-farow"><span>Operation Type:</span><span>${m.intl ? 'FLAG' : 'DOMESTIC'}</span></div>
      </div>
      <div class="mp-fa">
        <div class="mp-fah l">Target Landing Window</div>
        <div class="mp-fatlw">
          <span>From</span><div>${t(from)}</div><span>Until</span><div>${t(m.eOn)}</div>
          <span>Landing*</span><div class="mp-faldg" data-on="${m.eOn ? m.eOn.getTime() : ''}" data-off="${m.eOff ? m.eOff.getTime() : ''}" data-tz="${m.tzD ?? ''}">${t(m.eOn)}</div>
        </div>
        <div class="mp-fanote">*: Landing time estimated from T/Off time.</div>
      </div>`;
  }

  // "Landing*" on Flight Additional Information follows the departure (T/Off) time on the Nav Log
  function liveLanding(root, body) {
    const el = body.querySelector('.mp-faldg');
    if (!el || !el.dataset.on || !el.dataset.off) return;
    const v = root.querySelector('.mp-nlrow input[data-k$=":ata"]')?.value || '';
    const mt = /^([01]\d|2[0-3]):?([0-5]\d)$/.exec(v.trim());
    if (!mt) return;
    const off = Number(el.dataset.off);
    const d = new Date(off); d.setUTCHours(+mt[1], +mt[2], 0, 0);
    if (d - off > 12 * 3600e3) d.setTime(d - 86400e3); else if (d - off < -12 * 3600e3) d.setTime(+d + 86400e3);
    const ldg = new Date(Number(el.dataset.on) + (d - off));
    const hm = (x) => `${Z(x.getUTCHours(), 2)}:${Z(x.getUTCMinutes(), 2)}`;
    const b = el.querySelectorAll('b');
    b.forEach((x) => x.classList.add('g'));
    b[0].textContent = `${hm(ldg)}Z`;
    if (el.dataset.tz !== '' && b[1]) b[1].textContent = `${hm(new Date(ldg.getTime() + Number(el.dataset.tz) * 3600e3))}L`;
  }

  // ETOPS page: Diversion Information, ETOPS Positions Detail (per ETP), and the OFP's ETP text
  function etopsPage(m) {
    const { o } = m;
    const e = m.etops;
    const W = o.W;
    // truncated to the minute, like the OFP (3:16:46 -> 03:16)
    const hhmm2 = (sec) => { const mn = Math.floor(sec / 60); return `${Z(Math.floor(mn / 60), 2)}:${Z(mn % 60, 2)}`; };
    const dm = (v, pos, neg, w) => { const n = num(v), a = Math.abs(n), d = Math.floor(a); return `${n < 0 ? neg : pos}${Z(d, w)}°${((a - d) * 60).toFixed(1).padStart(4, '0')}'`; };
    const apts = {};
    [...asArray(e.suitable_airport), ...o.alts.map((a) => a.raw), o.origin?.raw, o.dest?.raw].filter(Boolean)
      .forEach((a) => { if (a.icao_code) apts[up(a.icao_code)] = a; });
    const iata = (icao) => up(apts[up(icao)]?.iata_code) || up(icao).slice(1);
    const etps = asArray(e.equal_time_point).map((p, i) => {
      const da = asArray(p.div_airport);
      const eet = secs(p.elapsed_time);
      const eta = m.eOff ? new Date(m.eOff.getTime() + eet * 1000) : null;
      const dt = secs(p.div_time);
      const deta = eta && dt ? new Date(eta.getTime() + dt * 1000) : null;
      const gs = (a) => (dt && num(a?.distance) ? Math.round(num(a.distance) / (dt / 3600)) : '-');
      const fl = num(p.div_altitude) ? Math.round(num(p.div_altitude) / 100) : '-';
      const cnd = up(p.etops_condition) || '-';
      const name = `ETP${i + 1} ${da.map((a) => iata(a.icao_code)).join('-')}`;
      return `
        <div class="mp-etp">
          <div class="mp-etprow">
            <div class="w"><small>ETP</small><b>${esc(name)}</b></div>
            <div><small>Latitude</small><b>${esc(dm(p.pos_lat, 'N', 'S', 2))}</b></div>
            <div><small>Longitude</small><b>${esc(dm(p.pos_long, 'E', 'W', 3))}</b></div>
            <div><small>EET</small><b>${esc(hhmm2(eet))}</b></div>
            <div><small>ETA</small>${dynZ(eta)}</div>
            <div><small>EFOB (lb)</small><b>${W(p.est_fob)}</b></div>
            <div></div><div></div>
          </div>
          <div class="mp-etprow">
            <div class="w"><small>Airport</small>${da.map((a, k) => `<b>${k ? '&rarr;' : '&larr;'}${esc(up(a.icao_code))}</b>`).join('')}</div>
            <div><small>Condition</small>${da.map(() => `<b>${esc(cnd)}</b>`).join('')}</div>
            <div><small>FL</small>${da.map(() => `<b>${fl}</b>`).join('')}</div>
            <div><small>GSR/GSA</small>${da.map((a) => `<b>${gs(a)}</b>`).join('')}</div>
            <div><small>Time</small><b>${dt ? esc(hhmm2(dt)) : '-'}</b></div>
            <div><small>ETA</small>${dynZ(deta)}</div>
            <div></div>
            <div class="r"><small>Fuel Required (lb)</small><b>${W(p.critical_fuel)}</b></div>
          </div>
        </div>`;
    }).join('');
    const html = str(o.raw?.text?.plan_html);
    let etpText = '';
    if (html) {
      const txt = html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
      const mt = txt.match(/\*\*\s*ETP\/ETOPS?\s+INFORMATION\s*\*\*[\s\S]*?(?=\n\s*\*\*\s*[A-Z][A-Z /]+\*\*|\n-{10,}|$)/);
      if (mt) etpText = mt[0].split('\n').map((l) => l.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    }
    return `
      <div class="mp-as mp-etops">
        <div class="mp-ash">Diversion Information (incl. ETOPS)</div>
        <div class="mp-rule"><span>Rule Time</span><b>${num(e.rule) ? `${Math.round(num(e.rule))} mins` : '-'}</b></div>
      </div>
      <div class="mp-as mp-etops">
        <div class="mp-ash">ETOPS Positions Detail</div>
        ${etps || '<div class="mp-asnone">NO EQUAL TIME POINTS</div>'}
      </div>
      ${etpText ? `<div class="mp-as mp-etptext"><div class="mp-etplbl">ETP:</div><pre>${esc(etpText)}</pre></div>` : ''}`;
  }
  function docTemplates(m) {
    return Object.entries(docPages(m)).map(([id, d]) => `<template data-mp-doctpl="${id}" data-title="${esc(d.title)}"${d.kind ? ` data-kind="${d.kind}"` : ''}>${d.html}</template>`).join('');
  }

  function drawers(m) {
    const menus = drawerMenus(m);
    return Object.entries(menus).map(([key, secs]) => `
    <aside class="mp-drawer" data-mp-drawer="${key}" aria-hidden="true">${secs.map(([title, items]) => `
      ${title ? `<h5 class="mp-drh">${esc(title)}</h5>` : '<div class="mp-drgap"></div>'}
      ${items.map(([id, label, kind, unread, sub]) => (kind === 'note' ? `<p class="mp-drnote">${esc(label)}</p>` : kind === 'act' ? `
      <button type="button" class="mp-dri mp-dract" data-mp-action="${id.slice(1)}">${ico(id === '!pfr' ? 'post' : 'dxml', 'mp-dric')}<span>${esc(label)}</span></button>` : `
      <button type="button" class="mp-dri${unread ? ' unread' : ''}" data-mp-doc="${key}:${id}" data-default-unread="${unread ? 1 : 0}">
        ${ico(kind === 'img' ? 'dimg' : kind === 'txt' ? 'dtxt' : 'dxml', 'mp-dric')}<span>${esc(label)}${sub ? `<br>${esc(sub)}` : ''}</span>
      </button>`)).join('')}`).join('')}
    </aside>`).join('');
  }

  // Status bar, header and tab bar shared by every page
  function chrome(m, page, body) {
    const { o, alt } = m;
    const O = o.origin || {}, D = o.dest || {};
    return `
<div class="mp-device"><div class="mp-screen" data-flight="${esc(o.requestId || `${o.callsign}-${O.icao}-${D.icao}`)}">
  <div class="mp-status">
    <div class="mp-st-l"><b>${esc(o.callsign)} ${esc(m.dateTag)}</b> <span class="${m.current ? 'mp-cur' : 'mp-nc'}">${m.current ? 'Current' : 'Not current'}</span> ${esc(o.reg)} ${esc(o.icaoType)}</div>
    <div class="mp-st-r">${esc(zt(m.now))} ${esc(`${m.now.getUTCDate()} ${MON[m.now.getUTCMonth()]} ${m.now.getUTCFullYear()}`)} ${ico('db')} 100 % ${ico('batt')}</div>
  </div>

  <div class="mp-head">
    <span class="mp-hbtn">${ico('menu')}</span>
    <div class="mp-hp"><div>${esc(O.icao)}</div><small>ETD ${esc(zt(m.eOut))}</small></div>
    <span class="mp-hbtn mp-sq">${ico('route')}</span>
    <div class="mp-hp mp-sq r mp-hdest" role="button" tabindex="0" data-in="${m.eIn ? m.eIn.getTime() : ''}" data-sta="${m.sIn ? m.sIn.getTime() : ''}" data-tz="${m.tzD ?? ''}"><div>${esc(D.icao)}</div><small class="mp-hreta">ETA ${esc(zt(m.eIn))}</small>
      <div class="mp-etapop" hidden><small class="mp-ep-l">ETA</small><b class="mp-ep-eta"></b><small>STA</small><b class="mp-ep-sta"></b><em class="mp-dv"></em></div></div>
    <span class="mp-grow"></span>
    <span class="mp-hbtn mp-badge-wrap">${ico('bell')}<i class="mp-badge">99+</i></span>
    <span class="mp-hbtn">${ico('mark')}</span>
    <span class="mp-hbtn">${ico('more')}</span>
  </div>

  <nav class="mp-tabs">${TABS.map(([k, l, pg, dr]) => {
    const attrs = pg ? ` data-mp-page="${pg}" role="button" tabindex="0"` : dr ? ` data-mp-tab="${dr}" role="button" tabindex="0" aria-expanded="false"` : '';
    return `<div class="mp-tab${pg === page ? ' on' : ''}${pg || dr ? ' live' : ''}"${attrs}>${ico(k)}${dr ? `<i class="mp-badge" data-mp-badge="${dr}" hidden></i>` : ''}<span>${esc(l)}</span></div>`;
  }).join('')}</nav>
  <div class="mp-stage">
${body}
    <div class="mp-scrim" hidden></div>
    ${drawers(m)}
    <div class="mp-docview" hidden>
      <h2 class="mp-dvt"></h2>
      <div class="mp-dvwrap">
        <div class="mp-dvb"></div>
        <div class="mp-dvtools"><span class="mp-tool mp-t-notam mp-t-filter">${ico('filter')}</span><span class="mp-tool">${ico('expand')}</span><span class="mp-tool mp-t-doc">${ico('mapdoc')}</span><span class="mp-tool mp-t-notam mp-t-all" role="button" tabindex="0">${ico('eyeo')}<small>ALL</small></span></div>
      </div>
      <div class="mp-dvnav"><span class="mp-tool" data-mp-dvscroll="-1">${ico('up')}</span><span class="mp-tool" data-mp-dvscroll="1">${ico('down')}</span></div>
    </div>
    ${docTemplates(m)}
  </div>
</div></div>`;
  }

  function dashboard(m) {
    const { o, alt, fuel } = m;
    const O = o.origin || {}, D = o.dest || {};
    const tlwFrom = m.eOn ? new Date(m.eOn.getTime() - 4 * 60000) : null;
    const cell = (label, val, cls = '') => `<div class="mp-f"><div class="mp-fl">${esc(label)}</div><div class="mp-fv ${cls}">${esc(val)}</div></div>`;
    const docTile = (n) => `<div class="mp-tile">${ico('doc', 'mp-ti')}<b>${n}</b><span class="mp-pill">${ico('eye')}${n}</span></div>`;
    const wxTile = (ports) => {
      const withWx = ports.filter((p) => p && (p.metar || p.taf));
      if (!withWx.length) return `<div class="mp-tile">${ico('sun', 'mp-ti')}<span class="mp-pill off">METAR</span></div>`;
      return `<details class="mp-tile mp-wx"><summary>${ico('sun', 'mp-ti')}<span class="mp-pill">METAR</span></summary>${
        withWx.map((p) => `<pre>${esc([p.metar, p.taf].filter(Boolean).join('\n'))}</pre>`).join('')}</details>`;
    };
    const person = (p) => `<div class="mp-person">${ico('crew', 'mp-pi')}<div><div class="mp-pn">${esc(p.name)}</div><div class="mp-pr">${esc(p.role)} (${esc(p.emp)})</div></div></div>`;

    return chrome(m, 'dashboard', `
  <div class="mp-flight">
    <span class="mp-swap">${ico('swap')}</span>
    <div class="mp-fid">${esc(m.flightId)}</div>
    <span class="mp-grow"></span>
    <div class="mp-meta"><div>Ops Type</div><small>${m.intl ? 'Flag' : 'Domestic'}</small></div>
    <div class="mp-meta"><div>Status</div><small class="mp-ok">Up to date</small></div>
    <div class="mp-meta"><div>FDRA</div><small>-</small></div>
  </div>

  <div class="mp-route">
    <div class="mp-line">
      <div class="mp-pt o"><b>${esc(O.icao)}/${esc(O.iata || O.code)}</b><small>${esc(O.name)}</small></div>
      <div class="mp-pt d"><b>${esc(D.icao)}/${esc(D.iata || D.code)}</b><small>${esc(D.name)}</small></div>
      ${alt ? `<div class="mp-pt a"><b>${esc(alt.icao)}</b><small>Primary ALTN</small></div>` : ''}
      <div class="mp-track"><i class="mp-dot o"></i><i class="mp-dot d"></i>${alt ? '<i class="mp-dot a"></i>' : ''}</div>
      <div class="mp-pt o mp-t"><b>STD</b><span>${esc(zt(m.sOut))}/${esc(lt(m.sOut, m.tzO))}</span></div>
      <div class="mp-pt d mp-t"><b>STA</b><span>${esc(zt(m.sIn))}/${esc(lt(m.sIn, m.tzD))}</span><small>GATE TBA</small></div>
    </div>
    <div class="mp-times">
      <div>Schd Block Time <b>${esc(hm(m.block))}</b></div>
      <div>Flight Time <b>${esc(hm(m.air))}</b></div>
      <div>Time To Alternate <b>${alt && m.altEte ? `+${esc(hm(m.altEte))}` : '--'}</b></div>
      <div>TLW <b>${esc(zt(tlwFrom))} -${esc(zt(m.eOn))}</b></div>
      <div>LDG <b>${esc(zt(m.eOn))}</b></div>
    </div>
    <div class="mp-alts${m.etops ? ' mp-alts-etops' : ''}">${m.etops ? '<div data-mp-doc="inflight:etops" role="button" tabindex="0">ETOPS</div>' : ''}<div data-mp-doc="inflight:altsum" role="button" tabindex="0">ALL ALTERNATES (${o.alts.length})</div></div>
  </div>

  <div class="mp-fuel">
    ${cell('T/O Gross Wt', lb(fuel.tow))}${cell('Block Fuel', lb(fuel.block), 'g')}${cell('Fuel at TOC', fuel.toc ? lb(fuel.toc) : '--')}${cell('Min Ldg Fuel at Dest', lb(fuel.minLdg))}
    ${cell('Landing Wt', lb(fuel.ldw))}${cell('Min Fuel for T/O', lb(fuel.minTo), 'g')}${cell('Plan Landing Fuel', lb(fuel.planLdg), 'g')}${cell('Avail Delay Fuel', lb(fuel.delay))}
  </div>

  <div class="mp-grid">
    <h4>Origin</h4><h4>Enroute &amp; Alternate</h4><h4>Destination</h4>
    ${docTile(m.notams.o)}${docTile(m.notams.e)}${docTile(m.notams.d)}
    ${wxTile([O])}${wxTile(o.alts)}${wxTile([D])}
    <div class="mp-card">
      <div class="mp-ct">Release ${esc(o.release)}.0</div>
      <small>${esc(m.o.generated ? `${dMon(o.generated)} ${zt(o.generated)}` : '')}</small>
      <div class="mp-cv">${esc(up(o.crew.dx) || 'DISPATCH')}</div>
      <div class="mp-cv">${esc(o.requestId || '')}${o.requestId ? `*${esc(o.fleet)}/${esc(o.release)}` : ''}</div>
    </div>
    <div class="mp-card">
      <div class="mp-ct">Crew</div>
      <div class="mp-cc">Flight Deck <span class="mp-pill">${m.crewDeck.length}</span> | Cabin <span class="mp-pill">${m.crewCabin.length}</span></div>
      <div class="mp-crew">${[...m.crewDeck, ...m.crewCabin].map(person).join('') || '<small>No crew listed</small>'}</div>
    </div>
    <div class="mp-ac">
      <div class="mp-card">
        <div class="mp-ct">Aircraft Status</div>
        <div class="mp-reg">${esc(o.reg)} / ${esc(o.fleet)}</div>
        <div class="mp-cv">${esc(o.icaoType)}</div>
      </div>
      <div class="mp-btns"><span>FMS INIT</span><span>FDRA</span></div>
    </div>
  </div>`);
  }

  // ---------- Nav Log ----------
  const isProc = (f) => str(f.is_sid_star) === '1' || /^[A-Z]{3,}\d[A-Z]?$/.test(up(f.via_airway)) || up(f.via_airway) === 'APPCH';
  const fixName = (id) => (id === 'TOC' ? '*T-O-C*' : id === 'TOD' ? '*T-O-D*' : id);
  const showFl = (f) => up(f.stage) === 'CRZ' || ['TOC', 'TOD'].includes(up(f.ident));
  const mach = (f) => { const v = num(f.mach); return showFl(f) && v ? `M.${Z(Math.round((v < 1 ? v * 1000 : v)), 3)}` : '-'; };

  // Remarks per nav log fix from SimBrief's OFP text (e.g. DAL layout "** EIN POSN RPT **",
  // "** CLIMB TO FL370 **", FIR / ETOPS lines). Blocks are matched to fixes in route order.
  function ofpRemarks(ofp, ids) {
    const html = str(ofp?.text?.plan_html);
    const out = ids.map(() => []);
    if (!html) return out;
    const txt = html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
    const blocks = txt.split(/\n\s*-{20,}\s*(?=\n)/).map((b) => {
      const lines = b.split('\n');
      const idLine = lines.find((l) => /^\S/.test(l) && /\s[EW]\s?\d{5}\.\d/.test(l));
      if (!idLine) return null;
      let id = idLine.slice(0, 16).trim().toUpperCase();
      if (/T-O-C/.test(id)) id = 'TOC'; else if (/T-O-D/.test(id)) id = 'TOD';
      const rm = lines.map((l) => /^\s*\*\*\s*(.+?)\s*\*\*\s*$/.exec(l)).filter((x) => x && /[A-Z0-9]/i.test(x[1]) && !/^[*\s]+$/.test(x[1])).map((x) => `** ${x[1].replace(/\s+/g, ' ')} **`);
      const posTable = lines.some((l) => /^\s*POSITION\s+ATA\s+FL/.test(l));
      if (posTable && !rm.some((x) => /POSN RPT/.test(x))) rm.unshift('** POSN RPT **');
      return { id: id.split(/\s+/)[0], rm };
    }).filter(Boolean);
    let p = 0;
    ids.forEach((id, i) => {
      for (let k = p; k < Math.min(blocks.length, p + 6); k++) {
        if (blocks[k].id === id) { out[i] = blocks[k].rm; p = k + 1; break; }
      }
    });
    return out;
  }

  const dms = (v, pos, neg, w) => {
    const n = num(v); const a = Math.abs(n); const d = Math.floor(a);
    return `${n < 0 ? neg : pos}${Z(d, w)}°${((a - d) * 60).toFixed(1).padStart(4, '0')}'`;
  };

  // Expanded fix panel (opens when the fix is tapped)
  function details(r, i, m) {
    const f = r.f || {};
    const o = m.o;
    const dash = (v) => (str(v) ? esc(str(v)) : '-');
    const trmg = Math.max(0, secs(o.times.est_time_enroute) - r.tcum);
    const wind = str(f.wind_dir) ? `${Z(num(f.wind_dir), 3)}/${Z(num(f.wind_spd), 3)}` : '';
    const trop = num(f.tropopause_feet) ? `FL${Z(Math.round(num(f.tropopause_feet) / 100), 3)}` : '';
    const trk = str(f.track_true) ? `${Z(num(f.track_true), 3)}/${Z(num(f.track_mag), 3)}` : '';
    const name = up(f.name) && up(f.name) !== r.id ? up(f.name) : '';
    const cell = (k, v) => `<div class="mp-xc"><small>${k}</small><span>${v}</span></div>`;
    const blank = '<div class="mp-xc"></div>';
    return `
        <div class="mp-fixx"><div class="mp-fixxi">
          <div class="mp-xrow">${blank}${blank}${blank}${cell('TRMG', `<b class="mono">${esc(hm(trmg))}</b>`)}${blank}${blank}${blank}${cell('MSA', '-')}</div>
          <div class="mp-xrow">${cell('IAS<sup>kt</sup>', dash(r.origin ? '' : num(f.ind_airspeed) || ''))}${cell('GS<sup>kt</sup>', dash(r.origin ? '' : num(f.groundspeed) || ''))}${cell('Wind', dash(wind))}${cell('TROP', dash(trop))}
            ${cell('Latitude', r.lat ? esc(dms(r.lat, 'N', 'S', 2)) : '-')}${cell('Longitude', r.lon ? esc(dms(r.lon, 'E', 'W', 3)) : '-')}${cell('TRK-T/M', dash(trk))}${cell('Airspace', dash(r.fir))}</div>
          <div class="mp-xrow">${cell('Name', dash(name))}${cell('Frequency', dash(f.frequency))}${blank}${blank}${blank}${blank}${blank}${blank}</div>
          <div class="mp-xrmk"><small>Remarks</small>${r.remarks.map((x) => `<div>${esc(x)}</div>`).join('')}</div>
          <div class="mp-xnote"><small>Clearance or Notes</small>
            <input class="mp-note" data-k="nl:${i}:note" placeholder="Type here" autocomplete="off" spellcheck="false"></div>
        </div></div>`;
  }

  function navRows(m, ofp) {
    const { o } = m;
    const W = o.W;
    const off = m.eOff;
    const rows = [{ id: up(o.origin?.icao), tcum: 0, fob: W(o.fuel.plan_takeoff), fl: '-', origin: true, fir: '', lat: num(o.origin?.raw?.pos_lat), lon: num(o.origin?.raw?.pos_long), f: { name: o.origin?.name } }];
    o.navlog.forEach((f) => {
      const id = up(f.ident);
      rows.push({
        id, tcum: secs(f.time_total), fob: W(f.fuel_plan_onboard), fl: showFl(f) ? `FL${Z(C.flOf(f.altitude_feet), 3)}` : '-',
        toc: id === 'TOC', tod: id === 'TOD', fir: up(f.fir), lat: num(f.pos_lat), lon: num(f.pos_long), f,
        leg: { via: isProc(f) ? '' : up(f.via_airway) || 'DCT', dist: Math.round(num(f.distance)), time: secs(f.time_leg), fuel: Math.round(W(f.fuel_leg) / 100) * 100, mach: mach(f) },
      });
    });
    rows.forEach((r) => { r.eta = addSec(off, r.tcum); });
    const rmk = ofpRemarks(ofp, rows.map((r) => r.id));
    rows.forEach((r, i) => { r.remarks = rmk[i] || []; r.rpt = r.remarks.some((x) => /POSN RPT|POSITION REP/.test(x)); });
    return rows;
  }

  function navlog(m, ofp) {
    const { o } = m;
    const rows = navRows(m, ofp);
    const O = o.origin || {}, D = o.dest || {};
    const hh = (d) => (d ? `${Z(d.getUTCHours(), 2)}:${Z(d.getUTCMinutes(), 2)}` : '--:--');
    const box = (k, ph, w) => `<input class="mp-in ${w}" data-k="nl:${k}" placeholder="${ph}" maxlength="${ph.length + 1}"${ph === 'hhmm' ? ' inputmode="numeric"' : ''} autocomplete="off" spellcheck="false">`;
    const leg = (l) => `
      <div class="mp-leg">
        <span class="mp-hex">${esc(l.via)}</span>
        <span class="mp-legd">${l.dist}<sup>NM</sup> | ${esc(hm(l.time))} | ${l.fuel}<sup>lb</sup> | ${esc(l.mach)}</span>
      </div>`;
    const body = rows.map((r, i) => {
      const next = rows[i + 1];
      const firCross = r.fir && i > 1 && rows[i - 1].fir && rows[i - 1].fir !== r.fir;
      const kind = r.toc ? 'TOC' : r.tod ? 'TOD' : r.rpt ? 'RPT' : '';
      const tags = `${(kind || r.remarks.length) ? `<span class="mp-bub">${ico('chat')}</span>` : ''}${kind ? `<span class="mp-tag">${kind}</span>` : ''}`;
      return `${firCross ? `<div class="mp-fir"><span>FIR</span></div>` : ''}
      <div class="mp-fix" data-fix="${i}" tabindex="0" role="button" aria-expanded="false">
        <div class="mp-fixh"><b>${esc(fixName(r.id))}</b>${tags}<span class="mp-grow"></span>${ico('more', 'mp-kb')}</div>
        <div class="mp-nlrow" data-tcum="${r.tcum}" data-eta="${r.eta ? r.eta.getTime() : ''}" data-prmg="${(r.fob / 1000).toFixed(1)}" data-lat="${r.lat || ''}" data-lon="${r.lon || ''}">
          <span class="mp-reta">${esc(hh(r.eta))}</span><span class="mp-eta">${esc(hh(r.eta))}</span><span class="mp-ent">${box(`${i}:ata`, 'hhmm', 'w4')}<em class="mp-dv" hidden></em></span>
          <span>${esc(hm(r.tcum))}</span><span>${(r.fob / 1000).toFixed(1)}</span><span class="mp-ent">${box(`${i}:armg`, 'NNN.N', 'w5')}<em class="mp-dv" hidden></em></span>
          <span>${esc(r.fl)}</span><span class="mp-ent">${box(`${i}:afl`, 'NNN', 'w3')}</span>
        </div>
        ${details(r, i, m)}
      </div>${next ? leg(next.leg) : ''}`;
    }).join('');

    return chrome(m, 'navlog', `
  <div class="mp-nlhead">
    <div class="mp-nltitle">Nav Log</div>
    <div class="mp-nlsel"><b>${esc(O.icao)}</b><i class="mp-seg"></i><b>${esc(D.icao)}</b><span class="mp-grow"></span>${ico('chev')}</div>
  </div>
  <div class="mp-gpsbar" data-flight="${esc(o.requestId || `${o.callsign}-${O.icao}-${D.icao}`)}" data-elev="${num(O.elev) || 0}">
    <span class="mp-gpslbl">Auto ATA</span>
    <select class="mp-gpssrc" aria-label="Position source"><option value="vatsim">VATSIM</option><option value="simconnect">SimConnect</option></select>
    <input class="mp-gpscs" value="${esc(o.callsign || '')}" placeholder="CALLSIGN" maxlength="10" spellcheck="false" autocomplete="off" aria-label="VATSIM callsign">
    <button type="button" class="mp-gpsbtn" data-mp-gps aria-pressed="false">OFF</button>
    <span class="mp-gpsst"></span>
  </div>
  <div class="mp-nlcols"><span>RETA</span><span>ETA</span><span>ATA</span><span>TCUM</span><span>PRMG<sup>klb</sup></span><span>ARMG<sup>klb</sup></span><span>PFL</span><span>AFL</span></div>
  <div class="mp-nlwrap">
    <div class="mp-nllist">${body}</div>
    <div class="mp-nlside">
      <span class="mp-sbtn">${ico('expand')}</span>
      <span class="mp-grow"></span>
      <span class="mp-sbtn" data-mp-scroll="-1" role="button" tabindex="0">${ico('up')}</span>
      <span class="mp-sbtn" data-mp-scroll="1" role="button" tabindex="0">${ico('down')}</span>
    </div>
  </div>`);
  }

  // Live behaviour after render (matches the real app):
  // - ATA: typed = manual (blue); ATA filled by a position source (data-src="gps") = green.
  //   Pill under it = ATA − ETA (green when early/on time, amber when late).
  // - ARMG: always manual (blue). Pill = ARMG − PRMG in klb (green at/above plan, amber below).
  // - AFL: manual (blue), no pill.
  // - Departure (airport row) ATA = actual OFF: the whole ETA column re-bases to OFF + TCUM,
  //   so the departure pill reads 00:00 and later pills compare against the re-based ETA.
  // - RETA at a fix = latest ATA at an EARLIER fix + planned time from that fix; a fix's own
  //   ATA does not change its own RETA. Any RETA derived from an ATA = green.
  // - Header destination: "ETA hh:mmZ" until an ATA exists, then "RETA hh:mmZ" on a blue box.
  //   Tapping it shows (R)ETA and STA in Z/(L) with a pill (R)ETA − STA.
  // ---- tab drawers + unread state ----
  const READ_KEY = 'mp.read';
  const readStore = {
    all() { try { return JSON.parse(localStorage.getItem(READ_KEY)) || {}; } catch { return {}; } },
    get(f) { return this.all()[f] || {}; },
    mark(f, id) {
      const all = this.all(); all[f] = { ...(all[f] || {}), [id]: 1 };
      try { localStorage.setItem(READ_KEY, JSON.stringify(all)); } catch { /* storage unavailable */ }
    },
  };
  // Post Flight (guide 4.8): Close Flight clears this flight's entries; Send PFR & Close downloads the
  // Post Flight Report (Nav Log entries, FDRA, NOTAM marks) as a text file first.
  function postFlight(root, screen, action) {
    const flight = screen.dataset.flight;
    if (action === 'pfr') {
      const rows = [...root.querySelectorAll('.mp-nlrow')];
      const v = (r, k) => r.querySelector(`input[data-k$=":${k}"]`)?.value || '';
      const lines = ['POST FLIGHT REPORT', `FLIGHT ${flight}`, `GENERATED ${new Date().toISOString().slice(0, 16).replace('T', ' ')}Z`, '',
        'FIX        ETA    ATA    PRMG   ARMG   AFL'];
      rows.forEach((r) => {
        const id = r.closest('.mp-fix')?.querySelector('.mp-fixh b')?.textContent || '';
        const cells = r.querySelectorAll(':scope > span');
        lines.push(`${id.padEnd(10)} ${(cells[1]?.textContent || '').padEnd(6)} ${v(r, 'ata').padEnd(6)} ${String(r.dataset.prmg || '').padEnd(6)} ${v(r, 'armg').padEnd(6)} ${v(r, 'afl')}`);
      });
      const fd = liveStore.get(flight).fdra;
      lines.push('', `FDRA: ${fd ? `ACCEPTED BY ${fd.name} ${fd.staff} AT ${fd.at}` : 'NOT ACCEPTED'}`);
      const nt = notamStore.get(flight);
      const marked = [...new Set([...Object.keys(nt.p), ...Object.keys(nt.b)])];
      lines.push(`NOTAMS VIEWED: ${Object.keys(nt.v).length}`, ...marked.map((id) => `  ${id} ${nt.p[id] ? `IMPORTANCE ${nt.p[id].toUpperCase()}` : ''} ${nt.b[id] ? 'BOOKMARKED' : ''}`.trimEnd()));
      const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `PFR_${flight.replace(/[^\w-]+/g, '_')}.txt`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
    if (!window.confirm(action === 'pfr' ? 'PFR saved. Close this flight and clear its Nav Log entries, NOTAM marks and FDRA?' : 'Close this flight and clear its Nav Log entries, NOTAM marks and FDRA?')) return;
    root.querySelectorAll('input[data-k]').forEach((el) => { if (el.value) { el.value = ''; delete el.dataset.src; el.dispatchEvent(new Event('input', { bubbles: true })); } });
    [READ_KEY, NOTAM_KEY, LIVE_KEY, GPS_KEY].forEach((k) => {
      try { const all = JSON.parse(localStorage.getItem(k)) || {}; delete all[flight]; localStorage.setItem(k, JSON.stringify(all)); } catch { /* storage unavailable */ }
    });
    refreshDrawers(root);
    root.querySelector('[data-mp-page="dashboard"]')?.click();
  }

  function refreshDrawers(root) {
    root.querySelectorAll('.mp-screen').forEach((screen) => {
      const read = readStore.get(screen.dataset.flight);
      screen.querySelectorAll('.mp-dri').forEach((b) => b.classList.toggle('unread', b.dataset.defaultUnread === '1' && !read[b.dataset.mpDoc]));
      if (liveStore.get(screen.dataset.flight).fdra) screen.querySelectorAll('.mp-dri[data-mp-doc="prep:fdra"] span').forEach((x) => { x.innerHTML = 'FDRA<br>Signed'; });
      screen.querySelectorAll('[data-mp-badge]').forEach((bd) => {
        const n = screen.querySelectorAll(`.mp-drawer[data-mp-drawer="${bd.dataset.mpBadge}"] .mp-dri.unread`).length;
        bd.textContent = n; bd.hidden = !n;
      });
    });
  }
  function closeDrawers(screen) {
    screen.querySelectorAll('.mp-drawer.open').forEach((d) => { d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); });
    screen.querySelectorAll('[data-mp-tab]').forEach((t) => { t.classList.remove('dr'); t.setAttribute('aria-expanded', 'false'); });
    screen.classList.remove('dr-open');
    const scrim = screen.querySelector('.mp-scrim'); if (scrim) scrim.hidden = true;
  }
  function wireDrawers(root) {
    if (root.dataset.mpDrawers) return;
    root.dataset.mpDrawers = '1';
    const act = (e) => {
      const screen = e.target.closest('.mp-screen');
      if (!screen) return false;
      const tab = e.target.closest('[data-mp-tab]');
      if (tab) {
        const key = tab.dataset.mpTab;
        const drawer = screen.querySelector(`.mp-drawer[data-mp-drawer="${key}"]`);
        const wasOpen = drawer.classList.contains('open');
        closeDrawers(screen);
        if (!wasOpen) {
          drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); drawer.scrollTop = 0;
          tab.classList.add('dr'); tab.setAttribute('aria-expanded', 'true');
          screen.classList.add('dr-open');
          screen.querySelector('.mp-scrim').hidden = false;
        }
        return true;
      }
      const item = e.target.closest('[data-mp-doc]');
      if (item) {
        const id = item.dataset.mpDoc;
        readStore.mark(screen.dataset.flight, id);
        refreshDrawers(root);
        closeDrawers(screen);
        const dv = screen.querySelector('.mp-docview');
        const tpl = screen.querySelector(`template[data-mp-doctpl="${id}"]`);
        const label = screen.querySelector(`.mp-dri[data-mp-doc="${id}"] span`);
        dv.querySelector('.mp-dvt').textContent = tpl?.dataset.title || (label ? label.childNodes[0].textContent.trim() : '');
        const body = dv.querySelector('.mp-dvb');
        body.replaceChildren();
        dv.dataset.kind = tpl?.dataset.kind || '';
        if (tpl) { body.appendChild(tpl.content.cloneNode(true)); liveLanding(root, body); wireNotams(screen, dv, body); liveDocs(root, screen, body); }
        else body.innerHTML = '<p class="mp-dvempty">This document isn\'t built in the converter yet.</p>';
        dv.hidden = false;
        dv.scrollTop = 0;
        screen.classList.add('doc-open');
        screen.querySelectorAll('[data-mp-tab]').forEach((t) => t.classList.toggle('docon', t.dataset.mpTab === id.split(':')[0]));
        return true;
      }
      const actn = e.target.closest('[data-mp-action]');
      if (actn) { closeDrawers(screen); postFlight(root, screen, actn.dataset.mpAction); return true; }
      const dvs = e.target.closest('[data-mp-dvscroll]');
      if (dvs) { const dv = screen.querySelector('.mp-docview'); dv.scrollBy({ top: Number(dvs.dataset.mpDvscroll) * dv.clientHeight * 0.8, behavior: 'smooth' }); return true; }
      if (e.target.closest('.mp-scrim') || e.target.closest('[data-mp-page]')) {
        closeDrawers(screen);
        if (e.target.closest('[data-mp-page]')) {
          root.querySelectorAll('.mp-docview').forEach((d) => { d.hidden = true; });
          root.querySelectorAll('.mp-screen').forEach((sc) => { sc.classList.remove('doc-open'); sc.querySelectorAll('.docon').forEach((t) => t.classList.remove('docon')); });
        }
      }
      return false;
    };
    root.addEventListener('click', act);
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') root.querySelectorAll('.mp-screen').forEach(closeDrawers);
      else if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-mp-tab], [data-mp-doc]') && act(e)) e.preventDefault();
    });
  }

  function enhance(root) {
    wireDrawers(root);
    refreshDrawers(root);
    const list = root.querySelector('.mp-nllist');
    if (!list || list.dataset.wired) return;
    list.dataset.wired = '1';
    // Tap a fix to open its detail panel; opening another closes the current one
    const toggle = (fix) => {
      const open = !fix.classList.contains('open');
      list.querySelectorAll('.mp-fix.open').forEach((x) => { x.classList.remove('open'); x.setAttribute('aria-expanded', 'false'); });
      if (open) { fix.classList.add('open'); fix.setAttribute('aria-expanded', 'true'); }
    };
    list.addEventListener('click', (e) => {
      if (e.target.closest('input, button, textarea')) return;
      const fix = e.target.closest('.mp-fix');
      if (fix) toggle(fix);
    });
    list.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.mp-fix')) { e.preventDefault(); toggle(e.target); }
    });
    const rows = [...list.querySelectorAll('.mp-nlrow')];
    const hhmmOf = (d) => `${Z(d.getUTCHours(), 2)}:${Z(d.getUTCMinutes(), 2)}`;
    const sgnHm = (min) => `${min < 0 ? '-' : min > 0 ? '+' : ''}${Z(Math.floor(Math.abs(min) / 60), 2)}:${Z(Math.abs(min) % 60, 2)}`;
    // "hhmm" or "hh:mm" -> Date on the day closest to the fix's planned ETA (handles midnight)
    const parse = (v, planned) => {
      const mt = /^([01]\d|2[0-3]):?([0-5]\d)$/.exec(String(v).trim());
      if (!mt) return undefined;
      if (!planned) return null;
      const d = new Date(planned);
      d.setUTCHours(+mt[1], +mt[2], 0, 0);
      const diff = d - planned;
      if (diff > 12 * 3600e3) d.setTime(d - 86400e3); else if (diff < -12 * 3600e3) d.setTime(+d + 86400e3);
      return d;
    };
    const parseFuel = (v) => (/^\d{1,3}(\.\d)?$/.test(String(v).trim()) ? Number(v) : undefined);
    const pill = (el, txt, tone) => {
      if (!el) return;
      el.hidden = txt == null;
      el.textContent = txt ?? '';
      el.className = `mp-dv ${tone || ''}`;
    };
    const mark = (input, state) => {
      // state: '' (empty), 'bad', 'man', 'gps'; filled values drop the box look unless focused
      input.classList.toggle('bad', state === 'bad');
      input.classList.toggle('set', state === 'man' || state === 'gps');
      input.classList.toggle('gps', state === 'gps');
    };
    const dests = [...root.querySelectorAll('.mp-hdest')];
    const recompute = () => {
      let base = null; // latest ATA at an earlier fix: { time, tcum }
      let destShift = 0;
      // Departure ATA (actual OFF) re-bases every ETA
      const r0 = rows[0];
      const offIn = r0?.querySelector('input[data-k$=":ata"]');
      const offPlanned = Number(r0?.dataset.eta) || null;
      const off = offIn?.value ? parse(offIn.value, offPlanned) : null;
      const offShift = off && offPlanned ? off.getTime() - offPlanned : 0;
      rows.forEach((row, idx) => {
        const planned0 = Number(row.dataset.eta) || null;
        const planned = planned0 ? planned0 + offShift : null;
        const tcum = Number(row.dataset.tcum) || 0;
        const etaCell = row.querySelector('.mp-eta');
        if (etaCell) etaCell.textContent = planned ? hhmmOf(new Date(planned)) : '--:--';
        // RETA from earlier ATAs only
        const cell = row.querySelector('.mp-reta');
        const reta = base ? new Date(base.time + (tcum - base.tcum) * 1000) : (planned ? new Date(planned) : null);
        cell.textContent = reta ? hhmmOf(reta) : '--:--';
        cell.classList.toggle('rev', !!base && !!reta);
        if (idx === rows.length - 1 && reta && planned0) destShift = reta.getTime() - planned0;
        // ATA
        const ataIn = row.querySelector('input[data-k$=":ata"]');
        const ata = ataIn.value ? parse(ataIn.value, planned0) : null;
        mark(ataIn, !ataIn.value ? '' : ata === undefined ? 'bad' : ataIn.dataset.src === 'gps' ? 'gps' : 'man');
        const ataPill = ataIn.parentElement.querySelector('.mp-dv');
        if (ata && planned) {
          const dm = Math.round((ata.getTime() - planned) / 60000);
          pill(ataPill, sgnHm(dm), dm > 0 ? 'late' : 'ok');
        } else pill(ataPill, null);
        if (ata) base = { time: ata.getTime(), tcum };
        // ARMG vs PRMG
        const fuelIn = row.querySelector('input[data-k$=":armg"]');
        const armg = fuelIn.value ? parseFuel(fuelIn.value) : null;
        mark(fuelIn, !fuelIn.value ? '' : armg === undefined ? 'bad' : 'man');
        const fuelPill = fuelIn.parentElement.querySelector('.mp-dv');
        if (armg != null && armg !== undefined) {
          const dv = Math.round((armg - Number(row.dataset.prmg)) * 10) / 10;
          pill(fuelPill, `${dv < 0 ? '-' : '+'}${Math.abs(dv).toFixed(1)}`, dv < 0 ? 'late' : 'ok');
        } else pill(fuelPill, null);
        // AFL
        const flIn = row.querySelector('input[data-k$=":afl"]');
        mark(flIn, !flIn.value ? '' : /^\d{2,3}$/.test(flIn.value.trim()) ? 'man' : 'bad');
      });
      const revised = !!base;
      root.dataset.mpShift = String(destShift);
      root.dataset.mpRev = revised ? '1' : '';
      dests.forEach((h) => {
        if (!h.dataset.in) return;
        const t = new Date(Number(h.dataset.in) + destShift);
        const lbl = revised ? 'RETA' : 'ETA';
        const loc = (d) => { const tz = h.dataset.tz; if (tz === '') return ''; const x = new Date(d.getTime() + Number(tz) * 3600e3); return `/${hhmmOf(x)}(L)`; };
        h.classList.toggle('rev', revised);
        h.querySelector('.mp-hreta').textContent = `${lbl} ${hhmmOf(t)}Z`;
        h.querySelector('.mp-ep-l').textContent = lbl;
        h.querySelector('.mp-ep-eta').textContent = `${hhmmOf(t)}Z${loc(t)}`;
        const sta = Number(h.dataset.sta) || null;
        h.querySelector('.mp-ep-sta').textContent = sta ? `${hhmmOf(new Date(sta))}Z${loc(new Date(sta))}` : '-';
        const dm = sta ? Math.round((t.getTime() - sta) / 60000) : null;
        pill(h.querySelector('.mp-etapop .mp-dv'), dm == null ? null : sgnHm(dm), dm > 0 ? 'late' : 'ok');
      });
    };
    // Tap the destination box to show (R)ETA vs STA; tap anywhere else to close
    dests.forEach((h) => {
      const pop = h.querySelector('.mp-etapop');
      const toggle = (e) => { e.stopPropagation(); pop.hidden = !pop.hidden; h.classList.toggle('open', !pop.hidden); };
      h.addEventListener('click', toggle);
      h.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); } });
      root.addEventListener('click', () => { pop.hidden = true; h.classList.remove('open'); });
    });
    // Typing is free-form; on leaving the box "1124" becomes "11:24" and "12" fuel becomes "12.0"
    list.addEventListener('input', (e) => { if (e.target.matches('input[data-k]')) { delete e.target.dataset.src; recompute(); } });
    list.addEventListener('change', (e) => {
      const el = e.target;
      if (el.matches('input[data-k$=":ata"]') && /^\d{4}$/.test(el.value.trim())) { el.value = `${el.value.slice(0, 2)}:${el.value.slice(2)}`; el.dispatchEvent(new Event('input', { bubbles: true })); }
      if (el.matches('input[data-k$=":armg"]') && /^\d{1,3}$/.test(el.value.trim())) { el.value = `${Number(el.value)}.0`; el.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    // Hook for a position source (e.g. a sim/VATSIM bridge): fill an ATA as "GPS" (green)
    root.mpSetAta = (rowIndex, date) => {
      const input = rows[rowIndex]?.querySelector('input[data-k$=":ata"]');
      if (!input || input.value) return false;
      input.value = `${Z(date.getUTCHours(), 2)}:${Z(date.getUTCMinutes(), 2)}`;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dataset.src = 'gps';
      recompute();
      return true;
    };

    // ---- "GPS" ATA from the VATSIM network position feed ----
    const bar = root.querySelector('.mp-gpsbar');
    if (bar) wireVatsim(root, bar, rows, recompute);
    recompute();
  }

  // Keeps which ATAs came from the position feed (green) per flight
  const GPS_KEY = 'mp.gpsAta';
  const gpsStore = {
    all() { try { return JSON.parse(localStorage.getItem(GPS_KEY)) || {}; } catch { return {}; } },
    get(f) { return this.all()[f] || {}; },
    set(f, idx, on) {
      const all = this.all(); const m = all[f] || {};
      if (on) m[idx] = 1; else delete m[idx];
      all[f] = m;
      try { localStorage.setItem(GPS_KEY, JSON.stringify(all)); } catch { /* storage unavailable */ }
    },
  };

  const VATSIM_URL = 'https://data.vatsim.net/v3/vatsim-data.json';
  const BRIDGE_URL = 'http://127.0.0.1:47800/position'; // bridge/simbridge.py (SimConnect)
  const POLL_MS = { vatsim: 15000, simconnect: 2000 };

  // Local flat projection in NM around a point (fine for leg-length distances)
  const toXY = (lat, lon, lat0) => ({ x: lon * 60 * Math.cos((lat0 * Math.PI) / 180), y: lat * 60 });

  function wireVatsim(root, bar, rows, recompute) {
    const flight = bar.dataset.flight;
    const elev = Number(bar.dataset.elev) || 0;
    const btn = bar.querySelector('[data-mp-gps]');
    const csIn = bar.querySelector('.mp-gpscs');
    const st = bar.querySelector('.mp-gpsst');
    const coord = (v) => (v === '' || v == null ? NaN : Number(v));
    const fixes = rows.map((r) => ({ lat: coord(r.dataset.lat), lon: coord(r.dataset.lon), input: r.querySelector('input[data-k$=":ata"]') }));
    const ok = (f) => f && Number.isFinite(f.lat) && Number.isFinite(f.lon) && !(f.lat === 0 && f.lon === 0);
    const ataIdx = (input) => fixes.findIndex((f) => f.input === input);

    // restore green (GPS) marks; a manual edit turns a value back to blue
    const marks = gpsStore.get(flight);
    fixes.forEach((f, i) => { if (marks[i] && f.input.value) f.input.dataset.src = 'gps'; });
    root.addEventListener('input', (e) => {
      const i = ataIdx(e.target);
      if (i >= 0 && !e.target.dataset.src) gpsStore.set(flight, i, false);
    });
    const fill = (i, when) => {
      const f = fixes[i];
      if (!f || f.input.value) return;
      when = new Date(Math.round(when.getTime() / 60000) * 60000); // nearest minute
      f.input.value = `${Z(when.getUTCHours(), 2)}:${Z(when.getUTCMinutes(), 2)}`;
      f.input.dispatchEvent(new Event('input', { bubbles: true })); // saves the value (app.js)
      f.input.dataset.src = 'gps';
      gpsStore.set(flight, i, true);
      recompute();
    };

    // Progress = distance flown along the planned route (NM from the first fix with a position).
    // Each sample is matched to the nearest route leg within a short look-ahead window, so
    // vectors, turn-backs and short legs don't confuse it; crossing times are interpolated.
    const cum = []; // cumulative route distance at each fix (NaN where position unknown)
    {
      let acc = 0, last = null;
      fixes.forEach((f, i) => {
        if (!ok(f)) { cum[i] = NaN; return; }
        if (last) { const A = toXY(last.lat, last.lon, f.lat), B = toXY(f.lat, f.lon, f.lat); acc += Math.hypot(B.x - A.x, B.y - A.y); }
        cum[i] = acc; last = f;
      });
    }
    const routePos = (p, fromIdx) => {
      let best = null;
      const lastIdx = fixes.length - 1;
      for (let j = Math.max(1, fromIdx); j <= Math.min(lastIdx, fromIdx + 6); j++) {
        let a = j - 1;
        while (a >= 0 && !ok(fixes[a])) a--;
        if (a < 0 || !ok(fixes[j])) continue;
        const A = toXY(fixes[a].lat, fixes[a].lon, p.lat), B = toXY(fixes[j].lat, fixes[j].lon, p.lat), P = toXY(p.lat, p.lon, p.lat);
        const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1e-6;
        const t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / len;
        const tc = Math.min(len, Math.max(0, t));
        const xtk = Math.hypot(P.x - (A.x + (dx / len) * tc), P.y - (A.y + (dy / len) * tc));
        if (!best || xtk < best.xtk) best = { s: cum[a] + tc, xtk };
      }
      return best && best.xtk <= 30 ? best.s : null;
    };

    // Departure time: in the real airplane it comes from ACARS OOOI and is keyed in by hand, so
    // the tracker writes it like a typed entry (blue, no green GPS mark). Takeoff = the moment
    // ground speed first exceeds 100 kt (interpolated between samples).
    const TO_GS = 100;
    const fillOff = (when) => {
      const f = fixes[0];
      if (!f || f.input.value) return;
      when = new Date(Math.round(when.getTime() / 60000) * 60000);
      f.input.value = `${Z(when.getUTCHours(), 2)}:${Z(when.getUTCMinutes(), 2)}`;
      delete f.input.dataset.src;
      f.input.dispatchEvent(new Event('input', { bubbles: true })); // saves it; reads as manual
      gpsStore.set(flight, 0, false);
      recompute();
    };
    const state = { next: 1, prev: null, lastStamp: '', started: false, offDone: false };
    const onSample = (p) => {
      const airborne = typeof p.onGround === 'boolean' ? !p.onGround && (p.gs >= 40 || p.alt > elev + 100) : p.gs >= 80 || p.alt > elev + 500;
      if (!state.started) {
        state.started = true;
        if (airborne) { // joined mid-flight: skip fixes already behind, don't backfill
          state.offDone = true;
          const s0 = routePos(p, 1);
          if (s0 != null) while (state.next < fixes.length && !(cum[state.next] > s0)) state.next++;
          state.prev = { ...p, s: s0 };
          return;
        }
      }
      if (!state.offDone && p.gs > TO_GS) {
        const q = state.prev;
        let when = p.t;
        if (q && q.gs <= TO_GS && p.gs > q.gs) when = new Date(q.t.getTime() + ((TO_GS - q.gs) / (p.gs - q.gs)) * (p.t.getTime() - q.t.getTime()));
        fillOff(when);
        state.offDone = true;
      }
      const s1 = airborne ? routePos(p, state.next) : null;
      if (s1 != null) {
        const prevS = state.prev && state.prev.s != null ? state.prev.s : null;
        while (state.next < fixes.length) {
          const target = cum[state.next];
          if (Number.isNaN(target)) { state.next++; continue; }
          // within 1 NM counts as crossing the fix
          if (s1 < target - 1) break;
          let when = p.t;
          if (prevS != null && prevS < target && s1 > prevS) {
            const k = Math.min(1, (target - prevS) / (s1 - prevS));
            when = new Date(state.prev.t.getTime() + k * (p.t.getTime() - state.prev.t.getTime()));
          }
          fill(state.next, when);
          state.next++;
        }
      }
      state.prev = { ...p, s: s1 };
    };

    let timer = null;
    const ago = (t) => `${Math.max(0, Math.round((Date.now() - t.getTime()) / 1000))}s ago`;
    const srcSel = bar.querySelector('.mp-gpssrc');
    const src = () => srcSel.value;
    async function pollBridge() {
      try {
        const res = await fetch(BRIDGE_URL, { cache: 'no-store' });
        const data = await res.json();
        if (!data.connected || !data.position) { st.textContent = `Bridge running · ${data.error || 'waiting for the simulator'}`; st.className = 'mp-gpsst warn'; return; }
        const q = data.position;
        const p = { lat: Number(q.lat), lon: Number(q.lon), alt: Number(q.alt), gs: Number(q.gs), onGround: !!q.onGround, t: new Date(q.t || Date.now()) };
        if (q.t !== state.lastStamp) { state.lastStamp = q.t; onSample(p); }
        st.textContent = `${data.source === 'demo' ? 'DEMO' : 'SimConnect'} · ${p.onGround ? 'on ground' : `${p.gs} kt · FL${Z(Math.round(p.alt / 100), 3)}`} · ${ago(p.t)}`;
        st.className = 'mp-gpsst ok';
      } catch (err) {
        st.textContent = 'SimConnect bridge not running — start simbridge.exe';
        st.className = 'mp-gpsst warn';
      }
    }
    async function poll() {
      if (src() === 'simconnect') return pollBridge();
      const cs = csIn.value.trim().toUpperCase();
      if (!cs) { st.textContent = 'enter callsign'; return; }
      try {
        const res = await fetch(VATSIM_URL, { cache: 'no-store' });
        const data = await res.json();
        const pilot = (data.pilots || []).find((x) => String(x.callsign).toUpperCase() === cs);
        if (!pilot) { st.textContent = `${cs} not connected`; st.className = 'mp-gpsst warn'; return; }
        const stamp = pilot.last_updated || data.general?.update_timestamp || '';
        const p = { lat: Number(pilot.latitude), lon: Number(pilot.longitude), alt: Number(pilot.altitude), gs: Number(pilot.groundspeed), t: new Date(stamp || Date.now()) };
        if (stamp !== state.lastStamp) { state.lastStamp = stamp; onSample(p); }
        st.textContent = `${cs} · ${p.gs} kt · FL${Z(Math.round(p.alt / 100), 3)} · ${ago(p.t)}`;
        st.className = 'mp-gpsst ok';
      } catch (err) {
        st.textContent = 'VATSIM feed unreachable';
        st.className = 'mp-gpsst warn';
      }
    }
    const setOn = (on) => {
      clearInterval(timer); timer = null;
      if (window.__mpGpsTimer) clearInterval(window.__mpGpsTimer);
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? 'ON' : 'OFF';
      btn.classList.toggle('on', on);
      try { localStorage.setItem('mp.gpsOn', on ? '1' : ''); localStorage.setItem('mp.gpsCs', csIn.value.trim().toUpperCase()); localStorage.setItem('mp.gpsSrc', src()); } catch { /* ignore */ }
      if (on) { poll(); timer = setInterval(() => { if (!document.body.contains(bar)) { clearInterval(timer); return; } poll(); }, POLL_MS[src()] || 15000); window.__mpGpsTimer = timer; }
      else { st.textContent = ''; st.className = 'mp-gpsst'; }
    };
    try { const cs = localStorage.getItem('mp.gpsCs'); if (cs && !csIn.value) csIn.value = cs; } catch { /* ignore */ }
    try { const sv = localStorage.getItem('mp.gpsSrc'); if (sv) srcSel.value = sv; } catch { /* ignore */ }
    const showCs = () => { csIn.hidden = src() !== 'vatsim'; };
    showCs();
    srcSel.addEventListener('change', () => {
      showCs();
      Object.assign(state, { prev: null, lastStamp: '' });
      const on = btn.getAttribute('aria-pressed') === 'true';
      try { localStorage.setItem('mp.gpsSrc', src()); } catch { /* ignore */ }
      if (on) setOn(true); else st.textContent = '';
    });
    btn.addEventListener('click', () => setOn(btn.getAttribute('aria-pressed') !== 'true'));
    csIn.addEventListener('change', () => { if (btn.classList.contains('on')) { Object.assign(state, { next: 1, prev: null, lastStamp: '', started: false, offDone: false }); poll(); } });
    let wasOn = false;
    try { wasOn = localStorage.getItem('mp.gpsOn') === '1'; } catch { /* ignore */ }
    if (wasOn) setOn(true);
    root.mpGpsSample = onSample; // test hook: feed { lat, lon, alt, gs, t: Date }
  }

  function navText(m, ofp) {
    const rows = navRows(m, ofp);
    const hh = (d) => (d ? `${Z(d.getUTCHours(), 2)}:${Z(d.getUTCMinutes(), 2)}` : '--:--');
    const out = ['MISSION+ NAV LOG', `${C.L('FIX', 10)}${C.L('RETA', 7)}${C.L('ETA', 7)}${C.L('ATA', 6)}${C.L('TCUM', 7)}${C.L('PRMG', 7)}${C.L('ARMG', 7)}${C.L('PFL', 7)}AFL`];
    rows.forEach((r, i) => {
      out.push(`${C.L(fixName(r.id), 10)}${C.L(hh(r.eta), 7)}${C.L(hh(r.eta), 7)}${C.L('____', 6)}${C.L(hm(r.tcum), 7)}${C.L((r.fob / 1000).toFixed(1), 7)}${C.L('_____', 7)}${C.L(r.fl, 7)}___`);
      const n = rows[i + 1];
      if (n) out.push(`   ${C.L(n.leg.via || '(PROC)', 8)}${n.leg.dist}NM | ${hm(n.leg.time)} | ${n.leg.fuel}LB | ${n.leg.mach}`);
    });
    return out.join('\n');
  }

  function text(m) {
    const { o, alt, fuel } = m;
    const O = o.origin || {}, D = o.dest || {};
    return [
      `MISSION+ DASHBOARD  ${o.callsign} ${m.dateTag}  ${o.reg} ${o.icaoType}`,
      `${m.flightId}  ${m.intl ? 'INTERNATIONAL' : 'DOMESTIC'}`,
      `${O.icao}/${O.iata || O.code} ${O.name}  STD ${zt(m.sOut)} ${lt(m.sOut, m.tzO)}`,
      `${D.icao}/${D.iata || D.code} ${D.name}  STA ${zt(m.sIn)} ${lt(m.sIn, m.tzD)}`,
      `ALTN ${alt ? alt.icao : 'NONE'}  TIME TO ALTN ${alt && m.altEte ? `+${hm(m.altEte)}` : '--'}`,
      `SCHD BLOCK ${hm(m.block)}  FLIGHT TIME ${hm(m.air)}  LDG ${zt(m.eOn)}`,
      '',
      `T/O GROSS WT     ${lb(fuel.tow)}    LANDING WT        ${lb(fuel.ldw)}`,
      `BLOCK FUEL       ${lb(fuel.block)}    MIN FUEL FOR T/O  ${lb(fuel.minTo)}`,
      `FUEL AT TOC      ${fuel.toc ? lb(fuel.toc) : '--'}    PLAN LANDING FUEL ${lb(fuel.planLdg)}`,
      `MIN LDG FUEL     ${lb(fuel.minLdg)}    AVAIL DELAY FUEL  ${lb(fuel.delay)}`,
      '',
      `NOTAMS  ORIGIN ${m.notams.o}  ENROUTE/ALTN ${m.notams.e}  DEST ${m.notams.d}`,
      `RELEASE ${o.release}.0  ${o.requestId}  DISPATCH ${up(o.crew.dx)}`,
      ...[...m.crewDeck, ...m.crewCabin].map((p) => `${p.role.toUpperCase()}: ${p.name} (${p.emp})`),
    ].join('\n');
  }

  const def = {
    id: 'missionplus',
    name: 'Mission+ (iPad EFB)',
    description: 'Mission+ iPad EFB layout: Dashboard (route timeline, fuel/weights, NOTAM/WX tiles, release, crew, aircraft) and Nav Log (RETA/ETA/ATA, fuel remaining, FLs, leg data).',
    device: 'ipad',
    enhance,
    format(ofp, settings = {}) {
      const m = prep(ofp, settings);
      return [
        { id: 'dashboard', title: 'Dashboard', html: dashboard(m), text: text(m) },
        { id: 'navlog', title: 'Nav Log', html: navlog(m, ofp), text: navText(m, ofp), newPage: true },
      ];
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = def;
  else root.OFPFormats.register(def);
})(typeof window !== 'undefined' ? window : this);
