/**
 * Stream rows out of a large .xlsx without loading it: the county's voter
 * rosters run to ~800 MB of sheet XML. Uses the system `unzip -p` to stream the
 * sheet and parses one <row> at a time. Handles inline strings (t="str" /
 * t="inlineStr") and the shared-string table (t="s").
 *
 *   for await (const row of xlsxRows(file)) row   // { Header: value, ... }
 */
import { spawn, execFileSync } from "node:child_process";

const unescape = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
const colIndex = (letters) => { let n = 0; for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };

function sheetNames(file) {
  const list = execFileSync("unzip", ["-Z1", file], { encoding: "utf8", maxBuffer: 1 << 26 }).split("\n");
  return { sheets: list.filter(l => /^xl\/worksheets\/sheet\d+\.xml$/.test(l)).sort(), shared: list.includes("xl/sharedStrings.xml") };
}

async function* streamTag(file, entry, tag) {
  const p = spawn("unzip", ["-p", file, entry], { stdio: ["ignore", "pipe", "inherit"] });
  p.stdout.setEncoding("utf8");
  const close = `</${tag}>`;
  let buf = "";
  for await (const chunk of p.stdout) {
    buf += chunk;
    let end;
    let start = 0;
    while ((end = buf.indexOf(close, start)) >= 0) {
      const open = buf.lastIndexOf(`<${tag}`, end);
      yield buf.slice(open, end + close.length);
      start = end + close.length;
    }
    buf = buf.slice(start);
  }
}

async function loadShared(file) {
  const out = [];
  for await (const si of streamTag(file, "xl/sharedStrings.xml", "si")) {
    let s = "";
    for (const m of si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) s += m[1];
    out.push(unescape(s));
  }
  return out;
}

export async function* xlsxRows(file, { sheet } = {}) {
  const { sheets, shared } = sheetNames(file);
  const strings = shared ? await loadShared(file) : [];
  for (const entry of sheet ? [sheet] : sheets) {
    let header = null;
    for await (const row of streamTag(file, entry, "row")) {
      const vals = [];
      for (const m of row.matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const [, col, attrs, inner = ""] = m;
        let v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? /<t[^>]*>([\s\S]*?)<\/t>/.exec(inner)?.[1] ?? "";
        if (/t="s"/.test(attrs)) v = strings[+v] ?? "";
        else v = unescape(v);
        vals[colIndex(col)] = v;
      }
      if (!header) { header = vals.map(v => (v ?? "").trim()); continue; }
      const obj = {};
      header.forEach((h, i) => { if (h) obj[h] = vals[i] ?? ""; });
      yield obj;
    }
  }
}
