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
    eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/><path d="M4 20L20 4"/>',
    sun: '<circle cx="9" cy="9" r="3"/><path d="M9 2v2M2 9h2M4 4l1.4 1.4M14 4l-1.4 1.4"/><path d="M8 19h10a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.4 1.6A2.8 2.8 0 0 0 8 19z"/>',
    swap: '<path d="M3 9h14l-3-3M21 15H7l3 3"/>',
    crew: '<circle cx="12" cy="7" r="3"/><path d="M6 21v-4a6 6 0 0 1 12 0v4M9 14l3 4 3-4"/>',
    batt: '<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M21 10v4"/><rect x="4" y="9" width="6" height="6" fill="currentColor" stroke="none"/>',
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
    const eOn = date(t.est_on) || addSec(eIn, -secs(t.taxi_in));

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
      sOut, sIn, eOut, eIn, eOn,
      tzO: tzOf(o.origin, t.orig_timezone), tzD: tzOf(o.dest, t.dest_timezone),
      block: sOut && sIn ? (sIn - sOut) / 1000 : secs(t.sched_block),
      air: secs(t.est_time_enroute),
      intl: o.origin && o.dest && o.origin.icao[0] !== o.dest.icao[0],
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

  function html(m) {
    const { o, alt, fuel } = m;
    const O = o.origin || {}, D = o.dest || {};
    const tlwFrom = m.eOn ? new Date(m.eOn.getTime() - 4 * 60000) : null;
    const tabs = [
      ['home', 'Dashboard', 0, true], ['prep', 'Flt Prep'], ['plane', 'In Flight'], ['list', 'Nav Log'],
      ['folder', 'NOTAM', m.notams.o + m.notams.e + m.notams.d], ['wx', 'Weather', [O.metar, D.metar, alt?.metar].filter(Boolean).length],
      ['folder', 'Other Docs'], ['post', 'Post Flight'], ['more', 'Others'],
    ];
    const cell = (label, val, cls = '') => `<div class="mp-f"><div class="mp-fl">${esc(label)}</div><div class="mp-fv ${cls}">${esc(val)}</div></div>`;
    const docTile = (n) => `<div class="mp-tile">${ico('doc', 'mp-ti')}<b>${n}</b><span class="mp-pill">${ico('eye')}${n}</span></div>`;
    const wxTile = (ports) => {
      const withWx = ports.filter((p) => p && (p.metar || p.taf));
      if (!withWx.length) return `<div class="mp-tile">${ico('sun', 'mp-ti')}<span class="mp-pill off">METAR</span></div>`;
      return `<details class="mp-tile mp-wx"><summary>${ico('sun', 'mp-ti')}<span class="mp-pill">METAR</span></summary>${
        withWx.map((p) => `<pre>${esc([p.metar, p.taf].filter(Boolean).join('\n'))}</pre>`).join('')}</details>`;
    };
    const person = (p) => `<div class="mp-person">${ico('crew', 'mp-pi')}<div><div class="mp-pn">${esc(p.name)}</div><div class="mp-pr">${esc(p.role)} (${esc(p.emp)})</div></div></div>`;

    return `
<div class="mp-device"><div class="mp-screen">
  <div class="mp-status">
    <div class="mp-st-l"><b>${esc(o.callsign)} ${esc(m.dateTag)}</b> <span class="${m.current ? 'mp-cur' : 'mp-nc'}">${m.current ? 'Current' : 'Not current'}</span> ${esc(o.reg)} ${esc(o.icaoType)}</div>
    <div class="mp-st-r">${esc(zt(m.now))} ${esc(`${m.now.getUTCDate()} ${MON[m.now.getUTCMonth()]} ${m.now.getUTCFullYear()}`)} ${ico('db')} 100 % ${ico('batt')}</div>
  </div>

  <div class="mp-head">
    <span class="mp-hbtn">${ico('menu')}</span>
    <div class="mp-hp"><div>${esc(O.icao)}</div><small>ETD ${esc(zt(m.eOut))}</small></div>
    <span class="mp-hbtn mp-sq">${ico('route')}</span>
    <div class="mp-hp mp-sq r"><div>${esc(D.icao)}</div><small>ETA ${esc(zt(m.eIn))}</small></div>
    <span class="mp-grow"></span>
    <span class="mp-hbtn mp-badge-wrap">${ico('bell')}<i class="mp-badge">99+</i></span>
    <span class="mp-hbtn">${ico('mark')}</span>
    <span class="mp-hbtn">${ico('more')}</span>
  </div>

  <nav class="mp-tabs">${tabs.map(([k, l, n, on]) => `<div class="mp-tab${on ? ' on' : ''}">${ico(k)}${n ? `<i class="mp-badge">${n}</i>` : ''}<span>${esc(l)}</span></div>`).join('')}</nav>

  <div class="mp-flight">
    <span class="mp-swap">${ico('swap')}</span>
    <div class="mp-fid">${esc(m.flightId)}</div>
    <span class="mp-grow"></span>
    <div class="mp-meta"><div>Ops Type</div><small>${m.intl ? 'International' : 'Domestic'}</small></div>
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
    <div class="mp-alts">ALL ALTERNATES (${o.alts.length})</div>
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
  </div>
</div></div>`;
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
    description: 'Mission+ iPad EFB layout: Dashboard with route timeline, fuel/weights, NOTAM and weather tiles, release, crew and aircraft status.',
    device: 'ipad',
    format(ofp, settings = {}) {
      const m = prep(ofp, settings);
      return [{ id: 'dashboard', title: 'Dashboard', html: html(m), text: text(m) }];
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = def;
  else root.OFPFormats.register(def);
})(typeof window !== 'undefined' ? window : this);
