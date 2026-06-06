"use client";
import { useState } from "react";
import Link from "next/link";

/* ─── Harris County Congressional delegation ─────────────────────────────────── */
const REPS = [
  { name: "Sylvester Turner",    district: "CD-18", party: "D", note: "Houston Mayor→Congress",       photo: "https://turner.house.gov/sites/evo-subsites/turner.house.gov/files/evo-media-image/turner-official-photo.jpg" },
  { name: "Al Green",           district: "CD-9",  party: "D", note: "Civil rights veteran",          photo: "https://algreen.house.gov/sites/evo-subsites/algreen.house.gov/files/evo-media-image/al-green-official-photo.jpg" },
  { name: "Lizzie Fletcher",    district: "CD-7",  party: "D", note: "Energy & Commerce Committee",  photo: "https://fletcher.house.gov/sites/evo-subsites/fletcher.house.gov/files/evo-media-image/fletcher-official-photo.jpg" },
  { name: "Sylvia Garcia",      district: "CD-29", party: "D", note: "House Judiciary Committee",    photo: "https://sylviagarcia.house.gov/sites/evo-subsites/sylviagarcia.house.gov/files/evo-media-image/garcia-official-photo.jpg" },
  { name: "Dan Crenshaw",       district: "CD-2",  party: "R", note: "House Armed Services",         photo: "https://crenshaw.house.gov/sites/evo-subsites/crenshaw.house.gov/files/evo-media-image/crenshaw-official-photo.jpg" },
  { name: "Michael McCaul",     district: "CD-10", party: "R", note: "Foreign Affairs Chair",        photo: "https://mccaul.house.gov/sites/evo-subsites/mccaul.house.gov/files/evo-media-image/mccaul-official-photo.jpg" },
  { name: "Randy Weber",        district: "CD-14", party: "R", note: "Science, Space & Technology",  photo: "https://weber.house.gov/sites/evo-subsites/weber.house.gov/files/evo-media-image/weber-official-photo.jpg" },
  { name: "Pete Olson",         district: "CD-22", party: "R", note: "Energy & Commerce",            photo: "https://olson.house.gov/sites/evo-subsites/olson.house.gov/files/evo-media-image/olson-official-photo.jpg" },
];

const CONGRESS = { name: "119th Congress", status: "In Session", term: "Jan 2025 – Jan 2027" };

const TRACKS = [
  { label: "Floor Votes",          desc: "Every vote cast by Harris County's US delegation — party-line, bipartisan, and notable splits.", color: "#991b1b" },
  { label: "Committee Work",       desc: "Hearings, markups, and chair positions. McCaul (Foreign Affairs), Fletcher (Energy & Commerce) tracked closely.", color: "#b91c1c" },
  { label: "Federal Funding",      desc: "FEMA disaster relief, Port of Houston grants, HUD housing dollars, and TxDOT highway money flowing to Harris County.", color: "#0891b2" },
  { label: "Campaign Finance",     desc: "FEC filings for all 8 reps — donors, PAC money, and spending compared to district lean.", color: "#b45309" },
];

interface SocialPost { platform: "Threads"|"Facebook"|"Twitter/X"; author: string; handle: string; content: string; url: string; time: string; }
const SOCIAL: SocialPost[] = [
  { platform: "Twitter/X", author: "Houston Chronicle",  handle: "@HoustonChron",    content: "Houston's congressional delegation split on the latest federal budget deal. Green, Garcia, Fletcher voted yes. Crenshaw, McCaul voted no. Full breakdown in our story.", url: "https://twitter.com/HoustonChron",      time: "2h ago" },
  { platform: "Twitter/X", author: "Robert Downen",      handle: "@RobDownenChron",  content: "FEMA finally approved the supplemental disaster relief for Harris County — $800M heading our way. Bipartisan push from Turner and Crenshaw made it happen.",              url: "https://twitter.com/RobDownenChron",    time: "4h ago" },
  { platform: "Threads",   author: "Texas Tribune",      handle: "@texastribune",    content: "McCaul's Foreign Affairs hearing on the Mexico border drew sharp questions about Harris County's role as a major port of entry. Full transcript available.",                url: "https://www.threads.net/@texastribune", time: "5h ago" },
  { platform: "Threads",   author: "Houston Landing",    handle: "@houstonlanding",  content: "Lizzie Fletcher secured $45M in federal transit funding for the Westpark Tollway expansion in today's Transportation appropriations markup. Quiet win, big impact.",           url: "https://www.threads.net/@houstonlanding", time: "7h ago" },
  { platform: "Twitter/X", author: "Dan Crenshaw",       handle: "@DanCrenshawTX",   content: "Voted against the spending bill today. $2T in new debt our kids will pay for. I won't sign off on fiscal irresponsibility no matter which party brings it.",              url: "https://twitter.com/DanCrenshawTX",     time: "8h ago" },
  { platform: "Facebook",  author: "Houston Dems",       handle: "fb/houstondems",   content: "Al Green's floor speech on the Voting Rights Act today was powerful. 30+ years fighting for Houston — and the fight isn't over. Full video in our stories.",               url: "https://www.facebook.com/groups/search/results/?q=houston+democrats", time: "1d ago" },
  { platform: "Facebook",  author: "Harris County GOP",  handle: "fb/harriscountygop",content: "Dan Crenshaw's amendment to cut EPA red tape from Port of Houston expansion passed committee 22-15. Real relief for Houston's energy economy coming.",                      url: "https://www.facebook.com/groups/search/results/?q=harris+county+republican", time: "1d ago" },
];

const PAL: Record<string, { bg: string; text: string; border: string }> = {
  "Threads":   { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  "Facebook":  { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  "Twitter/X": { bg: "#f8fafc", text: "#374151", border: "#e2e8f0" },
};

function PlatformIcon({ p }: { p: SocialPost["platform"] }) {
  if (p === "Threads")   return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068V12c0-3.514.85-6.37 2.495-8.483C5.841 1.218 8.589.024 12.175 0h.014c2.312.013 4.296.634 5.896 1.845 1.577 1.189 2.666 2.908 3.237 5.109l-2.002.595c-.448-1.74-1.278-3.109-2.469-4.068-1.178-.946-2.715-1.437-4.658-1.447-2.89.019-5.04.943-6.581 2.819C4.071 6.793 3.456 9.186 3.456 12v.068c0 2.825.615 5.211 1.829 7.093 1.54 1.86 3.691 2.784 6.587 2.803 2.327-.015 4.068-.635 5.325-1.895.973-.971 1.603-2.371 1.873-4.16a7.454 7.454 0 0 0-1.562-.166c-3.018 0-4.699-1.567-4.699-4.296 0-2.681 1.77-4.388 4.508-4.388 2.891 0 4.577 1.786 4.577 4.771 0 .413-.04.82-.12 1.207A7.04 7.04 0 0 1 20 16.5c-1.084 1.084-2.703 1.665-4.682 1.665-1.055 0-2.036-.182-2.908-.54a5.293 5.293 0 0 1-.224 2.375zm5.35-9.607c.026-.238.04-.48.04-.725 0-1.869-.829-2.807-2.535-2.807-1.627 0-2.51.924-2.51 2.6 0 1.726.864 2.532 2.7 2.532.546 0 1.063-.081 1.538-.234a4.756 4.756 0 0 0 .767-1.366z"/></svg>;
  if (p === "Facebook")  return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
}

export default function CongressBeatPage() {
  const [tab, setTab] = useState<"overview"|"social">("overview");

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: 280 }}>
        <img src="https://images.unsplash.com/photo-1503198515498-d0bd9ed16902?auto=format&fit=crop&w=1400&q=80"
          alt="US Capitol" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.35 }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#7f1d1d 0%,#991b1b 55%,#b91c1c 100%)", opacity: 0.78 }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 80% at 80% 50%,rgba(220,38,38,0.2),transparent)" }} />
        <div className="relative max-w-5xl mx-auto px-5 pt-10 pb-0">
          <p className="text-red-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-3">The Beat · Washington D.C.</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair), serif", lineHeight: 1.15 }}>
            Congressional Beat
          </h1>
          <p className="text-white/55 text-sm max-w-md mb-6">
            Harris County in Washington — 8 representatives, every vote, every dollar, every hearing.
          </p>

          {/* Congress info */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { label: "Congress",  value: CONGRESS.name },
              { label: "Status",    value: CONGRESS.status },
              { label: "Term",      value: CONGRESS.term },
              { label: "HC Reps",   value: "8 Members" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40 mb-0.5">{label}</p>
                <p className="text-xs font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {([["overview","The Delegation"],["social","Voices on Social"]] as const).map(([k,l]) => (
              <button key={k} onClick={() => setTab(k)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] rounded-t-lg transition-all cursor-pointer"
                style={tab === k ? { background: "rgba(245,243,239,1)", color: "var(--accent)" } : { color: "rgba(255,255,255,0.5)" }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-8">

        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-4">Harris County Delegation — 119th Congress</p>

              {/* Party split bar */}
              <div className="rounded-2xl bg-white ring-1 ring-black/7 p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Party Split</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden gap-px">
                  <div className="flex-1 bg-blue-500 rounded-l-full" style={{ flex: 4 }} />
                  <div className="flex-1 bg-red-500 rounded-r-full" style={{ flex: 4 }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] font-bold text-blue-600">4 Democrats</span>
                  <span className="text-[10px] font-bold text-red-600">4 Republicans</span>
                </div>
              </div>

              {/* Rep cards — 2 col grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                {REPS.map(r => (
                  <div key={r.district} className="flex items-center gap-3 rounded-2xl bg-white ring-1 ring-black/7 p-3.5">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                      style={{ outline: `2px solid ${r.party === "D" ? "#1d4ed8" : "#dc2626"}`, outlineOffset: "2px" }}>
                      <img src={r.photo} alt={r.name} className="w-full h-full object-cover object-top"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[var(--accent)] leading-tight truncate" style={{ fontFamily: "var(--font-playfair), serif" }}>{r.name}</p>
                      <p className="text-[9px] text-[var(--muted)]">{r.district} · {r.note}</p>
                    </div>
                    <span className={`ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${r.party === "D" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                      {r.party}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tracks */}
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-4">Coverage Pipeline</p>
              <div className="space-y-3">
                {TRACKS.map(t => (
                  <div key={t.label} className="rounded-2xl bg-white ring-1 ring-black/7 p-4 flex gap-4">
                    <div className="w-1 rounded-full flex-shrink-0" style={{ background: t.color, minHeight: 40 }} />
                    <div>
                      <p className="font-bold text-sm text-[var(--accent)] mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>{t.label}</p>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="rounded-[1.5rem] bg-white ring-1 ring-black/7 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-3">Related Tools</p>
                <div className="space-y-2">
                  {[
                    { label: "Congress Bills", href: "/tools/congressional-bills", desc: "Bills Harris County reps signed into law" },
                    { label: "Where the Money Resides", href: "/tools/where-is-the-dough", desc: "FEC filings for all reps" },
                    { label: "Politicians", href: "/politicians", desc: "Full profiles with OVR ratings" },
                  ].map(l => (
                    <Link key={l.href} href={l.href}
                      className="block rounded-xl p-3 hover:bg-[var(--accent)]/5 transition-colors group">
                      <p className="text-xs font-bold text-[var(--accent)] group-hover:text-[var(--accent-light)]">{l.label}</p>
                      <p className="text-[10px] text-[var(--muted)]">{l.desc}</p>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.5rem] p-5 text-center" style={{ background: "linear-gradient(135deg,#991b1b,#dc2626)" }}>
                <p className="text-xs font-bold text-white mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>Live Vote Tracking</p>
                <p className="text-[10px] text-white/60 mb-3">Real-time floor vote tracking for all 8 Harris County reps — in development.</p>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-red-200">
                  <span className="relative flex h-2 w-2"><span className="alive-halo absolute inline-flex h-full w-full rounded-full bg-red-300" /><span className="alive-pulse relative inline-flex h-2 w-2 rounded-full bg-red-300" /></span>
                  In Development
                </span>
              </div>
            </div>
          </div>
        )}

        {tab === "social" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Threads & Twitter/X</span>
              </div>
              <div className="space-y-3">
                {SOCIAL.filter(p => p.platform !== "Facebook").map((post, i) => {
                  const pal = PAL[post.platform];
                  return (
                    <a key={i} href={post.url} target="_blank" rel="noopener noreferrer"
                      className="block rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      style={{ background: pal.bg, border: `1px solid ${pal.border}` }}>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span style={{ color: pal.text }}><PlatformIcon p={post.platform} /></span>
                            <div>
                              <p className="text-xs font-bold leading-none" style={{ color: "#1a3a5c" }}>{post.author}</p>
                              <p className="text-[9px] mt-0.5" style={{ color: pal.text }}>{post.handle}</p>
                            </div>
                          </div>
                          <span className="text-[9px]" style={{ color: "#9ca3af" }}>{post.time}</span>
                        </div>
                        <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "#374151" }}>{post.content}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Facebook Groups</span>
              </div>
              <div className="space-y-3">
                {SOCIAL.filter(p => p.platform === "Facebook").map((post, i) => {
                  const pal = PAL[post.platform];
                  return (
                    <a key={i} href={post.url} target="_blank" rel="noopener noreferrer"
                      className="block rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      style={{ background: pal.bg, border: `1px solid ${pal.border}` }}>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span style={{ color: pal.text }}><PlatformIcon p={post.platform} /></span>
                            <div>
                              <p className="text-xs font-bold leading-none" style={{ color: "#1a3a5c" }}>{post.author}</p>
                              <p className="text-[9px] mt-0.5" style={{ color: pal.text }}>{post.handle}</p>
                            </div>
                          </div>
                          <span className="text-[9px]" style={{ color: "#9ca3af" }}>{post.time}</span>
                        </div>
                        <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "#374151" }}>{post.content}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
              <div className="mt-5 rounded-2xl p-4 ring-1 ring-black/7" style={{ background: "#f8fafc" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] mb-2">Find more</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Twitter/X", q: "#houston congress",  url: "https://twitter.com/search?q=houston+congress" },
                    { label: "Threads",   q: "#houston",           url: "https://www.threads.net/search?q=houston+politics" },
                    { label: "Facebook",  q: "Houston Democrats",  url: "https://www.facebook.com/groups/search/results/?q=houston+democrats" },
                    { label: "Facebook",  q: "Houston Republicans",url: "https://www.facebook.com/groups/search/results/?q=houston+republicans" },
                  ].map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[11px] hover:underline" style={{ color: "#2563a8" }}>
                      <span className="text-[9px] font-bold uppercase tracking-wide w-14 shrink-0" style={{ color: "#9ca3af" }}>{item.label}</span>
                      <span className="font-medium">{item.q}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
