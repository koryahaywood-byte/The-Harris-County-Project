"use client";

// Embed showcase: live previews + copy-paste iframe snippets. Distribution
// strategy: partner blogs and dashboards carry our widgets, credited and
// linked, always showing current data.

import { useMemo, useState } from "react";
import { MATCHUPS_2026 } from "@/lib/matchups-2026";
import { SITE_URL } from "@/lib/site";
import RelatedTools from "@/components/RelatedTools";

function Snippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="rounded-xl p-3 text-[11px] leading-relaxed overflow-x-auto"
        style={{ background: "#0f2338", color: "#a5d8ff" }}>
        {code}
      </pre>
      <button
        onClick={() => { navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
        className="absolute top-2 right-2 rounded-full px-3 py-1 text-[10px] font-bold bg-white/90 hover:bg-white transition"
        style={{ color: "var(--accent)" }}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function EmbedsClient() {
  const featured = ["CD-7", "US-Senate", "HC-Countywide"];
  const raceKeys = useMemo(() => Object.keys(MATCHUPS_2026).sort(), []);
  const [raceKey, setRaceKey] = useState("CD-7");

  const countdownCode = `<iframe src="${SITE_URL}/embed/countdown" width="320" height="130" style="border:0;border-radius:16px" title="Harris County election countdown"></iframe>`;
  const raceCode = `<iframe src="${SITE_URL}/embed/race/${raceKey}" width="360" height="180" style="border:0;border-radius:16px" title="${MATCHUPS_2026[raceKey]?.office ?? "Race card"}"></iframe>`;

  return (
    <div>
      <section className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden topo-dark">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-3xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">For bloggers, newsrooms, and organizers</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Put our data on your site.
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-xl">
            One iframe tag. No account, no key, no cost. The widgets stay current
            automatically and credit back here. If you run a Harris County politics
            blog or a campaign dashboard, these are for you.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-12">
        <section>
          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
            Election countdown
          </h2>
          <p className="text-[12px] mb-4" style={{ color: "#8a8578" }}>
            Days until the next Harris County election day, from our civic calendar.
          </p>
          <div className="flex flex-col md:flex-row gap-5 md:items-start">
            <iframe src="/embed/countdown" width="320" height="130" style={{ border: 0, borderRadius: 16 }} title="Election countdown preview" />
            <div className="flex-1 min-w-0"><Snippet code={countdownCode} /></div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
            Race card
          </h2>
          <p className="text-[12px] mb-4" style={{ color: "#8a8578" }}>
            Any of the {raceKeys.length} races we track: nominees, incumbency, cash on hand, and our rating.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {featured.map(k => (
              <button key={k} onClick={() => setRaceKey(k)}
                className="rounded-full px-3 py-1 text-[11px] font-bold transition"
                style={raceKey === k
                  ? { background: "var(--accent)", color: "white" }
                  : { background: "#eef2f7", color: "var(--accent)" }}>
                {MATCHUPS_2026[k].office}
              </button>
            ))}
            <select value={raceKey} onChange={e => setRaceKey(e.target.value)}
              className="rounded-full px-3 py-1 text-[11px] font-semibold border"
              style={{ borderColor: "#d6d3cb", color: "var(--accent)", background: "white" }}
              aria-label="Choose a race">
              {raceKeys.map(k => <option key={k} value={k}>{k} · {MATCHUPS_2026[k].office}</option>)}
            </select>
          </div>
          <div className="flex flex-col md:flex-row gap-5 md:items-start">
            <iframe key={raceKey} src={`/embed/race/${raceKey}`} width="360" height="180" style={{ border: 0, borderRadius: 16 }} title="Race card preview" />
            <div className="flex-1 min-w-0"><Snippet code={raceCode} /></div>
          </div>
        </section>

        <p className="text-[11px] leading-relaxed" style={{ color: "#9ca3af" }}>
          Widgets refresh hourly. Data and ratings are ours; sourcing is on the{" "}
          <a href="/methodology" className="underline">methodology page</a>. If you embed these
          somewhere fun, <a href="/contact" className="underline">tell us</a>.
        </p>

        <RelatedTools current="/tools/embeds" />
      </div>
    </div>
  );
}
