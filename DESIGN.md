# Design

## Color

### Palette

| Token | Value | Role |
|---|---|---|
| `--accent` | `#1a3a5c` | Navy — primary brand color, hero backgrounds, CTAs |
| `--accent-light` | `#2563a8` | Sky blue — hover states, secondary accents |
| `--background` | `#f5f3ef` | Cream — page background |
| `--surface` | `#fdfbf7` | Ivory — card backgrounds |
| `--border` | `#e5e2db` | Warm gray — card borders, dividers |
| `--muted` | `#6b6860` | Warm gray — secondary text, labels |
| Sky-300 | `#7dd3fc` | Hero eyebrow text on navy backgrounds |

### Usage rules

- Hero sections: `#1a3a5c` background with `radial-gradient(ellipse 70% 80% at 80% 50%, rgba(37,99,168,0.4), transparent)` overlay.
- Body text on cream must hit ≥ 4.5:1 contrast. Never use generic light gray — use `--muted` at minimum.
- Party colors in data: Democrats `#1a2744` (navy), Republicans `#5c1414` (crimson). Never cartoon primary red/blue.

## Typography

### Font stack

| Font | Role | Weight |
|---|---|---|
| **Outfit** | Body, UI, labels | 300–700 |
| **Playfair Display** | Section headings, hero h1, data callouts | 400–700 (italic for labels) |
| **Dancing Script** | Footer signature "Built With Wood" only | 700 |

### Scale in use

- Hero h1: `text-3xl md:text-4xl font-bold` in Playfair Display
- Section eyebrows: `text-[11px] font-bold uppercase tracking-[0.25em]` in Outfit, sky-300/80 on navy
- Body: `text-sm` (14px) in Outfit, line-height 1.6
- Data labels: `text-[9px]–text-xs font-bold uppercase tracking-widest` in Outfit
- Mono values (cash, counts): DM Mono / IBM Plex Mono

### Rules

- No Inter. Ever. Outfit is the default sans.
- No emoji anywhere in Next.js pages.
- Section labels use a full-width rule component (`SectionLabel` in `page.tsx`).

## Components

### Cards — Double-bezel architecture

Every card uses a two-ring system:
1. Outer shell: `ring-1 ring-[var(--border)]` or `border border-[var(--border)]`, `rounded-xl`
2. Inner core: `shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]` or `shadow-sm`

Never a single flat card with one border. The inner inset shadow creates depth without elevation.

### Navigation

- **Homepage**: floating pill nav, scroll-aware (transparent → solid on scroll)
- **Tool pages** (`/tools/*`, `/contact`, `/blogs`, `/politicians`): slim static breadcrumb bar, `← Toolbox` link
- iFrame tools get the slim static nav from the parent Next.js layout

### Hero sections (tool pages)

```
bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden
  └── radial gradient overlay (pointer-events-none, absolute inset-0)
  └── max-w-6xl mx-auto relative z-10
        └── sky-300/80 eyebrow (text-[11px] font-bold uppercase tracking-[0.25em] mb-3)
        └── Playfair Display h1 (text-3xl md:text-4xl font-bold)
        └── white/70 description (text-sm max-w-xl)
        └── ShareButton (mt-4, pill style)
        └── optional stat chips (bg-white/10 ring-1 ring-white/20 rounded-2xl px-5 py-3)
```

### Section spacing

- Between major sections on homepage: `py-28 md:py-40`
- No 3-equal-column grids. Use asymmetric layouts or 2-col with weight.

## Motion

- All transitions: `transition-all duration-200` minimum; prefer `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out) for interactive state changes.
- No bounce easing (`cubic-bezier(0.68, -0.55, 0.265, 1.55)` or similar). Ever.
- Scroll reveals: `ScrollReveal` component in `components/ScrollReveal.tsx` — IntersectionObserver fade-up with stagger.
- `fadeUp` keyframes defined in `globals.css`. Use `animate-fadeUp` + stagger utilities.

## Layout

- Max content width: `max-w-6xl mx-auto`
- Page padding: `px-4 md:px-6`
- Avoid 3-equal-column grids — they read as template work. Use 2-col with intentional asymmetry, or dense single-column with strong hierarchy.

## Globals

`app/globals.css`:
- `font-smooth: antialiased` on html
- `line-height: 1.6` on body
- Selection color: navy/cream
- `fadeUp` keyframes + stagger delay utilities (`.stagger-1` through `.stagger-5`)
