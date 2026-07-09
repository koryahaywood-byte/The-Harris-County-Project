"use client";

// Your Tax Receipt: home value → the property tax bill, line by line, at the
// adopted 2025 rates. Rates are per $100 of taxable value, from the Harris
// County Tax Office Truth-in-Taxation summary (county entities) and the
// adopted 2025 rates published by HISD and the City of Houston.
//
// Exemption model (kept deliberately simple, disclosed in the footer):
// - Homestead ON: 20% local-option exemption for county entities and the
//   city; schools get the $140,000 state homestead exemption (SB 4 /
//   Prop 13, approved Nov 2025) plus HISD's 20% local option.
// - Over-65, disability, and MUD/ESD levies are NOT modeled.

import { useState } from "react";
import Link from "next/link";
import RelatedTools from "@/components/RelatedTools";

interface Entity {
  name: string;
  rate: number;           // per $100 taxable value, 2025 adopted
  what: string;
  homestead20: boolean;   // grants 20% local-option homestead exemption
  school: boolean;        // gets the $140K state school exemption
  cityOnly?: boolean;     // only if inside Houston city limits
  href?: string;
}

const ENTITIES: Entity[] = [
  { name: "Houston ISD",             rate: 0.8783,  what: "Schools: teachers, buses, buildings", homestead20: true,  school: true,  href: "/tools/public-money" },
  { name: "City of Houston",         rate: 0.51919, what: "Police, fire, streets, parks, trash", homestead20: true,  school: false, cityOnly: true, href: "/tools/public-money" },
  { name: "Harris County",           rate: 0.38096, what: "Courts, jail, roads, elections",      homestead20: true,  school: false, href: "/tools/public-money" },
  { name: "Harris Health System",    rate: 0.18761, what: "Public hospitals: Ben Taub, LBJ",     homestead20: true,  school: false },
  { name: "Flood Control District",  rate: 0.04966, what: "Bayous, detention basins, buyouts",   homestead20: true,  school: false },
  { name: "Port of Houston",         rate: 0.0059,  what: "Ship channel infrastructure",         homestead20: true,  school: false },
  { name: "Dept. of Education",      rate: 0.004798, what: "HCDE: therapy, adult ed, after-school", homestead20: true, school: false },
];

const SCHOOL_STATE_EXEMPTION = 140_000;

const dollars = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function TaxReceiptClient() {
  const [valueStr, setValueStr] = useState("350000");
  const [homestead, setHomestead] = useState(true);
  const [inHouston, setInHouston] = useState(true);

  const value = Math.max(0, parseInt(valueStr.replace(/[^0-9]/g, ""), 10) || 0);

  const lines = ENTITIES
    .filter(e => inHouston || !e.cityOnly)
    .map(e => {
      let taxable = value;
      if (homestead) {
        if (e.homestead20) taxable -= value * 0.2;
        if (e.school) taxable -= SCHOOL_STATE_EXEMPTION;
      }
      taxable = Math.max(0, taxable);
      return { ...e, taxable, tax: (taxable / 100) * e.rate };
    })
    .sort((a, b) => b.tax - a.tax);

  const total = lines.reduce((s, l) => s + l.tax, 0);
  const max = Math.max(...lines.map(l => l.tax), 1);

  return (
    <div>
      {/* Hero */}
      <section className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden topo-dark">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-3xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Public Money · 2025 Adopted Rates</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Where your property tax dollar goes.
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-xl mb-8">
            Seven governments tax a Houston home. Enter a value and get the receipt,
            line by line, at the rates each one adopted for 2025.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 max-w-xl">
            <div className="relative flex-1">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                value={Number(valueStr.replace(/[^0-9]/g, "") || 0).toLocaleString()}
                onChange={e => setValueStr(e.target.value)}
                inputMode="numeric"
                className="w-full rounded-full pl-9 pr-5 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300"
                aria-label="Home appraised value"
              />
            </div>
            <label className="flex items-center gap-2 text-[12px] text-white/90 cursor-pointer">
              <input type="checkbox" checked={homestead} onChange={e => setHomestead(e.target.checked)} className="accent-sky-400" />
              Homestead exemption
            </label>
            <label className="flex items-center gap-2 text-[12px] text-white/90 cursor-pointer">
              <input type="checkbox" checked={inHouston} onChange={e => setInHouston(e.target.checked)} className="accent-sky-400" />
              Inside Houston city limits
            </label>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-baseline justify-between" style={{ background: "#f8f7f4" }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#8a8578" }}>Estimated annual bill</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
                {dollars(total)}
              </p>
            </div>
            <p className="text-[11px] text-right" style={{ color: "#8a8578" }}>
              {dollars(Math.round(total / 12))}/month<br />on a {dollars(value)} home
            </p>
          </div>
          {lines.map(l => (
            <div key={l.name} className="px-5 py-3 border-b last:border-b-0" style={{ borderColor: "#f0ede7" }}>
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="text-[13px] font-bold" style={{ color: "var(--accent)" }}>
                  {l.href ? <Link href={l.href} className="hover:underline">{l.name}</Link> : l.name}
                </span>
                <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--accent)" }}>{dollars(l.tax)}</span>
              </div>
              <div className="h-1.5 rounded-full mb-1" style={{ background: "#f0ede7" }}>
                <div className="h-1.5 rounded-full" style={{ width: `${(l.tax / max) * 100}%`, background: "var(--accent-light)" }} />
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px]" style={{ color: "#8a8578" }}>{l.what}</span>
                <span className="text-[10px] tabular-nums" style={{ color: "#9ca3af" }}>
                  ${l.rate.toFixed(4)} per $100 · taxable {dollars(l.taxable)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[11px] leading-relaxed" style={{ color: "#9ca3af" }}>
          Rates are the adopted 2025 (FY 2026) rates: county entities from the Harris County Tax
          Office Truth-in-Taxation summary at{" "}
          <a href="https://www.hctax.net/property/TaxRates.cshtml" target="_blank" rel="noopener noreferrer" className="underline">hctax.net</a>;
          HISD and City of Houston from their adopted-rate notices. Homestead model: 20% local-option
          exemption plus the $140,000 state school exemption approved by voters in November 2025.
          Not modeled: over-65 and disability exemptions, appraisal caps, and MUD or emergency-service-district
          levies, which can add 25¢ to $1+ per $100 in parts of the county. Your school district may not be
          HISD; 24 ISDs overlap Harris County. Check your actual statement at{" "}
          <a href="https://www.hctax.net" target="_blank" rel="noopener noreferrer" className="underline">hctax.net</a> and
          your appraisal at <a href="https://hcad.org" target="_blank" rel="noopener noreferrer" className="underline">HCAD</a>.
        </p>

        <RelatedTools current="/tools/tax-receipt" />
      </div>
    </div>
  );
}
