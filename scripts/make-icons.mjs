// Renders the Tasuku mark (sun over two peaks, ripples below) into the whole
// Android/iOS/web icon set. There is no image tooling in this environment, so
// the SVG is painted by headless Chromium and screenshotted at each size.
//
//   node scripts/make-icons.mjs
//
// CHROME env var overrides the browser binary.

import { execSync } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Playwright is a build-time tool, not an app dependency, so it may only exist
// as a global install.
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
const ASSETS = path.join(ROOT, 'assets');

const CREAM = '#F7F3E7';
const INK = '#463F38';
const SUN = '#EFA820';

/** The mark itself, drawn on a 1024 canvas. `ink` lets the monochrome variant
 *  flatten the sun into the same colour as the linework. */
function scene({ ink = INK, sun = SUN } = {}) {
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

/** A squircle matching the rounded square in the source artwork. */
const PLATE = `<rect x="0" y="0" width="1024" height="1024" rx="232" ry="232" fill="${CREAM}"/>`;

function page(body, { background = 'transparent', scale = 1 } = {}) {
  const shift = (1024 * (1 - scale)) / 2;
  return `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:${background};}
svg{display:block;}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(${shift} ${shift}) scale(${scale})">${body}</g>
</svg></body></html>`;
}

// Android masks adaptive icons down to roughly the middle two-thirds, so the
// foreground art is inset to survive a circle, squircle or teardrop crop.
const SAFE = 0.64;

const TARGETS = [
  { file: 'icon.png', size: 1024, html: page(PLATE + scene()) },
  { file: 'favicon.png', size: 64, html: page(PLATE + scene()) },
  {
    file: 'android-icon-background.png',
    size: 1024,
    html: page(`<rect width="1024" height="1024" fill="${CREAM}"/>`),
  },
  { file: 'android-icon-foreground.png', size: 1024, html: page(scene(), { scale: SAFE }) },
  {
    file: 'android-icon-monochrome.png',
    size: 1024,
    html: page(scene({ ink: '#000000', sun: '#000000' }), { scale: SAFE }),
  },
  // Used by the native splash before our own SplashSequence takes over, so it
  // sits on the same cream the app opens on.
  { file: 'splash-icon.png', size: 1024, html: page(scene(), { scale: 0.72 }) },
];

const tmp = path.join(ROOT, '.icon-build');
await mkdir(tmp, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
try {
  for (const { file, size, html } of TARGETS) {
    const src = path.join(tmp, `${file}.html`);
    await writeFile(src, html);
    const page_ = await browser.newPage({
      viewport: { width: 1024, height: 1024 },
      deviceScaleFactor: size / 1024,
    });
    await page_.goto(`file://${src}`);
    await page_.screenshot({ path: path.join(ASSETS, file), omitBackground: true });
    await page_.close();
    console.log(`${file}  ${size}x${size}`);
  }
} finally {
  await browser.close();
  await rm(tmp, { recursive: true, force: true });
}
