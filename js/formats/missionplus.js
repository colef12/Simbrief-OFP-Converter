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
      tracks: asArray(ofp.tracks?.nat),
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
    ['folder', 'NOTAM', null, 'notam'], ['wx', 'Weather', null, 'wx'], ['folder', 'Other Docs', null, 'docs'], ['post', 'Post Flight'], ['more', 'Others'],
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
        ['Help', [['aboutfp', 'About Flight Plan', 'xml', 0], ['aboutwx', 'About Airport Weather', 'xml', 0]]],
      ],
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
          <div><b class="g">${eta ? `${esc(zt(eta))}` : '-'}</b></div>
          <div><b>${str(r.burn) ? o.W(r.burn) : '-'}</b></div>
        </div>`;
    }).join('');
    const docs = {};
    if (m.etops) docs['inflight:etops'] = { title: 'ETOPS', html: etopsPage(m) };
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
            <div><small>ETA</small><b>${eta ? esc(zt(eta)) : '-'}</b></div>
            <div><small>EFOB (lb)</small><b>${W(p.est_fob)}</b></div>
            <div></div><div></div>
          </div>
          <div class="mp-etprow">
            <div class="w"><small>Airport</small>${da.map((a, k) => `<b>${k ? '&rarr;' : '&larr;'}${esc(up(a.icao_code))}</b>`).join('')}</div>
            <div><small>Condition</small>${da.map(() => `<b>${esc(cnd)}</b>`).join('')}</div>
            <div><small>FL</small>${da.map(() => `<b>${fl}</b>`).join('')}</div>
            <div><small>GSR/GSA</small>${da.map((a) => `<b>${gs(a)}</b>`).join('')}</div>
            <div><small>Time</small><b>${dt ? esc(hhmm2(dt)) : '-'}</b></div>
            <div><small>ETA</small><b>${deta ? esc(zt(deta)) : '-'}</b></div>
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
    return Object.entries(docPages(m)).map(([id, d]) => `<template data-mp-doctpl="${id}" data-title="${esc(d.title)}">${d.html}</template>`).join('');
  }

  function drawers(m) {
    const menus = drawerMenus(m);
    return Object.entries(menus).map(([key, secs]) => `
    <aside class="mp-drawer" data-mp-drawer="${key}" aria-hidden="true">${secs.map(([title, items]) => `
      ${title ? `<h5 class="mp-drh">${esc(title)}</h5>` : '<div class="mp-drgap"></div>'}
      ${items.map(([id, label, kind, unread, sub]) => `
      <button type="button" class="mp-dri${unread ? ' unread' : ''}" data-mp-doc="${key}:${id}" data-default-unread="${unread ? 1 : 0}">
        ${ico(kind === 'img' ? 'dimg' : kind === 'txt' ? 'dtxt' : 'dxml', 'mp-dric')}<span>${esc(label)}${sub ? `<br>${esc(sub)}` : ''}</span>
      </button>`).join('')}`).join('')}
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
        <div class="mp-dvtools"><span class="mp-tool">${ico('expand')}</span><span class="mp-tool">${ico('mapdoc')}</span></div>
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
  function refreshDrawers(root) {
    root.querySelectorAll('.mp-screen').forEach((screen) => {
      const read = readStore.get(screen.dataset.flight);
      screen.querySelectorAll('.mp-dri').forEach((b) => b.classList.toggle('unread', b.dataset.defaultUnread === '1' && !read[b.dataset.mpDoc]));
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
        if (tpl) body.appendChild(tpl.content.cloneNode(true));
        else body.innerHTML = '<p class="mp-dvempty">This document isn\'t built in the converter yet.</p>';
        dv.hidden = false;
        dv.scrollTop = 0;
        screen.classList.add('doc-open');
        screen.querySelectorAll('[data-mp-tab]').forEach((t) => t.classList.toggle('docon', t.dataset.mpTab === id.split(':')[0]));
        return true;
      }
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
