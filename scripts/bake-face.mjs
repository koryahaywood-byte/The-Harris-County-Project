#!/usr/bin/env node
/**
 * Face bake: image-to-3D models blur and smear faces, because the face is a few
 * dozen pixels of the input. The full-body render still has a clean face, so this
 * projects it straight onto the front of the model's head and paints it into the
 * texture, feathered by surface angle and faded out at the neck.
 *
 *   node scripts/bake-face.mjs <raw.glb> <front.png> <out.glb> [--debug dir]
 *
 * Alignment: the model is Y-up and faces +Z (TRELLIS convention). The render's
 * head is found from its silhouette against the plain background; the model's
 * head from its vertices. Both are matched at the crown and at head width, so
 * the photo-to-model fit is local to the head, where it matters.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export async function bakeFace(rawPath, frontPath, outPath, { debugDir } = {}) {
  /* ── The render: silhouette and head box ─────────────────────────────── */
  const { data: img, info } = await sharp(frontPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const IW = info.width, IH = info.height;
  const px = (x, y) => (y * IW + x) * 3;
  // Background is plain and light: sample it from the top corners.
  const bg = [0, 0, 0];
  for (const [x, y] of [[4, 4], [IW - 5, 4], [4, 30], [IW - 5, 30]]) for (let k = 0; k < 3; k++) bg[k] += img[px(x, y) + k] / 4;
  const fg = new Uint8Array(IW * IH);
  for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
    const i = px(x, y);
    const d = Math.hypot(img[i] - bg[0], img[i + 1] - bg[1], img[i + 2] - bg[2]);
    fg[y * IW + x] = d > 38 ? 1 : 0;
  }
  const rowSpan = (y) => { let a = -1, b = -1; for (let x = 0; x < IW; x++) if (fg[y * IW + x]) { if (a < 0) a = x; b = x; } return a < 0 ? null : [a, b]; };
  let top = 0; while (top < IH && !(rowSpan(top) && rowSpan(top)[1] - rowSpan(top)[0] > 3)) top++;
  // Bottom of the shoes: last row with dark pixels (the floor shadow is light).
  let bottom = IH - 1;
  outer: for (; bottom > top; bottom--) for (let x = 0; x < IW; x++) { const i = px(x, bottom); if (img[i] + img[i + 1] + img[i + 2] < 180) break outer; }
  const figH = bottom - top;

  /* ── The model ───────────────────────────────────────────────────────── */
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(rawPath);
  const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
  const P = prim.getAttribute("POSITION").getArray();
  const N = prim.getAttribute("NORMAL").getArray();
  const UV = prim.getAttribute("TEXCOORD_0").getArray();
  const I = prim.getIndices().getArray();
  const nV = P.length / 3;
  let yMin = Infinity, yMax = -Infinity;
  for (let i = 0; i < nV; i++) { yMin = Math.min(yMin, P[i * 3 + 1]); yMax = Math.max(yMax, P[i * 3 + 1]); }
  const H = yMax - yMin;

  // Head width, measured on the same band (3–8% down from the crown) in both.
  const band = [0.03, 0.08];
  let mx0 = Infinity, mx1 = -Infinity;
  for (let i = 0; i < nV; i++) {
    const d = (yMax - P[i * 3 + 1]) / H;
    if (d >= band[0] && d <= band[1] && P[i * 3 + 2] > 0) { mx0 = Math.min(mx0, P[i * 3]); mx1 = Math.max(mx1, P[i * 3]); }
  }
  let ix0 = Infinity, ix1 = -Infinity;
  for (let y = Math.round(top + band[0] * figH); y <= Math.round(top + band[1] * figH); y++) {
    const s = rowSpan(y); if (s) { ix0 = Math.min(ix0, s[0]); ix1 = Math.max(ix1, s[1]); }
  }
  const scale0 = (ix1 - ix0) / (mx1 - mx0);           // image px per model unit, at the head
  const mcx = (mx0 + mx1) / 2, icx = (ix0 + ix1) / 2;

  /* ── Texture ─────────────────────────────────────────────────────────── */
  const mat = prim.getMaterial();
  const tex = mat.getBaseColorTexture();
  const { data: T, info: tinfo } = await sharp(Buffer.from(tex.getImage())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const TW = tinfo.width, TH = tinfo.height;

  /* ── Registration ────────────────────────────────────────────────────────
     The model's texture was made from this same render, so its eyes, brows and
     mouth sit where the render's do, give or take. Render the model's face
     head-on (orthographic, texture only), then search scale and offset for the
     best correlation with the render. The silhouette fit above is the start. */
  const G = 112;                                        // face grid, model units → cells
  const fx0 = mcx - 0.075 * H, fx1 = mcx + 0.075 * H;   // face box: brows to chin
  const fy1 = yMax - 0.035 * H, fy0 = yMax - 0.125 * H;
  const face = new Float32Array(G * G).fill(NaN), zbuf = new Float32Array(G * G).fill(-Infinity);
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t], b = I[t + 1], c = I[t + 2];
    const vx = [a, b, c].map(k => (P[k * 3] - fx0) / (fx1 - fx0) * G), vy = [a, b, c].map(k => (fy1 - P[k * 3 + 1]) / (fy1 - fy0) * G);
    if (Math.max(...vx) < 0 || Math.min(...vx) > G || Math.max(...vy) < 0 || Math.min(...vy) > G) continue;
    const den = (vy[1] - vy[2]) * (vx[0] - vx[2]) + (vx[2] - vx[1]) * (vy[0] - vy[2]);
    if (Math.abs(den) < 1e-9) continue;
    for (let gy = Math.max(0, Math.floor(Math.min(...vy))); gy <= Math.min(G - 1, Math.ceil(Math.max(...vy))); gy++)
      for (let gx = Math.max(0, Math.floor(Math.min(...vx))); gx <= Math.min(G - 1, Math.ceil(Math.max(...vx))); gx++) {
        const qx = gx + 0.5, qy = gy + 0.5;
        const w0 = ((vy[1] - vy[2]) * (qx - vx[2]) + (vx[2] - vx[1]) * (qy - vy[2])) / den;
        const w1 = ((vy[2] - vy[0]) * (qx - vx[2]) + (vx[0] - vx[2]) * (qy - vy[2])) / den;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * P[a * 3 + 2] + w1 * P[b * 3 + 2] + w2 * P[c * 3 + 2];
        if (z <= zbuf[gy * G + gx]) continue;
        zbuf[gy * G + gx] = z;
        const tu = Math.min(TW - 1, Math.max(0, Math.floor((w0 * UV[a * 2] + w1 * UV[b * 2] + w2 * UV[c * 2]) * TW)));
        const tv = Math.min(TH - 1, Math.max(0, Math.floor((w0 * UV[a * 2 + 1] + w1 * UV[b * 2 + 1] + w2 * UV[c * 2 + 1]) * TH)));
        const q = (tv * TW + tu) * 4;
        face[gy * G + gx] = 0.299 * T[q] + 0.587 * T[q + 1] + 0.114 * T[q + 2];
      }
  }
  const gray = (x, y) => { const i = px(Math.round(x), Math.round(y)); return 0.299 * img[i] + 0.587 * img[i + 1] + 0.114 * img[i + 2]; };
  const cells = [];
  for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
    const v = face[gy * G + gx];
    if (!Number.isNaN(v)) cells.push([fx0 + (gx + 0.5) / G * (fx1 - fx0), fy1 - (gy + 0.5) / G * (fy1 - fy0), v]);
  }
  const mMean = cells.reduce((s, c) => s + c[2], 0) / cells.length;
  const mStd = Math.sqrt(cells.reduce((s, c) => s + (c[2] - mMean) ** 2, 0) / cells.length) || 1;
  const ncc = (sc, dx, dy) => {
    let sI = 0, sII = 0, sIM = 0, n = 0;
    for (const [x, y, v] of cells) {
      const ix = icx + (x - mcx) * sc + dx, iy = top + (yMax - y) * sc + dy;
      if (ix < 0 || iy < 0 || ix >= IW || iy >= IH) continue;
      const g = gray(ix, iy); sI += g; sII += g * g; sIM += g * (v - mMean); n++;
    }
    const iMean = sI / n, iStd = Math.sqrt(Math.max(1e-6, sII / n - iMean * iMean));
    return sIM / n / (iStd * mStd);
  };
  let best = { sc: scale0, dx: 0, dy: 0, r: ncc(scale0, 0, 0) };
  for (const [sStep, pStep, span] of [[0.02, 3, 6], [0.006, 1, 4], [0.002, 0.5, 3]]) {
    const c = { ...best };
    for (let i = -span; i <= span; i++) for (let j = -span; j <= span; j++) for (let k = -span; k <= span; k++) {
      const sc = c.sc * (1 + i * sStep), dx = c.dx + j * pStep, dy = c.dy + k * pStep;
      const r = ncc(sc, dx, dy);
      if (r > best.r) best = { sc, dx, dy, r };
    }
  }
  const scale = best.sc;
  const toImg = (x, y) => [icx + (x - mcx) * scale + best.dx, top + (yMax - y) * scale + best.dy];
  const sample = (x, y) => {
    const x0 = Math.max(0, Math.min(IW - 2, Math.floor(x))), y0 = Math.max(0, Math.min(IH - 2, Math.floor(y)));
    const fx = x - x0, fy = y - y0, out = [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      const a = img[px(x0, y0) + k], b = img[px(x0 + 1, y0) + k], c = img[px(x0, y0 + 1) + k], d = img[px(x0 + 1, y0 + 1) + k];
      out[k] = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
    }
    return out;
  };

  // Chin sits ~12.5% of height below the crown on an adult; fade out just past it.
  const neck0 = yMax - 0.14 * H, neck1 = yMax - 0.115 * H;
  const texels = [];   // [texIndex, weight, r, g, b] gathered first so colors can be matched
  const seen = new Uint8Array(TW * TH);
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t], b = I[t + 1], c = I[t + 2];
    if (P[a * 3 + 1] < neck0 && P[b * 3 + 1] < neck0 && P[c * 3 + 1] < neck0) continue;
    if (N[a * 3 + 2] < 0.1 && N[b * 3 + 2] < 0.1 && N[c * 3 + 2] < 0.1) continue;
    const u = [UV[a * 2] * TW, UV[b * 2] * TW, UV[c * 2] * TW], v = [UV[a * 2 + 1] * TH, UV[b * 2 + 1] * TH, UV[c * 2 + 1] * TH];
    const den = (v[1] - v[2]) * (u[0] - u[2]) + (u[2] - u[1]) * (v[0] - v[2]);
    if (Math.abs(den) < 1e-9) continue;
    const x0 = Math.floor(Math.min(...u)), x1 = Math.ceil(Math.max(...u)), y0 = Math.floor(Math.min(...v)), y1 = Math.ceil(Math.max(...v));
    for (let ty = Math.max(0, y0); ty <= Math.min(TH - 1, y1); ty++) for (let tx = Math.max(0, x0); tx <= Math.min(TW - 1, x1); tx++) {
      const qx = tx + 0.5, qy = ty + 0.5;
      const w0 = ((v[1] - v[2]) * (qx - u[2]) + (u[2] - u[1]) * (qy - v[2])) / den;
      const w1 = ((v[2] - v[0]) * (qx - u[2]) + (u[0] - u[2]) * (qy - v[2])) / den;
      const w2 = 1 - w0 - w1;
      if (w0 < -0.06 || w1 < -0.06 || w2 < -0.06) continue;
      const ti = ty * TW + tx;
      if (seen[ti]) continue;
      seen[ti] = 1;
      const X = w0 * P[a * 3] + w1 * P[b * 3] + w2 * P[c * 3];
      const Y = w0 * P[a * 3 + 1] + w1 * P[b * 3 + 1] + w2 * P[c * 3 + 1];
      const nz = w0 * N[a * 3 + 2] + w1 * N[b * 3 + 2] + w2 * N[c * 3 + 2];
      const nl = Math.hypot(w0 * N[a * 3] + w1 * N[b * 3] + w2 * N[c * 3], w0 * N[a * 3 + 1] + w1 * N[b * 3 + 1] + w2 * N[c * 3 + 1], nz) || 1;
      const w = smooth(0.3, 0.7, nz / nl) * smooth(neck0, neck1, Y);
      if (w <= 0.01) continue;
      const [ix, iy] = toImg(X, Y);
      if (ix < 1 || iy < 1 || ix > IW - 2 || iy > IH - 2 || !fg[Math.round(iy) * IW + Math.round(ix)]) continue;
      texels.push([ti, w, ...sample(ix, iy)]);
    }
  }

  // Match the render's face color to the model's own, so the edges don't show.
  const mOrig = [0, 0, 0], mNew = [0, 0, 0]; let ws = 0;
  for (const [ti, w, r, g, b] of texels) { for (let k = 0; k < 3; k++) mOrig[k] += T[ti * 4 + k] * w; mNew[0] += r * w; mNew[1] += g * w; mNew[2] += b * w; ws += w; }
  const gain = mOrig.map((o, k) => Math.min(1.25, Math.max(0.8, o / (mNew[k] || 1))));
  for (const [ti, w, r, g, b] of texels) {
    const c = [r, g, b];
    for (let k = 0; k < 3; k++) T[ti * 4 + k] = Math.round(T[ti * 4 + k] * (1 - w) + Math.min(255, c[k] * gain[k]) * w);
  }

  tex.setImage(new Uint8Array(await sharp(T, { raw: { width: TW, height: TH, channels: 4 } }).webp({ quality: 92 }).toBuffer()));
  tex.setMimeType("image/webp");
  await io.write(outPath, doc);

  if (debugDir) {
    // Alignment check: the model's head vertices drawn over the render.
    const dbg = Buffer.from(img);
    for (let i = 0; i < nV; i += 3) {
      if (P[i * 3 + 1] < neck0 || P[i * 3 + 2] < 0) continue;
      const [x, y] = toImg(P[i * 3], P[i * 3 + 1]).map(Math.round);
      if (x >= 0 && y >= 0 && x < IW && y < IH) { const j = px(x, y); dbg[j] = 255; dbg[j + 1] = 40; dbg[j + 2] = 200; }
    }
    await sharp(dbg, { raw: { width: IW, height: IH, channels: 3 } })
      .extract({ left: Math.max(0, Math.round(icx - figH * 0.12)), top: Math.max(0, top - 10), width: Math.round(figH * 0.24), height: Math.round(figH * 0.2) })
      .resize({ width: 480 }).png().toFile(path.join(debugDir, "align.png"));
  }
  return { texels: texels.length, scale, gain, top, figH, fit: best, start: scale0 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [raw, front, out] = process.argv.slice(2);
  const di = process.argv.indexOf("--debug");
  const r = await bakeFace(raw, front, out, { debugDir: di > 0 ? process.argv[di + 1] : undefined });
  console.log(`baked ${r.texels} texels; scale ${r.start.toFixed(0)}→${r.scale.toFixed(0)} px/unit, offset ${r.fit.dx.toFixed(1)},${r.fit.dy.toFixed(1)} px, match r=${r.fit.r.toFixed(3)}; color gain ${r.gain.map(g => g.toFixed(2)).join("/")}`);
}
