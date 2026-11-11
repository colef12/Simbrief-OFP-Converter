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
    copy: $('copyBtn'), txt: $('txtBtn'), print: $('printBtn'),
  };

  let lastOfp = null;
  let lastSections = [];

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
    els.paper.replaceChildren(...lastSections.map((s) => {
      const sec = document.createElement('section');
      if (s.newPage) sec.className = 'new-page';
      const pre = document.createElement('pre');
      pre.id = `sec-${s.id}`;
      pre.textContent = s.text;
      sec.appendChild(pre);
      return sec;
    }));
    els.tabs.replaceChildren(...lastSections.map((s) => {
      const a = document.createElement('a');
      a.href = `#sec-${s.id}`;
      a.textContent = s.title;
      return a;
    }));
    els.empty.hidden = true;
    els.output.hidden = false;
  }

  function show(ofp, label) {
    lastOfp = ofp;
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
      const res = await fetch('test/fixtures/btv-phl.json');
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
  const fullText = () => lastSections.map((s) => s.text).join('\n\n\f\n');
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
