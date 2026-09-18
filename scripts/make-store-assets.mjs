// Renders the Google Play listing graphics: the 512x512 store icon and the
// 1024x500 feature graphic. Same approach as make-icons.mjs — there is no image
// tooling here, so headless Chromium paints the SVG and we screenshot it.
//
//   node scripts/make-store-assets.mjs
//
// Output lands in store/. CHROME env var overrides the browser binary.

import { execSync } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return import(pathToFileURL(path.join(root, 'playwright', 'index.mjs')).href);
  }
}
const { chromium } = await loadPlaywright();

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'store');

const CREAM = '#F7F3E7';
const PAPER = '#FDF8E8';
const INK = '#463F38';
const SUN = '#EFA820';

// The app's own faces, so the listing matches what people install.
const BRAND_FONT = pathToFileURL(
  path.join(ROOT, 'node_modules/@expo-google-fonts/shippori-mincho/600SemiBold/ShipporiMincho_600SemiBold.ttf')
).href;
const BODY_FONT = pathToFileURL(
  path.join(ROOT, 'node_modules/@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf')
).href;
const BODY_FONT_REG = pathToFileURL(
  path.join(ROOT, 'node_modules/@expo-google-fonts/nunito/400Regular/Nunito_400Regular.ttf')
).href;

const FONT_CSS = `
@font-face { font-family: 'Brand'; src: url('${BRAND_FONT}'); }
@font-face { font-family: 'Body'; src: url('${BODY_FONT}'); font-weight: 800; }
@font-face { font-family: 'Body'; src: url('${BODY_FONT_REG}'); font-weight: 400; }`;

/** The mark, on a 1024 canvas. */
function mark({ ink = INK, sun = SUN } = {}) {
  return `
    <circle cx="630" cy="420" r="205" fill="${sun}"/>
    <g fill="none" stroke="${ink}" stroke-width="29" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="208,637 368,500 478,603 638,445 806,637"/>
    </g>
    <g fill="none" stroke="${ink}" stroke-width="17">
      <ellipse cx="512" cy="703" rx="345" ry="70"/>
      <ellipse cx="508" cy="701" rx="190" ry="38"/>
    </g>`;
}

/** Faint zen-garden rake lines, echoing the app's background. */
function rakeLines(w, h) {
  const rows = [];
  for (let i = 0; i < 7; i++) {
    const y = h * 0.16 + i * (h * 0.115);
    rows.push(
      `<path d="M0 ${y} Q ${w * 0.5} ${y - h * 0.05} ${w} ${y}" fill="none" stroke="${INK}" stroke-opacity="0.07" stroke-width="2"/>`
    );
  }
  return rows.join('');
}

const STORE_ICON = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="232" ry="232" fill="${CREAM}"/>
  ${mark()}
</svg></body></html>`;

// 1024x500. Play crops the edges on some surfaces, so nothing that matters sits
// near them, and there is no device frame or fake UI (both are rejected).
const FEATURE = `<!doctype html><html><head><meta charset="utf-8">
<style>
${FONT_CSS}
html,body{margin:0;background:${PAPER}}
.wrap{position:relative;width:1024px;height:500px;overflow:hidden;background:${PAPER}}
.bg{position:absolute;inset:0}
.row{position:absolute;inset:0;display:flex;align-items:center;gap:52px;padding:0 96px}
.mark{width:238px;height:210px;flex:none}
.words{display:flex;flex-direction:column;gap:14px}
.name{font-family:'Brand',serif;font-size:82px;letter-spacing:10px;color:${INK};line-height:1}
.tag{font-family:'Body',sans-serif;font-weight:800;font-size:34px;color:${INK};line-height:1.25;max-width:520px}
.sub{font-family:'Body',sans-serif;font-weight:400;font-size:23px;color:rgba(70,63,56,0.7);line-height:1.35}
</style></head><body>
<div class="wrap">
  <svg class="bg" viewBox="0 0 1024 500" preserveAspectRatio="none">
    ${rakeLines(1024, 500)}
  </svg>
  <div class="row">
    <!-- Cropped to the artwork's own bounds; the full 1024 square is mostly
         padding, which made the mark render small next to the wordmark. -->
    <svg class="mark" viewBox="152 205 720 585">${mark()}</svg>
    <div class="words">
      <div class="name">TASUKU</div>
      <div class="tag">Earn your screen time.</div>
      <div class="sub">Lock the apps that eat your day.<br/>Finish what matters to open them.</div>
    </div>
  </div>
</div></body></html>`;

const TARGETS = [
  { file: 'play-icon-512.png', html: STORE_ICON, width: 1024, height: 1024, scale: 512 / 1024 },
  { file: 'play-feature-1024x500.png', html: FEATURE, width: 1024, height: 500, scale: 1 },
];

await mkdir(OUT, { recursive: true });
const tmp = path.join(ROOT, '.store-build');
await mkdir(tmp, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
try {
  for (const { file, html, width, height, scale } of TARGETS) {
    const src = path.join(tmp, `${file}.html`);
    await writeFile(src, html);
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: scale,
    });
    await page.goto(`file://${src}`);
    // Give the embedded fonts a moment to load before the shot.
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, file) });
    await page.close();
    console.log(`${file}  ${Math.round(width * scale)}x${Math.round(height * scale)}`);
  }
} finally {
  await browser.close();
  await rm(tmp, { recursive: true, force: true });
}
