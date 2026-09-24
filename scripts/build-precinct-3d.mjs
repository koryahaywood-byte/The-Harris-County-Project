// Builds public/data/precinct-3d.json: the per-precinct numbers behind the 3D
// Harris County. Source: public/data/precinct-history.json (county canvass).
// Re-run after precinct-history.json changes:  node scripts/build-precinct-3d.mjs
//
// Output: { builtAt, source, county: {...}, precincts: { "0016": [d24, r24, d20, r20, turnout24, reg24], ... } }
// d/r = presidential votes for the Democratic / Republican nominee; two-party
// shares are computed on the client so the file stays small and auditable.

import fs from "fs";
import path from "path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const hist = JSON.parse(fs.readFileSync(path.join(root, "public/data/precinct-history.json"), "utf8"));

function pres(cycle) {
  const r = hist.cycles[cycle].races.president;
  const di = r.candidates.findIndex(c => c.party === "D");
  const ri = r.candidates.findIndex(c => c.party === "R");
  const out = {};
  for (const [p, v] of Object.entries(r.votes)) out[p] = [v[di] ?? 0, v[ri] ?? 0];
  return out;
}

const p24 = pres("2024G"), p20 = pres("2020G");
const voter = hist.cycles["2024G"].voter;
const precincts = {};
let D24 = 0, R24 = 0, D20 = 0, R20 = 0, T24 = 0, REG = 0;
for (const p of new Set([...Object.keys(p24), ...Object.keys(p20)])) {
  const [d24, r24] = p24[p] ?? [0, 0];
  const [d20, r20] = p20[p] ?? [0, 0];
  const t = voter[p]?.turnout ?? 0, reg = voter[p]?.reg ?? 0;
  precincts[p] = [d24, r24, d20, r20, t, reg];
  D24 += d24; R24 += r24; D20 += d20; R20 += r20; T24 += t; REG += reg;
}

const out = {
  builtAt: new Date().toISOString(),
  source: "Harris County Clerk canvass, 2020 and 2024 general elections (presidential race); voter registration and turnout from the 2024 canvass",
  county: { d24: D24, r24: R24, d20: D20, r20: R20, turnout24: T24, reg24: REG },
  precincts,
};
fs.writeFileSync(path.join(root, "public/data/precinct-3d.json"), JSON.stringify(out));
const share = (d, r) => (100 * d / (d + r)).toFixed(1);
console.log(`precinct-3d.json: ${Object.keys(precincts).length} precincts, 2024 D ${share(D24, R24)}%, 2020 D ${share(D20, R20)}%`);
