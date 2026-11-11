// Render a SimBrief JSON file to PSA text in the terminal.
// Usage: node test/render.js [path/to/ofp.json]
const path = require('path');
const { format } = require('../js/psa-format.js');

const file = process.argv[2] || path.join(__dirname, 'fixtures', 'btv-phl.json');
const ofp = require(path.resolve(file));
const settings = {
  bowArms: 'N603NN=871.82',
  maxBags: 'CRJ9=160',
  placards: '33-21-1-2B CABIN INTERIOR LIGHTS',
};
for (const s of format(ofp, settings)) console.log(`${s.text}\n`);
