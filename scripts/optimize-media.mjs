// One-time media optimization pass for the Cloudflare migration.
// Converts public/media/**/*.{jpg,jpeg,png} and src/assets/polaroids/*.jpg to
// .webp, extracts the embedded PNGs baked into public/media/bg/*.svg and
// re-encodes those to .webp too, then deletes the now-unused originals and
// the unreferenced photo-gallery .MOV files. Run manually: `node scripts/optimize-media.mjs`.
import { readdir, stat, readFile, writeFile, rm } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const QUALITY = 82;
// Some source photos (phone camera originals) are far larger than any UI
// slot ever displays them at (e.g. 3213x5712 for a small gallery tile) —
// re-encoding those at full resolution can end up *larger* than the
// already-compressed original. Cap the long edge; site's biggest use case
// (magazine spread lightbox) tops out around 2480px wide.
const MAX_DIMENSION = 2600;

const results = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(0)}KB`;
}

async function convertRasterToWebp(srcPath) {
  const ext = extname(srcPath).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(ext)) return;
  const destPath = srcPath.slice(0, -ext.length) + ".webp";

  const [srcStat, destStat] = await Promise.all([
    stat(srcPath),
    stat(destPath).catch(() => null),
  ]);
  if (destStat && destStat.mtimeMs >= srcStat.mtimeMs) return; // already converted

  await sharp(srcPath)
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(destPath);
  let destSize = (await stat(destPath)).size;

  // Belt-and-suspenders: if webp still lost to the original (can happen on
  // already-aggressively-compressed source jpegs), retry at a lower quality
  // rather than ship a "conversion" that made bandwidth worse.
  if (destSize >= srcStat.size) {
    await sharp(srcPath)
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 65 })
      .toFile(destPath);
    destSize = (await stat(destPath)).size;
  }

  results.push({ path: relPath(srcPath), before: srcStat.size, after: destSize });
  await rm(srcPath);
}

async function convertBloatedSvgToWebp(svgPath) {
  const svg = await readFile(svgPath, "utf8");
  const match = svg.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
  if (!match) {
    console.warn(`  ! ${relPath(svgPath)} has no embedded PNG — leaving as-is`);
    return;
  }
  const png = Buffer.from(match[1], "base64");
  const destPath = svgPath.slice(0, -".svg".length) + ".webp";
  const before = (await stat(svgPath)).size;
  await sharp(png).webp({ quality: QUALITY }).toFile(destPath);
  const after = (await stat(destPath)).size;
  results.push({ path: relPath(svgPath), before, after });
  await rm(svgPath);
}

function relPath(p) {
  return p.slice(ROOT.length + 1).replace(/\\/g, "/");
}

async function main() {
  console.log("Converting public/media raster images (jpg/jpeg/png) to webp...");
  const mediaDir = join(ROOT, "public", "media");
  const mediaFiles = await walk(mediaDir);
  for (const f of mediaFiles) {
    const ext = extname(f).toLowerCase();
    if ([".jpg", ".jpeg", ".png"].includes(ext)) {
      await convertRasterToWebp(f);
    }
  }

  console.log("Converting src/assets/polaroids/*.jpg to webp...");
  const polaroidsDir = join(ROOT, "src", "assets", "polaroids");
  const polaroidFiles = await readdir(polaroidsDir);
  for (const name of polaroidFiles) {
    if (extname(name).toLowerCase() === ".jpg") {
      await convertRasterToWebp(join(polaroidsDir, name));
    }
  }

  console.log("Extracting embedded PNGs from bg/*.svg and converting to webp...");
  const bgDir = join(mediaDir, "bg");
  for (const name of await readdir(bgDir)) {
    if (extname(name).toLowerCase() === ".svg") {
      await convertBloatedSvgToWebp(join(bgDir, name));
    }
  }

  console.log("Deleting unreferenced photo-gallery videos...");
  const galleryDir = join(mediaDir, "photo gallery");
  for (const name of await readdir(galleryDir)) {
    if (extname(name).toLowerCase() === ".mov") {
      const p = join(galleryDir, name);
      const before = (await stat(p)).size;
      await rm(p);
      results.push({ path: relPath(p), before, after: 0 });
    }
  }

  console.log(`\n${"File".padEnd(55)}  ${"Before".padStart(8)}  ${"After".padStart(8)}  Saved`);
  let totalBefore = 0;
  let totalAfter = 0;
  for (const r of results) {
    totalBefore += r.before;
    totalAfter += r.after;
    const saved = r.before > 0 ? `${(100 - (100 * r.after) / r.before).toFixed(0)}%` : "100%";
    console.log(`${r.path.padEnd(55)}  ${fmtKB(r.before).padStart(8)}  ${fmtKB(r.after).padStart(8)}  ${saved}`);
  }
  console.log(
    `\nTotal: ${(totalBefore / 1024 / 1024).toFixed(1)}MB -> ${(totalAfter / 1024 / 1024).toFixed(1)}MB (${(100 - (100 * totalAfter) / totalBefore).toFixed(1)}% saved)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
