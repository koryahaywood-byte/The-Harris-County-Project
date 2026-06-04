"use client";
import Link from "next/link";
import { POLITICIANS } from "@/lib/politicians";

export default function PoliticiansIndex() {
  const chambers = ["Senate", "House", "County", "City", "HISD"] as const;

  return (
    <div>
      <div className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Politician Profiles</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Your Elected Officials
          </h1>
          <p className="text-white/70 text-sm max-w-xl">
            Money, bills, salary, district, and more — for every Harris County elected official.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {chambers.map(chamber => {
          const group = POLITICIANS.filter(p => p.chamber === chamber);
          if (!group.length) return null;
          return (
            <div key={chamber} className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="block w-6 h-px bg-[var(--muted)]/40" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">{chamber}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.map(p => (
                  <Link key={p.slug} href={`/politicians/${p.slug}`}
                    className="group rounded-[1.5rem] bg-white/60 ring-1 ring-black/8 p-[5px] transition-all duration-500 hover:shadow-lg hover:ring-[var(--accent-light)]">
                    <div className="rounded-[1.15rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] p-5 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                        {p.photo
                          ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover object-top" onError={(e) => { const t = e.target as HTMLImageElement; t.style.display="none"; }} />
                          : <span>{p.name.split(" ").map(n => n[0]).slice(0,2).join("")}</span>
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[var(--accent)] text-sm truncate group-hover:text-[var(--accent-light)] transition-colors" style={{ fontFamily: "var(--font-playfair), serif" }}>
                          {p.name}
                        </div>
                        <div className="text-xs text-[var(--muted)] mt-0.5">{p.office}</div>
                        <div className="flex gap-2 mt-1">
                          <span className={`text-[10px] font-bold ${p.party === "D" ? "text-blue-700" : p.party === "R" ? "text-red-700" : "text-gray-500"}`}>{p.party === "D" ? "Democrat" : p.party === "R" ? "Republican" : p.party}</span>
                          <span className="text-[10px] text-[var(--muted)]">{p.district}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
