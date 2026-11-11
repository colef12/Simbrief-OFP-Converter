/*
 * Format registry. Each format file calls OFPFormats.register({
 *   id, name, description, settingsGroup?, device?, format(ofp, settings) -> [{ id, title, text, html?, newPage? }]
 * `html` (already escaped) renders instead of `text`; `text` is still used for Copy / .txt.
 * `enhance(paperEl)` (optional) runs after render to wire live behaviour.
 * `device: 'ipad'` drops the paper styling so the format can draw its own device frame.
 * }). Load this file before any format files.
 */
(function (root) {
  'use strict';
  const formats = [];
  root.OFPFormats = {
    register(def) {
      if (!def || !def.id || typeof def.format !== 'function') throw new Error('Invalid format definition');
      if (formats.some((f) => f.id === def.id)) throw new Error(`Duplicate format id: ${def.id}`);
      formats.push(def);
    },
    list: () => formats.slice(),
    get: (id) => formats.find((f) => f.id === id) || formats[0],
  };
})(window);
