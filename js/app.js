(function () {
  'use strict';

  const SETTINGS_KEY = 'ofp.settings';
  const ID_KEY = 'ofp.simbriefId';
  const FORMAT_KEY = 'ofp.format';
  const API = 'https://www.simbrief.com/api/xml.fetcher.php';

  const $ = (id) => document.getElementById(id);
  const els = {
    form: $('fetchForm'), id: $('sbId'), format: $('formatSelect'), formatDesc: $('formatDesc'), fetchBtn: $('fetchBtn'), file: $('fileInput'), demo: $('demoBtn'),
    settingsBtn: $('settingsBtn'), settings: $('settings'), settingsForm: $('settingsForm'), settingsClose: $('settingsClose'),
    status: $('status'), empty: $('empty'), output: $('output'), tabs: $('tabs'), paper: $('paper'),
    srcEmpty: $('srcEmpty'), srcFrame: $('srcFrame'),
    copy: $('copyBtn'), txt: $('txtBtn'), print: $('printBtn'),
  };

  let lastOfp = null;
  let lastSections = [];
  let devicePage = null; // active page id for device formats (e.g. Mission+)
  const INPUTS_KEY = 'ofp.deviceInputs';

  // ---------- storage ----------
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

  function readSettings() {
    const s = {};
    for (const el of els.settingsForm.elements) {
      if (!el.name) continue;
      s[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    }
    return s;
  }
  function writeSettings(s) {
    for (const el of els.settingsForm.elements) {
      if (!el.name || !(el.name in s)) continue;
      if (el.type === 'checkbox') el.checked = !!s[el.name];
      else el.value = s[el.name];
    }
  }

  // ---------- formats ----------
  const currentFormat = () => window.OFPFormats.get(els.format.value);
  function initFormats() {
    const list = window.OFPFormats.list();
    els.format.replaceChildren(...list.map((f) => {
      const o = document.createElement('option');
      o.value = f.id;
      o.textContent = f.name;
      return o;
    }));
    const saved = load(FORMAT_KEY, '');
    if (list.some((f) => f.id === saved)) els.format.value = saved;
    applyFormat();
  }
  function applyFormat() {
    const f = currentFormat();
    els.format.title = f.description || f.name;
    if (els.formatDesc) els.formatDesc.textContent = f.description || '';
    // show only the settings that belong to this format (plus general ones)
    els.settingsForm.querySelectorAll('fieldset[data-format]').forEach((fs) => {
      fs.hidden = fs.dataset.format !== (f.settingsGroup || f.id);
    });
  }
  els.format.addEventListener('change', () => {
    save(FORMAT_KEY, els.format.value);
    applyFormat();
    render();
  });

  // ---------- status ----------
  function status(msg, kind) {
    els.status.textContent = msg || '';
    els.status.className = `status ${kind || ''}`;
  }

  // ---------- render ----------
  function render() {
    if (!lastOfp) return;
    try {
      lastSections = currentFormat().format(lastOfp, readSettings());
    } catch (e) {
      status(e.message, 'error');
      return;
    }
    els.paper.classList.toggle('device', !!currentFormat().device);
    els.paper.replaceChildren(...lastSections.map((s) => {
      const sec = document.createElement('section');
      if (s.newPage) sec.className = 'new-page';
      if (s.html) {
        // HTML view (device formats); the format escapes all OFP values
        sec.id = `sec-${s.id}`;
        sec.innerHTML = s.html;
        return sec;
      }
      const pre = document.createElement('pre');
      pre.id = `sec-${s.id}`;
      // \u0002…\u0003 marks bold runs
      s.text.split(/(\u0002[^\u0003]*\u0003)/).forEach((part) => {
        if (!part) return;
        if (part[0] === '\u0002') {
          const bEl = document.createElement('b');
          bEl.textContent = part.slice(1, -1);
          pre.appendChild(bEl);
        } else pre.appendChild(document.createTextNode(part));
      });
      sec.appendChild(pre);
      return sec;
    }));
    els.tabs.replaceChildren(...lastSections.map((s) => {
      const a = document.createElement('a');
      a.href = `#sec-${s.id}`;
      a.textContent = s.title;
      a.dataset.page = s.id;
      return a;
    }));
    if (currentFormat().device) {
      if (!lastSections.some((s) => s.id === devicePage)) devicePage = lastSections[0]?.id;
      showPage(devicePage);
      restoreInputs();
      currentFormat().enhance?.(els.paper);
    }
    els.empty.hidden = true;
    els.output.hidden = false;
  }

  // ---------- device formats: one page at a time, tappable tabs, saved entry boxes ----------
  function showPage(id) {
    devicePage = id;
    els.paper.querySelectorAll(':scope > section').forEach((sec) => { sec.hidden = sec.id !== `sec-${id}`; });
    els.tabs.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.page === id));
  }
  const inputScope = () => `${lastOfp?.params?.request_id || ''}:${currentFormat().id}`;
  function restoreInputs() {
    const all = load(INPUTS_KEY, {})[inputScope()] || {};
    els.paper.querySelectorAll('input[data-k]').forEach((el) => { el.value = all[el.dataset.k] || ''; });
  }
  els.paper.addEventListener('input', (e) => {
    const el = e.target.closest('input[data-k]');
    if (!el) return;
    const store = load(INPUTS_KEY, {});
    const scope = inputScope();
    store[scope] = { ...(store[scope] || {}), [el.dataset.k]: el.value.toUpperCase() };
    if (!el.value) delete store[scope][el.dataset.k];
    save(INPUTS_KEY, store);
  });
  function deviceAction(e) {
    const page = e.target.closest('[data-mp-page]');
    if (page) { showPage(page.dataset.mpPage); els.paper.closest('.pane-body')?.scrollTo({ top: 0 }); return true; }
    const sc = e.target.closest('[data-mp-scroll]');
    if (sc) {
      const list = sc.closest('section').querySelector('.mp-nllist');
      list?.scrollBy({ top: Number(sc.dataset.mpScroll) * list.clientHeight * 0.8, behavior: 'smooth' });
      return true;
    }
    return false;
  }
  els.paper.addEventListener('click', deviceAction);
  els.paper.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && deviceAction(e)) e.preventDefault(); });
  els.tabs.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-page]');
    if (!a || !currentFormat().device) return;
    e.preventDefault();
    showPage(a.dataset.page);
  });

  // SimBrief's own OFP (text.plan_html), isolated in a sandboxed iframe
  const SRC_CSS = '<style>body{margin:0;padding:24px 28px;background:#fbfaf5;color:#1b1b1b;font:clamp(12px,calc((100vw - 56px) / 46),24px)/1.35 "Courier New",monospace}'
    + 'pre{font:inherit;white-space:pre;margin:0}img{max-width:100%}</style>';
  function renderSource(ofp) {
    const html = ofp?.text?.plan_html;
    els.srcEmpty.textContent = 'No SimBrief OFP text in this plan (text.plan_html missing). Fetch from SimBrief to see it.';
    els.srcEmpty.hidden = !!html;
    els.srcFrame.hidden = !html;
    els.srcFrame.srcdoc = html ? SRC_CSS + html : '';
  }

  function show(ofp, label) {
    lastOfp = ofp;
    renderSource(ofp);
    render();
    const g = ofp.general || {};
    const o = ofp.origin?.icao_code || '';
    const d = ofp.destination?.icao_code || '';
    status(`${label}: ${g.icao_airline || ''}${g.flight_number || ''} ${o}–${d}`.trim(), 'ok');
  }

  // ---------- SimBrief ----------
  async function fetchSimbrief(id) {
    const key = /^\d+$/.test(id) ? 'userid' : 'username';
    const url = `${API}?json=v2&${key}=${encodeURIComponent(id)}&_=${Date.now()}`;
    let res;
    try {
      res = await fetch(url, { cache: 'no-store' });
    } catch (e) {
      throw new Error('Could not reach SimBrief (network or browser blocked the request). Try again, or use Load JSON.');
    }
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON response */ }
    const st = data?.fetch?.status;
    if (!res.ok || (st && !/success/i.test(st))) {
      throw new Error(st ? `SimBrief: ${st.replace(/^Error:\s*/i, '')}` : `SimBrief returned HTTP ${res.status}`);
    }
    if (!data) throw new Error('SimBrief returned an unreadable response.');
    return data;
  }

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = els.id.value.trim();
    if (!id) return;
    save(ID_KEY, id);
    els.fetchBtn.disabled = true;
    status('Fetching latest OFP from SimBrief…');
    try {
      show(await fetchSimbrief(id), 'Loaded');
    } catch (err) {
      status(err.message, 'error');
    } finally {
      els.fetchBtn.disabled = false;
    }
  });

  els.file.addEventListener('change', async () => {
    const f = els.file.files[0];
    if (!f) return;
    try {
      show(JSON.parse(await f.text()), `Loaded ${f.name}`);
    } catch (err) {
      status(`Could not read ${f.name}: ${err.message}`, 'error');
    }
    els.file.value = '';
  });

  els.demo.addEventListener('click', async () => {
    try {
      const demo = { psa: 'btv-phl', rpa: 'iad-phl', missionplus: 'btv-phl' }[currentFormat().id] || 'btv-phl';
      const res = await fetch(`test/fixtures/${demo}.json`);
      show(await res.json(), 'Demo');
    } catch (err) {
      status(`Demo unavailable: ${err.message}`, 'error');
    }
  });

  // ---------- settings ----------
  function toggleSettings(open) {
    els.settings.hidden = !open;
    els.settingsBtn.setAttribute('aria-expanded', String(open));
  }
  els.settingsBtn.addEventListener('click', () => toggleSettings(els.settings.hidden));
  els.settingsClose.addEventListener('click', () => toggleSettings(false));
  els.settingsForm.addEventListener('input', () => { save(SETTINGS_KEY, readSettings()); render(); });
  els.settingsForm.addEventListener('submit', (e) => e.preventDefault());

  // ---------- output actions ----------
  const fullText = () => lastSections.map((s) => s.text.replace(/[\u0002\u0003]/g, '')).join('\n\n\f\n');
  const fileName = () => {
    const g = lastOfp?.general || {};
    return `${currentFormat().id.toUpperCase()}_${g.flight_number || 'OFP'}_${lastOfp?.origin?.iata_code || lastOfp?.origin?.icao_code || ''}_${lastOfp?.destination?.iata_code || lastOfp?.destination?.icao_code || ''}.txt`;
  };
  els.copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(fullText().replace(/\f\n/g, ''));
      status('Copied to clipboard', 'ok');
    } catch {
      status('Clipboard not available in this browser', 'error');
    }
  });
  els.txt.addEventListener('click', () => {
    const blob = new Blob([fullText().replace(/\f\n/g, '')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName();
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  els.print.addEventListener('click', () => window.print());

  // ---------- init ----------
  initFormats();
  writeSettings(load(SETTINGS_KEY, {}));
  els.id.value = load(ID_KEY, '');
})();
