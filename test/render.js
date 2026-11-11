// Render a SimBrief JSON file in a chosen format in the terminal.
// Usage: node test/render.js [path/to/ofp.json] [--format psa]
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const fi = args.indexOf('--format');
const formatId = fi >= 0 ? args.splice(fi, 2)[1] : 'psa';
const formatFile = path.join(__dirname, '..', 'js', 'formats', `${formatId}.js`);
if (!fs.existsSync(formatFile)) {
  const ids = fs.readdirSync(path.dirname(formatFile)).filter((f) => f.endsWith('.js') && f !== 'registry.js').map((f) => f.replace('.js', ''));
  console.error(`Unknown format "${formatId}". Available: ${ids.join(', ')}`);
  process.exit(1);
}
const fmt = require(formatFile);
const defaults = { psa: 'btv-phl.json', rpa: 'iad-phl.json', missionplus: 'btv-phl.json' };
const file = args[0] || path.join(__dirname, 'fixtures', defaults[formatId] || 'btv-phl.json');
const ofp = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
const settings = {
  bowArms: 'N603NN=871.82', maxBags: 'CRJ9=160\nE75L=120', placards: '33-21-1-2B CABIN INTERIOR LIGHTS',
  typeDesignations: 'E75L=E170-200LR', acSuffix: 'E75L=/SAT/NEW ACARS', maxRamp: 'E75L=85870', dispatchDesk: '32',
  cdlList: '71-13-01 | ------- | E2 IB | AFT CORE COWL AERO SEAL',
};
for (const s of fmt.format(ofp, settings)) console.log(`${s.text.replace(/[\u0002\u0003]/g, '')}\n`);
