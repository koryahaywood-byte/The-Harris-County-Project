// HEAD-checks every politician photo URL in lib/politicians.ts and prints failures.
// Photos live on many external hosts (county sites, campaign CDNs, news outlets);
// any can vanish without notice. Run before deploys: npm run check-photos
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = readFileSync(path.join(root, "lib/politicians.ts"), "utf8");

// Parse per-entry so a photo-less politician can't pair with a neighbor's URL.
const entries = [];
for (const block of src.split(/\n  \{/).slice(1)) {
  const slug = block.match(/slug: "([^"]+)"/)?.[1];
  const url = block.match(/photo: "([^"]+)"/)?.[1];
  if (slug && url) entries.push({ slug, url });
}

console.log(`Checking ${entries.length} photo URLs…`);

const results = await Promise.allSettled(
  entries.map(async ({ slug, url }) => {
    // Relative paths are local assets under public/ — check the file, not the network.
    if (url.startsWith("/")) {
      const ok = existsSync(path.join(root, "public", url.slice(1)));
      return { slug, url, ok, status: ok ? 200 : "missing-file" };
    }
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10000), redirect: "follow" });
    // Some CDNs reject HEAD; retry those with a ranged GET before calling it broken.
    if (!res.ok && (res.status === 405 || res.status === 403)) {
      const get = await fetch(url, { headers: { Range: "bytes=0-0" }, signal: AbortSignal.timeout(10000) });
      if (get.ok || get.status === 206) return { slug, url, ok: true };
    }
    return { slug, url, ok: res.ok, status: res.status };
  })
);

let failures = 0;
for (const r of results) {
  if (r.status === "rejected") { failures++; console.log(`FAIL (network) ${r.reason?.message ?? r.reason}`); continue; }
  if (!r.value.ok) { failures++; console.log(`FAIL ${r.value.status ?? "?"} ${r.value.slug} → ${r.value.url}`); }
}

if (failures === 0) console.log("All photo URLs healthy.");
else { console.log(`\n${failures} broken photo URL(s). Components fall back to initials, but replace these.`); process.exitCode = 1; }
