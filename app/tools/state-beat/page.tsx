"use client";
import { useState } from "react";
import Link from "next/link";

/* ─── Harris County TX delegation ───────────────────────────────────────────── */
const SENATORS = [
  { name: "Carol Alvarado",   district: "SD-6",  party: "D", slug: "carol-alvarado",   photo: "https://senate.texas.gov/members/d06/img/CA-2018_web.jpg" },
  { name: "Borris Miles",     district: "SD-13", party: "D", slug: "borris-miles",     photo: "https://senate.texas.gov/members/d13/img/Sen-Miles-2025-Headshot-web.jpg" },
  { name: "Joan Huffman",     district: "SD-17", party: "R", slug: "joan-huffman",     photo: "https://senate.texas.gov/members/d17/img/headshot.jpg" },
  { name: "Paul Bettencourt", district: "SD-7",  party: "R", slug: "paul-bettencourt", photo: "https://senate.texas.gov/members/d07/img/headshot.jpg" },
];

const SESSION = {
  name: "89th Texas Legislature",
  status: "Adjourned",
  start: "Jan 14, 2025",
  end: "Jun 2, 2025",
  bills_filed: "8,400+",
  laws_passed: "~1,200",
  next: "90th Legislature · Jan 2027",
};

const TRACKS = [
  { label: "Floor Votes",         desc: "Every vote by Harris County reps — sorted by party-line splits and bipartisan wins.", color: "#4c1d95" },
  { label: "Committee Hearings",  desc: "Key hearings tracked with AI summary and bill status. Lobbyist filings cross-referenced.", color: "#7c3aed" },
  { label: "Property Tax & Schools", desc: "HB 2, SB 4, and school finance bills directly impacting Harris County homeowners.", color: "#0891b2" },
  { label: "Lobbyist Map",        desc: "Who is paying whom to lobby in Austin on Harris County-related issues.", color: "#b45309" },
];

interface SocialPost { platform: "Threads"|"Facebook"|"Twitter/X"; author: string; handle: string; content: string; url: string; time: string; }
const SOCIAL: SocialPost[] = [
  { platform: "Twitter/X", author: "Texas Tribune",     handle: "@texastribune",    content: "Final day of the 89th Legislature: Here's everything that passed, failed, or got left on the table — with a Harris County filter. Big thread.",                        url: "https://twitter.com/TexasTribune",       time: "2h ago" },
  { platform: "Twitter/X", author: "Jeremy Wallace",    handle: "@JeremySWallace",  content: "#txlege: Harris County delegation split on property tax bill final passage. Alvarado, Miles voted no. Bettencourt, Huffman yes. Bill goes to governor.",              url: "https://twitter.com/JeremySWallace",     time: "4h ago" },
  { platform: "Threads",   author: "Texas Tribune",     handle: "@texastribune",    content: "The school voucher bill is heading to the governor's desk. Every Harris County Senate Democrat voted against it. What it means for HISD — our explainer is live.", url: "https://www.threads.net/@texastribune",   time: "5h ago" },
  { platform: "Threads",   author: "Texas Signal",      handle: "@texassignal",     content: "#txlege wrap: Session ended with property tax relief smaller than promised. Harris County homeowners will see relief — but far less than what was advertised in January.", url: "https://www.threads.net/@texassignal",    time: "6h ago" },
  { platform: "Twitter/X", author: "Robert Downen",     handle: "@RobDownenChron",  content: "My read on what the 89th Legislature actually delivered for Houston: a mixed bag. Flood relief funded. School choice passed. Harris County home rule: blocked again.", url: "https://twitter.com/RobDownenChron",      time: "8h ago" },
  { platform: "Facebook",  author: "Texas Dems",        handle: "fb/txdemocrats",   content: "89th Legislature adjourned. Democrats fought hard on every front — property taxes, public education, and voting rights. The fight continues in 2026.",                  url: "https://www.facebook.com/groups/search/results/?q=texas+democrats", time: "1d ago" },
  { platform: "Facebook",  author: "Texas GOP",         handle: "fb/texasgop",      content: "The 89th Legislature delivered: property tax relief, school choice, and border security. A historic session for Texas conservatives. Full recap on txgop.org",            url: "https://www.facebook.com/groups/search/results/?q=texas+republican", time: "1d ago" },
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

export default function StateBeatPage() {
  const [tab, setTab] = useState<"overview"|"social">("overview");

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: 280 }}>
        <img src="https://images.unsplash.com/photo-1531218150217-54595bc2b934?auto=format&fit=crop&w=1400&q=80"
          alt="Texas State Capitol" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.35 }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#3b0764 0%,#4c1d95 55%,#5b21b6 100%)", opacity: 0.78 }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 80% at 80% 50%,rgba(124,58,237,0.25),transparent)" }} />
        <div className="relative max-w-5xl mx-auto px-5 pt-10 pb-0">
          <p className="text-violet-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-3">The Beat · Austin</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair), serif", lineHeight: 1.15 }}>
            State House Beat
          </h1>
          <p className="text-white/55 text-sm max-w-md mb-6">
            The Texas Legislature through a Harris County lens — bills, votes, hearings, and who's lobbying whom.
          </p>

          {/* Session status */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { label: "Session", value: SESSION.name },
              { label: "Status",  value: SESSION.status },
              { label: "Bills Filed", value: SESSION.bills_filed },
              { label: "Laws Passed", value: SESSION.laws_passed },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40 mb-0.5">{label}</p>
                <p className="text-xs font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {([["overview","What We Track"],["social","Voices on Social"]] as const).map(([k,l]) => (
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
              {/* Senate delegation */}
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-4">Harris County Senate Delegation</p>
              <div className="flex flex-col gap-3 mb-8">
                {SENATORS.map(s => (
                  <Link key={s.slug} href={`/politicians/${s.slug}`}
                    className="flex items-center gap-4 rounded-2xl bg-white ring-1 ring-black/7 p-4 hover:shadow-md transition-all cursor-pointer group">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                      style={{ outline: `2px solid ${s.party === "D" ? "#1d4ed8" : "#dc2626"}`, outlineOffset: "2px" }}>
                      <img src={s.photo} alt={s.name} className="w-full h-full object-cover object-top"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[var(--accent)] group-hover:text-[var(--accent-light)] transition-colors"
                        style={{ fontFamily: "var(--font-playfair), serif" }}>{s.name}</p>
                      <p className="text-[11px] text-[var(--muted)]">State Senator · {s.district}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.party === "D" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                      {s.party === "D" ? "Dem" : "Rep"}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Hashtag banner */}
              <div className="rounded-2xl p-5 mb-8 flex items-center gap-4" style={{ background: "linear-gradient(135deg,#4c1d95,#7c3aed)" }}>
                <div className="text-4xl font-black text-white/20" style={{ fontFamily: "var(--font-playfair), serif" }}>#</div>
                <div>
                  <p className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-playfair), serif" }}>#txlege</p>
                  <p className="text-white/60 text-xs">The main hashtag on X/Threads for Texas Legislature coverage. Follow it for live floor updates.</p>
                </div>
                <a href="https://twitter.com/search?q=%23txlege" target="_blank" rel="noopener noreferrer"
                  className="ml-auto text-[10px] font-bold text-violet-200 hover:text-white transition-colors whitespace-nowrap">
                  Follow on X →
                </a>
              </div>

              {/* Coverage tracks */}
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
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-1">Next Session</p>
                <p className="text-2xl font-black text-[var(--accent)] mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>Jan 2027</p>
                <p className="text-xs text-[var(--muted)] mb-4">90th Texas Legislature</p>
                <div className="h-px bg-[var(--border)] mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-3">Related Tools</p>
                <div className="space-y-2">
                  {[
                    { label: "Bill Tracker", href: "/tools/bill-tracker" },
                    { label: "Congress Bills", href: "/tools/congressional-bills" },
                    { label: "Politicians", href: "/politicians" },
                  ].map(l => (
                    <Link key={l.href} href={l.href}
                      className="block rounded-xl px-3 py-2 text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors">
                      {l.label} →
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.5rem] p-5 text-center" style={{ background: "linear-gradient(135deg,#4c1d95,#7c3aed)" }}>
                <p className="text-xs font-bold text-white mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>Live Bill Tracking</p>
                <p className="text-[10px] text-white/60 mb-3">Vote-by-vote coverage of the 90th Legislature — launches January 2027.</p>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-violet-300">
                  <span className="relative flex h-2 w-2"><span className="alive-halo absolute inline-flex h-full w-full rounded-full bg-violet-400" /><span className="alive-pulse relative inline-flex h-2 w-2 rounded-full bg-violet-400" /></span>
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
                    { label: "Twitter/X", q: "#txlege",        url: "https://twitter.com/search?q=%23txlege" },
                    { label: "Threads",   q: "#txlege",        url: "https://www.threads.net/search?q=txlege" },
                    { label: "Facebook",  q: "Texas Politics", url: "https://www.facebook.com/groups/search/results/?q=texas+politics" },
                    { label: "Facebook",  q: "Texas Democrats",url: "https://www.facebook.com/groups/search/results/?q=texas+democrats" },
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
