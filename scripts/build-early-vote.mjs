#!/usr/bin/env node
/**
 * Early vote tracker data for the November 3, 2026 general election.
 *
 * Texas has no party registration, so "which side is turning out" is read the
 * way Texas analysts read it: match each early voter to the party primaries
 * they have voted in. Sources are the Harris County Clerk's public rosters
 * (harrisvotes.com → Election Results → Election Rosters):
 *
 *   Daily (cumulative, posted ~8 a.m.):
 *     Cumulative_EV_ToPost_1126.zip   in-person early voters
 *     Cumulative_BBM_ToPost_1126.zip  mail ballots received
 *   Primary history (official rosters, PARTY column):
 *     March 2022, March 2024, March 2026 primaries
 *   Comparison:
 *     November 2022 general (the last midterm), with each voter's method and date
 *
 * Voter-level files stay in .rosters/ (gitignored). Only aggregates are written,
 * to public/data/early-vote-2026.json.
 *
 *   node scripts/build-early-vote.mjs            fetch today's rosters, rebuild
 *   node scripts/build-early-vote.mjs --no-fetch use the rosters already downloaded
 *   node scripts/build-early-vote.mjs --history  rebuild the primary-history cache too
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { execFileSync } from "node:child_process";
import { xlsxRows } from "./lib/xlsx-rows.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const R = path.join(ROOT, ".rosters");
const OUT = path.join(ROOT, "public/data/early-vote-2026.json");
const HIST = path.join(R, "history.tsv");
const G22 = path.join(R, "g2022-agg.json");
const BASE = "https://appfiles.harrisvotes.com/harrisvotes/prd/Reports/";
const args = process.argv.slice(2);

const EV_START_2026 = Date.UTC(2026, 9, 19);   // Mon Oct 19
const EV_DAYS = 12;                            // through Fri Oct 30
const EV_START_2022 = Date.UTC(2022, 9, 24);   // Mon Oct 24, 2022
const DAY = 864e5;
const excelDate = (s) => Date.UTC(1899, 11, 30) + Math.round(+s) * DAY;
const mdy = (s) => { const [m, d, y] = s.split(/[/-]/).map(Number); return Date.UTC(y, m - 1, d); };
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const pct = (s) => String(Number(s)).padStart(4, "0");   // precinct key: "0121"

fs.mkdirSync(R, { recursive: true });

/* ── Downloads ─────────────────────────────────────────────────────────── */
function fetchZip(name, dir) {
  const zip = path.join(R, `${name}.zip`);
  execFileSync("curl", ["-sfL", "-A", "Mozilla/5.0", "-o", zip, BASE + encodeURIComponent(name) + ".zip"]);
  fs.rmSync(path.join(R, dir), { recursive: true, force: true });
  execFileSync("unzip", ["-o", "-q", zip, "-d", path.join(R, dir)]);
}
function fetchFile(remote, local) {
  if (fs.existsSync(path.join(R, local))) return;
  execFileSync("curl", ["-sfL", "-A", "Mozilla/5.0", "-o", path.join(R, local), BASE + remote]);
}
const findFiles = (dir, re) => fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true }).map(f => path.join(dir, f)).filter(f => re.test(f)) : [];

/* ── Precinct lean (2024 two-party Harris share) ───────────────────────── */
const P3D = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/precinct-3d.json"), "utf8")).precincts;
const LEAN = new Map(), REG = new Map();
for (const [k, v] of Object.entries(P3D)) { if (v[0] + v[1] > 0) LEAN.set(pct(k), v[0] / (v[0] + v[1])); REG.set(pct(k), v[5]); }
const CROSS = new Map(Object.entries(JSON.parse(fs.readFileSync(path.join(ROOT, "lib/precinct-crosswalk.json"), "utf8")).precincts).map(([k, v]) => [pct(k), v]));

/* ── Primary history + 2022 midterm comparison (slow; cached) ──────────── */
async function buildHistory() {
  fetchFile("0322_VoterHistory_BothParties.xlsx", "p2022.xlsx");
  if (!findFiles(path.join(R, "p2024"), /VoterHistory\.xlsx$/).length) { fetchFile("0324%20Official%20Voter%20Rosters.zip", "p2024.zip"); execFileSync("unzip", ["-o", "-q", path.join(R, "p2024.zip"), "-d", path.join(R, "p2024")]); }
  if (!findFiles(path.join(R, "0326_OfficialRoster"), /\.xlsx$/).length) fetchZip("0326_OfficialRoster", "0326_OfficialRoster");
  if (!findFiles(path.join(R, "g2022"), /VoterHistory.*\.xlsx$/).length) { fetchFile("1122%20Official%20Voter%20Rosters.zip", "g2022.zip"); execFileSync("unzip", ["-o", "-q", path.join(R, "g2022.zip"), "-d", path.join(R, "g2022")]); }

  const voters = new Map();   // key (VUID, or "i"+county ID) → { id, p22, p24, p26 }
  const byId = new Map();
  const rec = (vuid, id) => {
    let k = vuid || (id && byId.get(id)) || (id ? "i" + id : null);
    if (!k) return null;
    let v = voters.get(k);
    if (!v && id && byId.has(id)) { k = byId.get(id); v = voters.get(k); }
    if (!v) { v = { id: id || "", p22: "", p24: "", p26: "", prec: "" }; voters.set(k, v); }
    if (id && !byId.has(id)) byId.set(id, k);
    if (id && !v.id) v.id = id;
    return v;
  };
  const primaries = [
    ["p22", [path.join(R, "p2022.xlsx")], "VUID", "IDNUMBER", "PARTY_CODE", "NEWPRECINCT"],
    ["p24", findFiles(path.join(R, "p2024"), /VoterHistory\.xlsx$/), "VUID", "IDNUMBER", "PARTY_CODE", "PRECINCT"],
    ["p26", findFiles(path.join(R, "0326_OfficialRoster"), /\.xlsx$/), "StateVoterID", "IDNumber", "Party", "Precinct"],
  ];
  for (const [field, files, vk, ik, pk, preck] of primaries) {
    let n = 0;
    for (const f of files) for await (const r of xlsxRows(f)) {
      const party = (r[pk] || "").trim().toUpperCase();
      if (party !== "D" && party !== "R") continue;
      const v = rec((r[vk] || "").trim(), (r[ik] || "").trim());
      if (v) { v[field] = party; n++; if (r[preck]) v.prec = pct(r[preck]); }
    }
    console.log(`  ${field}: ${n.toLocaleString()} primary voters`);
  }

  // 2022 midterm early vote, by EV day, with that cycle's own primary and precinct lean.
  const g = { days: Array.from({ length: EV_DAYS }, () => ({ inPerson: 0, mail: 0, D: 0, R: 0, N: 0, lean: 0, leanN: 0 })), mailBefore: { mail: 0, D: 0, R: 0, N: 0, lean: 0, leanN: 0 }, electionDay: 0, total: 0 };
  for (const f of findFiles(path.join(R, "g2022"), /VoterHistory.*\.xlsx$/)) for await (const r of xlsxRows(f)) {
    const t = (r.VOTE_TYPE || "").trim();
    g.total++;
    if (t === "E") { g.electionDay++; continue; }
    if (t !== "P" && t !== "M") continue;
    const when = excelDate(r.DATE_VOTED);
    const d = Math.floor((when - EV_START_2022) / DAY);
    const bucket = d < 0 ? g.mailBefore : g.days[Math.min(d, EV_DAYS - 1)];
    if (t === "P") bucket.inPerson = (bucket.inPerson ?? 0) + 1; else bucket.mail++;
    const v = voters.get((r.VUID || "").trim()) ?? voters.get(byId.get((r.IDNUMBER || "").trim()) ?? "");
    const p = v?.p22 || "N";
    bucket[p]++;
    const l = LEAN.get(pct(r.NEWPRECINCT || r.PRECINCT || "0"));
    if (l != null) { bucket.lean += l; bucket.leanN++; }
  }
  fs.writeFileSync(G22, JSON.stringify(g));
  console.log(`  2022 general: ${g.total.toLocaleString()} voters`);

  const out = fs.createWriteStream(HIST);
  for (const [k, v] of voters) out.write(`${k}\t${v.id}\t${v.p22}\t${v.p24}\t${v.p26}\t${v.prec}\n`);
  await new Promise(r => out.end(r));
  console.log(`  history cache: ${voters.size.toLocaleString()} voters`);
}

async function loadHistory() {
  const byVuid = new Map(), byId = new Map(), pools = new Map();   // precinct → { D, R } primary voters living there
  const rl = readline.createInterface({ input: fs.createReadStream(HIST) });
  for await (const line of rl) {
    const [k, id, p22, p24, p26, prec] = line.split("\t");
    // Most recent primary decides; a voter who switched counts for the side they chose last.
    const last = p26 || p24 || p22 || "";
    const rec = { last, p26: p26 || "" };
    if (!k.startsWith("i")) byVuid.set(k, rec);
    if (id) byId.set(id, rec);
    // Turnout pools use March 2026 primary voters only: an older last primary means a staler
    // registration (moves, deaths), and Republicans' pool holds twice the share of those.
    if (prec && p26) { if (!pools.has(prec)) pools.set(prec, { D: 0, R: 0 }); pools.get(prec)[p26]++; }
  }
  return { byVuid, byId, pools };
}

/* ── Daily rosters ─────────────────────────────────────────────────────── */
function parseCsvLine(line) {
  const out = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}
async function* csvRows(file) {
  const rl = readline.createInterface({ input: fs.createReadStream(file) });
  let header = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    const f = parseCsvLine(line);
    if (!header) { header = f.map(s => s.trim()); continue; }
    yield Object.fromEntries(header.map((h, i) => [h, (f[i] ?? "").trim()]));
  }
}

const blank = () => ({ all: 0, inPerson: 0, mail: 0, D: 0, R: 0, N: 0, D26: 0, R26: 0 });
// cls: party of the last primary (2022–26); c26: party in the March 2026 primary, if any.
const add = (o, method, cls, c26) => { o.all++; o[method]++; o[cls]++; if (c26) o[c26 + "26"]++; };

async function build() {
  if (!args.includes("--no-fetch")) { fetchZip("Cumulative_EV_ToPost_1126", "ev"); fetchZip("Cumulative_BBM_ToPost_1126", "bbm"); }
  if (args.includes("--history") || !fs.existsSync(HIST) || !fs.existsSync(G22)) { console.log("building primary history (a few minutes)…"); await buildHistory(); }
  const { byVuid, byId, pools } = await loadHistory();
  const g22 = JSON.parse(fs.readFileSync(G22, "utf8"));

  const totals = blank(), sameCycle = { D: 0, R: 0, N: 0 };
  const byMethod = { inPerson: blank(), mail: blank() };
  const days = Array.from({ length: EV_DAYS }, () => blank());
  const mailBefore = blank();
  const precincts = new Map(), districts = new Map();
  let lean = 0, leanN = 0, matched = 0, through = 0;
  const seen = new Set();

  const files = [
    ["inPerson", findFiles(path.join(R, "ev"), /\.csv$/i)],
    ["mail", findFiles(path.join(R, "bbm"), /\.csv$/i)],
  ];
  for (const [method, list] of files) for (const f of list) for await (const r of csvRows(f)) {
    const vuid = r.StateVoterID, id = r.IDNumber;
    const key = vuid || "i" + id;
    if (seen.has(key)) continue;             // a voter appears once even if both lists carry them
    seen.add(key);
    const h = (vuid && byVuid.get(vuid)) || byId.get(id);
    if (h) matched++;
    const cls = h?.last || "N", c26 = h?.p26 || "";
    sameCycle[c26 || "N"]++;
    add(totals, method, cls, c26);
    add(byMethod[method], method, cls, c26);
    const t = mdy(r.ActivityDate);
    if (method === "inPerson") through = Math.max(through, t);
    const d = Math.floor((t - EV_START_2026) / DAY);
    add(d < 0 ? mailBefore : days[Math.min(Math.max(d, 0), EV_DAYS - 1)], method, cls, c26);
    const p = pct(r.Precinct);
    if (!precincts.has(p)) precincts.set(p, blank());
    add(precincts.get(p), method, cls, c26);
    const l = LEAN.get(p);
    if (l != null) { lean += l; leanN++; }
    const cw = CROSS.get(p);
    if (cw) for (const k of [`HD-${cw.hd}`, `SD-${cw.sd}`, `CD-${cw.cd}`, `PCT-${cw.pct}`, `JP-${cw.jp}`, cw.council ? `COUNCIL-${cw.council}` : null]) {
      if (!k) continue;
      if (!districts.has(k)) districts.set(k, blank());
      add(districts.get(k), method, cls, c26);
    }
  }

  // Each district's pool of primary voters (by the precinct of their latest primary), for turnout rates.
  const districtPools = new Map();
  for (const [p, u] of pools) {
    const cw = CROSS.get(p);
    if (!cw) continue;
    for (const k of [`HD-${cw.hd}`, `SD-${cw.sd}`, `CD-${cw.cd}`, `PCT-${cw.pct}`, `JP-${cw.jp}`, cw.council ? `COUNCIL-${cw.council}` : null]) {
      if (!k) continue;
      if (!districtPools.has(k)) districtPools.set(k, { D: 0, R: 0 });
      districtPools.get(k).D += u.D; districtPools.get(k).R += u.R;
    }
  }
  // Universes: everyone whose most recent primary was D (or R), for turnout rates.
  let uD = 0, uR = 0;
  for (const rec of new Set([...byVuid.values(), ...byId.values()])) { if (rec.p26 === "D") uD++; else if (rec.p26 === "R") uR++; }

  const dayN = Math.min(EV_DAYS, Math.max(1, Math.floor((through - EV_START_2026) / DAY) + 1));
  // 2022 at the same point: cumulative through the same EV day number.
  const cum22 = { all: g22.mailBefore.mail, inPerson: 0, mail: g22.mailBefore.mail, D: g22.mailBefore.D, R: g22.mailBefore.R, N: g22.mailBefore.N, lean: g22.mailBefore.lean, leanN: g22.mailBefore.leanN };
  const curve22 = [];
  g22.days.forEach((d, i) => {
    cum22.inPerson += d.inPerson ?? 0; cum22.mail += d.mail;
    if (i < dayN) { cum22.D += d.D; cum22.R += d.R; cum22.N += d.N; cum22.lean += d.lean; cum22.leanN += d.leanN; }
    curve22.push({ day: i + 1, cumulative: cum22.inPerson + cum22.mail });
  });
  const at22 = curve22[dayN - 1].cumulative;
  const sum22 = cum22.D + cum22.R + cum22.N;

  const regTotal = [...REG.values()].reduce((a, b) => a + b, 0);
  const countyLean = (() => { let d = 0, r = 0; for (const v of Object.values(P3D)) { d += v[0]; r += v[1]; } return d / (d + r); })();
  let cum = mailBefore.all;
  const out = {
    updated: new Date().toISOString(),
    through: iso(through),
    day: dayN,
    evDays: EV_DAYS,
    lastDay: "2026-10-30",
    source: "Harris County Clerk, unofficial early voting and mail ballot rosters; official March 2022, 2024 and 2026 primary rosters; official November 2022 roster",
    totals,
    byMethod,
    matchRate: +(matched / totals.all).toFixed(4),
    universe: { D: uD, R: uR },       // March 2026 primary voters; turnout rates = totals.D26 / universe.D
    sameCycle,                        // by the March 2026 primary alone (comparable with 2022's own primary)
    lean: { earlyVote: +(lean / leanN).toFixed(4), county2024: +countyLean.toFixed(4) },
    registered2024: regTotal,
    byDay: days.map((d, i) => {
      cum += d.all;
      return { day: i + 1, date: iso(EV_START_2026 + i * DAY), ...d, cumulative: i < dayN ? cum : null };
    }),
    mailBeforeEV: mailBefore,
    compare2022: {
      label: "November 2022 midterm",
      atSameDay: at22,
      curve: curve22,
      sameCycle: { D: cum22.D, R: cum22.R, N: cum22.N, total: sum22 },
      lean: cum22.leanN ? +(cum22.lean / cum22.leanN).toFixed(4) : null,
      totalEarly: cum22.inPerson + cum22.mail,
      electionDay: g22.electionDay,
      total: g22.total,
    },
    districts: Object.fromEntries([...districts].sort().map(([k, m]) => [k, { ...m, poolD: districtPools.get(k)?.D ?? 0, poolR: districtPools.get(k)?.R ?? 0 }])),
    precincts: Object.fromEntries([...precincts].sort().map(([k, v]) => [k, [v.all, v.D, v.R, v.N, v.inPerson, v.mail, REG.get(k) ?? 0, pools.get(k)?.D ?? 0, pools.get(k)?.R ?? 0, v.D26, v.R26]])),
  };
  fs.writeFileSync(OUT, JSON.stringify(out));
  const p = (n) => (100 * n / totals.all).toFixed(1) + "%";
  console.log(`through ${out.through} (day ${dayN}): ${totals.all.toLocaleString()} voters (${totals.inPerson.toLocaleString()} in person, ${totals.mail.toLocaleString()} mail)`);
  console.log(`  primary history: D ${p(totals.D)}, R ${p(totals.R)}, none ${p(totals.N)}; matched ${(out.matchRate * 100).toFixed(1)}%`);
  console.log(`  2022 at day ${dayN}: ${at22.toLocaleString()}; precinct lean ${(out.lean.earlyVote * 100).toFixed(1)}% Harris vs county ${(countyLean * 100).toFixed(1)}%`);
}

await build();
