#!/usr/bin/env node
/**
 * Full-body 3D "player models" of officials, built from their official portraits.
 *
 *   portrait ──► full-body game-style render (front, plus a back view)
 *            ──► image-to-3D mesh (GLB)
 *            ──► optimized GLB in public/models/officials/<slug>.glb
 *            ──► manifest entry in lib/player-models.json
 *
 * Providers (first one with a key wins):
 *   FAL_KEY   fal.ai — nano-banana/edit (images), hunyuan3d-v3 or trellis-2 (mesh). ~$0.45 per official.
 *   HF_TOKEN  Hugging Face ZeroGPU spaces — FLUX.1 Kontext (images), TRELLIS.2 (mesh). Free, daily quota.
 *
 * Usage:
 *   env $(grep -v '^#' .env.local | xargs) node scripts/build-player-models.mjs rodney-ellis lina-hidalgo
 *   ... --all            every official with a photo and no model yet, in TIERS order
 *   ... --tier jp        only one tier (see TIERS)
 *   ... --mesh trellis-2 use TRELLIS.2 instead of Hunyuan3D v3 (fal only)
 *   ... --force          regenerate even if cached
 *   ... --approve <slug> publish a reviewed model (new models land as review: "pending")
 *
 * The HF quota is ~3.5 GPU-minutes a day (about one official). When it runs out the
 * script stops with exit code 75 and the cached steps resume on the next run, so
 * launchd can simply retry it every hour (scripts/run-player-models.sh).
 *
 * Intermediate files are cached in .player-models/<slug>/ (gitignored) so a failed
 * step resumes where it stopped. Every model is labeled on the site as an
 * AI-generated likeness; the manifest records the portrait it came from.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CACHE = path.join(ROOT, ".player-models");
const OUT_DIR = path.join(ROOT, "public/models/officials");
const MANIFEST = path.join(ROOT, "lib/player-models.json");

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const FORCE = flag("--force");
const MESH = opt("--mesh", "hunyuan3d-v3");
const TIER = opt("--tier", null);
const APPROVE = opt("--approve", null);
const slugsArg = args.filter((a, i) => !a.startsWith("--") && !["--mesh", "--tier", "--approve"].includes(args[i - 1]));

/* Build order, as the editor set it: Commissioners Court first, then JPs, state
   reps, Congress, and everyone else after. */
const TIERS = [
  ["commissioners", /Harris County Commissioner/],
  ["jp", /Justice of the Peace/],
  ["house", /State Representative/],
  ["congress", /U\.S\. Representative/],
  ["county", /Harris County/],
  ["senate", /State Senator/],
  ["city", /Mayor|City Controller|City Council/],
  ["hisd", /HISD/],
];
const tierOf = (office = "") => { const i = TIERS.findIndex(([, re]) => re.test(office)); return i < 0 ? TIERS.length : i; };

if (APPROVE) {
  const man = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  if (!man[APPROVE]) { console.error(`no model for ${APPROVE}`); process.exit(1); }
  delete man[APPROVE].review;
  fs.writeFileSync(MANIFEST, JSON.stringify(man, null, 2) + "\n");
  console.log(`approved ${APPROVE}`);
  process.exit(0);
}

const FAL_KEY = process.env.FAL_KEY;
const HF_TOKEN = process.env.HF_TOKEN;
const PROVIDER = FAL_KEY ? "fal" : HF_TOKEN ? "hf" : null;

/* ── Officials (parsed from lib/politicians.ts) ─────────────────────────── */
function loadOfficials() {
  const src = fs.readFileSync(path.join(ROOT, "lib/politicians.ts"), "utf8");
  const out = [];
  const re = /slug:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"([\s\S]*?)(?=\n\s*slug:|\n\];)/g;
  let m;
  while ((m = re.exec(src))) {
    const photo = /photo:\s*"([^"]+)"/.exec(m[3])?.[1];
    const office = /office:\s*"([^"]+)"/.exec(m[3])?.[1];
    out.push({ slug: m[1], name: m[2], office, photo });
  }
  return out;
}

/* ── Prompts ────────────────────────────────────────────────────────────── */
const FRONT_PROMPT = `Create a full-body 3D video game character of this exact person, in the style of an NBA 2K player model: hyper-realistic game render with detailed skin, fabric and hair. Keep the same face, facial features, skin tone, hairline, hairstyle and apparent age as the photo. Keep the clothing from the photo and complete it into a full professional outfit with matching trousers or skirt and dress shoes. Standing upright in a neutral A-pose, facing the camera straight on, arms relaxed and held slightly away from the body, feet shoulder-width apart. The whole body is visible from the top of the head to the soles of the shoes, centered, with a little empty space above the head and below the feet. Plain seamless light gray background, soft even studio lighting, no cast shadows, no text, no logos.`;
const BACK_PROMPT = `Show this exact same 3D character from directly behind, a back view: identical body, proportions, outfit, colors, hair and A-pose, full body from head to shoes, same framing and scale, same plain light gray background and even lighting. The face is not visible.`;

/* ── Helpers ────────────────────────────────────────────────────────────── */
const log = (slug, msg) => console.log(`[${slug}] ${msg}`);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function download(url, file) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status} ${url}`);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  return file;
}

function dataUri(file) {
  const ext = path.extname(file).slice(1).toLowerCase();
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
  return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
}

async function portrait(o, dir) {
  const file = path.join(dir, "portrait" + (path.extname(o.photo).split("?")[0] || ".jpg"));
  if (fs.existsSync(file)) return file;
  if (o.photo.startsWith("/")) fs.copyFileSync(path.join(ROOT, "public", o.photo), file);
  else await download(o.photo, file);
  return file;
}

/* ── fal.ai ─────────────────────────────────────────────────────────────── */
async function fal(model, input) {
  const headers = { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" };
  const sub = await fetch(`https://queue.fal.run/${model}`, { method: "POST", headers, body: JSON.stringify(input) });
  if (!sub.ok) throw new Error(`fal ${model} submit ${sub.status}: ${(await sub.text()).slice(0, 300)}`);
  const { status_url, response_url } = await sub.json();
  for (let i = 0; i < 240; i++) {
    await sleep(i < 5 ? 2000 : 5000);
    const s = await (await fetch(status_url, { headers })).json();
    if (s.status === "COMPLETED") break;
    if (s.status === "FAILED" || s.error) throw new Error(`fal ${model} failed: ${JSON.stringify(s).slice(0, 300)}`);
  }
  const res = await fetch(response_url, { headers });
  const body = await res.json();
  if (!res.ok) throw new Error(`fal ${model} ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  return body;
}

async function falEdit(prompt, imageFiles, out, aspect = "2:3") {
  try {
    const r = await fal("fal-ai/nano-banana/edit", {
      prompt, image_urls: imageFiles.map(dataUri), aspect_ratio: aspect, output_format: "png", num_images: 1,
    });
    return download(r.images[0].url, out);
  } catch (e) {
    // Gemini declines some real-person edits; Kontext does not gate on likeness.
    console.warn("  nano-banana declined, falling back to Kontext:", e.message.slice(0, 120));
    const r = await fal("fal-ai/flux-kontext/dev", { prompt, image_url: dataUri(imageFiles[0]), output_format: "png", resolution_mode: "auto" });
    return download(r.images[0].url, out);
  }
}

async function falMesh(front, back, out) {
  if (MESH === "trellis-2") {
    const r = await fal("fal-ai/trellis-2", { image_url: dataUri(front), resolution: 1536, texture_size: 2048 });
    return download(r.model_glb.url, out);
  }
  const r = await fal("fal-ai/hunyuan3d-v3/image-to-3d", {
    input_image_url: dataUri(front), ...(back ? { back_image_url: dataUri(back) } : {}),
    face_count: 200000, enable_pbr: false, generate_type: "Normal",
  });
  return download((r.model_glb?.url ?? r.model_glb?.glb?.url), out);
}

/* ── Hugging Face ZeroGPU spaces ────────────────────────────────────────── */
let gradio;
async function hfClient(space) {
  gradio ??= await import("@gradio/client").catch(() => {
    console.error("HF path needs the Gradio client: npm i --no-save @gradio/client");
    process.exit(1);
  });
  return gradio.Client.connect(space, { hf_token: HF_TOKEN });
}

async function hfEdit(prompt, imageFiles, out) {
  const c = await hfClient("black-forest-labs/FLUX.1-Kontext-Dev");
  const r = await c.predict("/infer", {
    input_image: gradio.handle_file(new Blob([fs.readFileSync(imageFiles[0])])), prompt,
    seed: 7, randomize_seed: false, guidance_scale: 2.5, steps: 28,
  });
  return download(r.data[0].url, out);
}

async function hfMesh(front, _back, out) {
  const c = await hfClient("microsoft/TRELLIS.2");
  await c.predict("/start_session", {});
  const pre = await c.predict("/preprocess_image", { input: gradio.handle_file(new Blob([fs.readFileSync(front)])) });
  await c.predict("/image_to_3d", { image: gradio.handle_file(pre.data[0].url), seed: 1, resolution: "1536" });
  const glb = await c.predict("/extract_glb", { decimation_target: 200000, texture_size: 2048 });
  return download((glb.data[1] ?? glb.data[0]).url, out);
}

/* ── Pipeline ───────────────────────────────────────────────────────────── */
function optimize(raw, out) {
  // Meshopt geometry + WebP textures: a 60 MB raw mesh lands around 2–4 MB.
  execFileSync("npx", ["--yes", "@gltf-transform/cli@4", "optimize", raw, out,
    "--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "2048",
    "--simplify-ratio", "0.5", "--simplify-error", "0.0005"], { stdio: "inherit" });
}

async function build(o) {
  const dir = path.join(CACHE, o.slug);
  fs.mkdirSync(dir, { recursive: true });
  const step = (name) => path.join(dir, name);
  const cached = (f) => !FORCE && fs.existsSync(f);
  const edit = PROVIDER === "fal" ? falEdit : hfEdit;
  const mesh = PROVIDER === "fal" ? falMesh : hfMesh;

  const src = await portrait(o, dir);
  const front = step("front.png"), back = step("back.png"), raw = step(`raw-${PROVIDER === "fal" ? MESH : "trellis-2"}.glb`);
  if (!cached(front)) { log(o.slug, "full-body render"); await edit(FRONT_PROMPT, [src], front); }
  const wantBack = PROVIDER === "fal" && MESH === "hunyuan3d-v3";
  if (wantBack && !cached(back)) { log(o.slug, "back view"); await edit(BACK_PROMPT, [front], back); }
  if (!cached(raw)) { log(o.slug, `mesh (${PROVIDER === "fal" ? MESH : "trellis-2 via HF"})`); await mesh(front, wantBack ? back : null, raw); }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const final = path.join(OUT_DIR, `${o.slug}.glb`);
  log(o.slug, "optimize");
  optimize(raw, final);
  log(o.slug, `done: ${(fs.statSync(final).size / 1e6).toFixed(1)} MB`);

  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  manifest[o.slug] = {
    file: `/models/officials/${o.slug}.glb`,
    portrait: o.photo,
    pipeline: PROVIDER === "fal" ? `nano-banana → ${MESH}` : "flux-kontext → trellis-2",
    generated: new Date().toISOString().slice(0, 10),
    review: "pending",   // hidden on the site until approved with --approve
    ...(manifest[o.slug]?.yaw != null ? { yaw: manifest[o.slug].yaw } : {}),
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
}

if (!PROVIDER) {
  console.error("Set FAL_KEY or HF_TOKEN in .env.local first.");
  process.exit(1);
}
const officials = loadOfficials();
const existing = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
const tierFilter = TIER ? TIERS.findIndex(([n]) => n === TIER) : -1;
if (TIER && tierFilter < 0) { console.error(`unknown tier ${TIER}; one of ${TIERS.map(t => t[0]).join(", ")}`); process.exit(1); }
const queue = flag("--all") || TIER
  ? officials
      .map((o, i) => ({ ...o, tier: tierOf(o.office), i }))
      .filter(o => o.photo && (FORCE || !existing[o.slug]) && (tierFilter < 0 || o.tier === tierFilter))
      .sort((a, b) => a.tier - b.tier || a.i - b.i)
  : slugsArg.map(s => officials.find(o => o.slug === s) ?? (console.error(`unknown slug ${s}`), process.exit(1)));
if (!queue.length) { console.log("Nothing to build."); process.exit(0); }
for (const o of queue) if (!o.photo) { console.error(`${o.slug} has no photo`); process.exit(1); }

console.log(`Building ${queue.length} model(s) via ${PROVIDER}${PROVIDER === "fal" ? ` (${MESH})` : ""}`);
let failed = 0;
const QUOTA = /ZeroGPU quota|exceeded your .*quota|quota exceeded/i;
let built = 0;
for (const o of queue) {
  try { await build(o); built++; }
  catch (e) {
    if (QUOTA.test(e.message)) {
      console.log(`QUOTA: stopped at ${o.slug} after ${built} built. ${e.message.match(/Try again in [0-9:]+/)?.[0] ?? ""}`);
      process.exit(75);
    }
    failed++; console.error(`[${o.slug}] FAILED: ${e.message}`);
  }
}
console.log(`${queue.length - failed} built, ${failed} failed.`);
process.exit(failed ? 1 : 0);
