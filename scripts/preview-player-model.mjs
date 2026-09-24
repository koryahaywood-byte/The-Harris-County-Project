#!/usr/bin/env node
/**
 * Review sheet for a generated player model: the full-body render it came from,
 * then the GLB from the front, side, back and three-quarter, lit like the site.
 * Renders with headless Chrome into .player-models/<slug>/review.png.
 *
 *   node scripts/preview-player-model.mjs rodney-ellis [more slugs…]
 *   node scripts/preview-player-model.mjs --pending      every model awaiting review
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "lib/player-models.json"), "utf8"));
const args = process.argv.slice(2);
const slugs = args.includes("--pending")
  ? Object.keys(manifest).filter(s => manifest[s].review === "pending")
  : args;
if (!slugs.length) { console.log("Nothing to preview."); process.exit(0); }

const PAGE = (slug, glb, front) => `<!doctype html><html><head><style>
  html,body{margin:0;background:#0D2A21;font:12px system-ui;color:#E2B13C}
  .row{display:flex;gap:0;height:720px} img{height:720px;width:480px;object-fit:contain;background:#ddd}
  canvas{display:block} p{position:absolute;margin:6px 10px}
</style>
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
</head><body><p>${slug}</p><div class="row">${front ? `<img src="${front}">` : ""}<div id="v"></div></div>
<script type="module">
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
const W = 4 * 360, H = 720;
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
r.setSize(W, H); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
document.getElementById("v").appendChild(r.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x163a2e);
scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;
const key = new THREE.DirectionalLight(0xfff3e2, 2.4); key.position.set(2.2, 4.2, 3.6); scene.add(key);
const rim = new THREE.DirectionalLight(0xe2b13c, 1.3); rim.position.set(-3, 2.6, -2.6); scene.add(rim);
scene.add(new THREE.HemisphereLight(0xffffff, 0x0d2a21, 0.45));
const cam = new THREE.PerspectiveCamera(26, 360 / H, 0.1, 50);
cam.position.set(0, 0.65, 5.3); cam.lookAt(0, 0.85, 0);
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
loader.load("${glb}", (g) => {
  const m = g.scene, box = new THREE.Box3().setFromObject(m), s = 1.8 / box.getSize(new THREE.Vector3()).y;
  m.scale.setScalar(s); box.setFromObject(m); const c = box.getCenter(new THREE.Vector3());
  m.position.set(-c.x, -box.min.y, -c.z);
  const pivot = new THREE.Group(); pivot.add(m); scene.add(pivot);
  r.setScissorTest(true);
  [0, Math.PI / 4, Math.PI / 2, Math.PI].forEach((a, i) => {
    pivot.rotation.y = a; r.setViewport(i * 360, 0, 360, H); r.setScissor(i * 360, 0, 360, H); r.render(scene, cam);
  });
  document.title = "ready";
}, undefined, (e) => { document.body.innerHTML = "<p>LOAD FAILED " + e + "</p>"; });
</script></body></html>`;

const MIME = { ".js": "text/javascript", ".glb": "model/gltf-binary", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".html": "text/html" };
const pages = new Map();
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (pages.has(url)) { res.writeHead(200, { "Content-Type": "text/html" }); return res.end(pages.get(url)); }
  const allowed = ["/node_modules/three/", "/public/models/", "/.player-models/"];
  if (!allowed.some(p => url.startsWith(p))) { res.writeHead(404); return res.end(); }
  const file = path.join(ROOT, url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

for (const slug of slugs) {
  const entry = manifest[slug];
  if (!entry) { console.error(`no model for ${slug}`); continue; }
  const dir = path.join(ROOT, ".player-models", slug);
  fs.mkdirSync(dir, { recursive: true });
  const front = fs.existsSync(path.join(dir, "front.png")) ? `/.player-models/${slug}/front.png` : null;
  pages.set(`/review-${slug}.html`, PAGE(slug, `/public${entry.file}`, front));
  const out = path.join(dir, "review.png");
  // Spawn (not execFileSync): the server answering Chrome lives on this event loop.
  await new Promise((resolve) => {
    const p = spawn(CHROME, ["--headless=new", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--hide-scrollbars",
      `--window-size=${(front ? 480 : 0) + 1440},720`, "--virtual-time-budget=20000", `--screenshot=${out}`,
      `http://127.0.0.1:${port}/review-${slug}.html`], { stdio: "ignore" });
    p.on("exit", resolve);
  });
  console.log(fs.existsSync(out) ? `review sheet: ${path.relative(ROOT, out)}` : `${slug}: screenshot failed`);
}
server.close();
