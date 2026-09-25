#!/usr/bin/env node
/**
 * Head swap: a full-body image-to-3D model gets the face from a few dozen pixels
 * and comes out lumpy. A head-and-shoulders model of the same person gets ~5x
 * the pixels and comes out clean. This puts the second head on the first body.
 *
 *   node scripts/merge-head.mjs <body.glb> <bust.glb> <out.glb>
 *
 * Fit: both are Y-up and face +Z. The bust is scaled so its head-width profile
 * (crown down past the ears) matches the body's head, then moved crown-to-crown
 * and center-to-center. The body loses everything above the chin; the bust
 * keeps its head and neck down into the collar, which hides the join.
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { mergeDocuments, prune, unpartition } from "@gltf-transform/functions";

const BODY_CUT = 0.128;  // fraction of body height below the crown: just under the chin
const BUST_CUT = 0.145;  // keep the bust's neck down into the collar

function geometry(prim) {
  const P = prim.getAttribute("POSITION").getArray();
  let yMax = -Infinity, yMin = Infinity;
  for (let i = 1; i < P.length; i += 3) { yMax = Math.max(yMax, P[i]); yMin = Math.min(yMin, P[i]); }
  return { P, yMax, yMin };
}

/** Width (x extent) and x/z centers of horizontal slices, measured down from the crown. */
function profile({ P, yMax }, depth, steps) {
  const w = [], cx = [], cz = [];
  for (let s = 0; s < steps; s++) {
    const d0 = (s / steps) * depth, d1 = ((s + 1) / steps) * depth;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let i = 0; i < P.length; i += 3) {
      const d = yMax - P[i + 1];
      if (d < d0 || d >= d1) continue;
      x0 = Math.min(x0, P[i]); x1 = Math.max(x1, P[i]); z0 = Math.min(z0, P[i + 2]); z1 = Math.max(z1, P[i + 2]);
    }
    w.push(x1 > x0 ? x1 - x0 : 0); cx.push((x0 + x1) / 2); cz.push((z0 + z1) / 2);
  }
  return { w, cx, cz };
}

function keepTriangles(prim, keep) {
  const idx = prim.getIndices();
  const I = idx.getArray(), P = prim.getAttribute("POSITION").getArray();
  const out = [];
  for (let t = 0; t < I.length; t += 3) {
    const y = (P[I[t] * 3 + 1] + P[I[t + 1] * 3 + 1] + P[I[t + 2] * 3 + 1]) / 3;
    if (keep(y)) out.push(I[t], I[t + 1], I[t + 2]);
  }
  idx.setArray(I instanceof Uint32Array ? Uint32Array.from(out) : Uint16Array.from(out));
  return out.length / 3;
}

export async function mergeHead(bodyPath, bustPath, outPath) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const body = await io.read(bodyPath);
  const bust = await io.read(bustPath);
  const bPrim = body.getRoot().listMeshes()[0].listPrimitives()[0];
  const hPrim = bust.getRoot().listMeshes()[0].listPrimitives()[0];
  const bG = geometry(bPrim), hG = geometry(hPrim);
  const H = bG.yMax - bG.yMin;

  // Body head profile over the cranium and ears (0–9% of height below the crown).
  const STEPS = 24, span = 0.09 * H;
  const bodyProf = profile(bG, span, STEPS);
  // Try bust scales; for each, compare its profile over the same physical span.
  let best = { s: 1, err: Infinity };
  const hH = hG.yMax - hG.yMin;
  for (let k = 0; k <= 400; k++) {
    const s = (0.08 + k * 0.004) * H / hH;           // bust height as 8%–168% of body height
    const prof = profile(hG, span / s, STEPS);
    let err = 0, n = 0;
    for (let i = 1; i < STEPS; i++) {                   // skip the crown sliver
      if (!bodyProf.w[i] || !prof.w[i]) { err += 1e3; continue; }
      err += (bodyProf.w[i] - prof.w[i] * s) ** 2; n++;
    }
    if (n > STEPS / 2 && err < best.err) best = { s, err, prof };
  }
  const s = best.s;
  // Centers from the upper cranium slices, where hair and ears interfere least.
  const avg = (a, i0, i1) => a.slice(i0, i1).reduce((x, y) => x + y, 0) / (i1 - i0);
  const tx = avg(bodyProf.cx, 3, 12) - avg(best.prof.cx, 3, 12) * s;
  const tz = avg(bodyProf.cz, 3, 12) - avg(best.prof.cz, 3, 12) * s;
  const ty = bG.yMax - hG.yMax * s;

  // Cut: the body keeps everything below the chin, the bust its head and neck.
  const bodyTris = keepTriangles(bPrim, y => y < bG.yMax - BODY_CUT * H);
  const bustTris = keepTriangles(hPrim, y => y * s + ty > bG.yMax - BUST_CUT * H);

  // Bring the bust in as its own node with the fitted transform.
  const map = mergeDocuments(body, bust);
  const bustNodes = bust.getRoot().listScenes()[0].listChildren().map(n => map.get(n));
  const scene = body.getRoot().listScenes()[0];
  for (const n of bustNodes) {
    // Bust scenes nest a transform-free geometry node; wrap them so ours applies once.
    const wrap = body.createNode("head").setScale([s, s, s]).setTranslation([tx, ty, tz]).addChild(n);
    scene.addChild(wrap);
  }
  for (const extra of body.getRoot().listScenes().slice(1)) extra.dispose();
  body.getRoot().setDefaultScene(scene);
  await body.transform(prune(), unpartition());
  await io.write(outPath, body);
  return { scale: s, translate: [tx, ty, tz], bodyTris, bustTris, fitErr: best.err };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [bodyPath, bustPath, outPath] = process.argv.slice(2);
  const r = await mergeHead(bodyPath, bustPath, outPath);
  console.log(`head fit: scale ${r.scale.toFixed(3)}, move ${r.translate.map(v => v.toFixed(3)).join(",")}, fit error ${r.fitErr.toExponential(2)}; kept ${r.bodyTris} body + ${r.bustTris} head triangles`);
}
