#!/usr/bin/env node
/**
 * scripts/import-kalog-images.js
 *
 * Scans /public/images/Kalog technical light/ (and any subfolders recursively),
 * groups images by article number, copies them flat into /public/images/products/,
 * then matches to database products and updates imageUrl.
 *
 * Filename pattern: {SKU}_{TYPE}_{INDEX}.{ext}
 * Examples: 902333_VIEW_0001.png  902334_AMBIENT_0001.png  902335_DIMENSION_0001.jpg
 *
 * Image type priority (for primary / imageUrl):
 *   VIEW > AMBIENT / AMBIENT-OFF > DETAIL > DIMENSION
 *
 * Output naming:
 *   Primary image  → /public/images/products/{sku}{ext}      → imageUrl in DB
 *   Extra images   → /public/images/products/{sku}_2{ext}, {sku}_3{ext}, …
 *
 * Usage:
 *   node scripts/import-kalog-images.js [options]
 *
 * Options:
 *   --dry-run         Scan and report only — don't copy files or update DB
 *   --no-db-update    Copy files but don't update the database
 *   --api-base URL    API base URL (default: http://localhost:3000/api)
 *   --email EMAIL     Admin email  (or env: ADMIN_EMAIL)
 *   --password PASS   Admin password (or env: ADMIN_PASSWORD)
 *
 * Outputs:
 *   scripts/kalog-import-results.json  — full per-product report
 *   scripts/kalog-update-image-urls.sql — fallback SQL UPDATE statements
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const http  = require('http');
const https = require('https');
const zlib  = require('zlib');

// ─── Paths ────────────────────────────────────────────────────────────────────
const SCRIPT_DIR    = __dirname;
const PROJECT_ROOT  = path.resolve(SCRIPT_DIR, '..');
const SOURCE_DIR    = path.join(PROJECT_ROOT, 'public', 'images', 'Kalog technical light');
const DEST_DIR      = path.join(PROJECT_ROOT, 'public', 'images', 'products');
const RESULTS_FILE  = path.join(SCRIPT_DIR, 'kalog-import-results.json');
const SQL_FILE      = path.join(SCRIPT_DIR, 'kalog-update-image-urls.sql');

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args         = process.argv.slice(2);
const DRY_RUN      = args.includes('--dry-run');
const NO_DB_UPDATE = args.includes('--no-db-update') || DRY_RUN;

let apiBase       = 'http://localhost:3000/api';
let adminEmail    = process.env.ADMIN_EMAIL    || '';
let adminPassword = process.env.ADMIN_PASSWORD || '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--api-base' && args[i + 1]) apiBase       = args[++i];
  if (args[i] === '--email'    && args[i + 1]) adminEmail    = args[++i];
  if (args[i] === '--password' && args[i + 1]) adminPassword = args[++i];
}

// Load .env.local if credentials not provided
if (!adminEmail || !adminPassword) {
  try {
    const env = fs.readFileSync(path.join(PROJECT_ROOT, '.env.local'), 'utf8');
    for (const line of env.split('\n')) {
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (k === 'ADMIN_EMAIL'    && !adminEmail)    adminEmail    = v;
      if (k === 'ADMIN_PASSWORD' && !adminPassword) adminPassword = v;
    }
  } catch {}
}

// ─── Image type priority ──────────────────────────────────────────────────────
// Lower number = higher priority (chosen first as the primary image)
const TYPE_PRIORITY = { 'VIEW': 0, 'AMBIENT': 1, 'AMBIENT-OFF': 2, 'DETAIL': 3, 'DIMENSION': 4 };
function typePriority(type) {
  const upper = (type || '').toUpperCase();
  return TYPE_PRIORITY[upper] ?? 99;
}

// ─── Scan source folder recursively ───────────────────────────────────────────
function scanImages(dir) {
  const allFiles = [];
  function recurse(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) { recurse(full); continue; }
      const ext = path.extname(e.name).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) continue;
      allFiles.push(full);
    }
  }
  recurse(dir);
  return allFiles;
}

/**
 * Parse a filename like "902333_AMBIENT-OFF_0001.png"
 * Returns { sku, type, index, ext } or null if no SKU found.
 */
function parseFilename(filename) {
  const base = path.basename(filename, path.extname(filename));
  const ext  = path.extname(filename).toLowerCase();

  // Primary pattern: starts with 5-6+ digit SKU followed by _
  const m = base.match(/^(\d{4,7})_([A-Za-z0-9-]+)_(\d+)$/);
  if (m) {
    return { sku: m[1], type: m[2].toUpperCase(), index: parseInt(m[3], 10), ext };
  }

  // Looser fallback: find any 5-6 digit number in the filename
  const numMatch = base.match(/(\d{4,7})/);
  if (numMatch) {
    return { sku: numMatch[1], type: 'UNKNOWN', index: 0, ext };
  }

  return null;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function fetchUrl(urlStr, opts = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const lib    = parsed.protocol === 'https:' ? https : http;
    const body   = opts.body || null;
    const reqOptions = {
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        ...(opts.headers || {}),
      },
      timeout: 30000,
    };
    const req = lib.request(reqOptions, res => {
      const chunks = [];
      let stream = res;
      const ce = res.headers['content-encoding'] || '';
      if (ce.includes('gzip')) stream = res.pipe(zlib.createGunzip());
      stream.on('data', c => chunks.push(c));
      stream.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
      stream.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${urlStr}`)); });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function apiRequest(endpoint, method, data, token) {
  const bodyStr = JSON.stringify(data);
  const res = await fetchUrl(`${apiBase}${endpoint}`, {
    method,
    body: bodyStr,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  let parsed = {};
  try { parsed = JSON.parse(res.body); } catch {}
  return { status: res.status, body: parsed };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function login() {
  if (!adminEmail || !adminPassword) {
    console.error('\nAdmin credentials required. Provide via:');
    console.error('  --email EMAIL --password PASS');
    console.error('  or ADMIN_EMAIL / ADMIN_PASSWORD env vars\n');
    process.exit(1);
  }
  console.log(`Authenticating as ${adminEmail}...`);
  const res = await apiRequest('/auth/login', 'POST', { email: adminEmail, password: adminPassword });
  if (res.status !== 200 || !res.body.token) {
    console.error(`Login failed (HTTP ${res.status}):`, res.body);
    process.exit(1);
  }
  console.log('Authenticated.\n');
  return res.body.token;
}

// ─── Fetch all products ───────────────────────────────────────────────────────
async function fetchAllProducts(token) {
  console.log('Fetching product list from database...');
  const all = [];
  let page = 1;
  while (true) {
    const res = await fetchUrl(`${apiBase}/products?page=${page}&pageSize=100`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    let data;
    try { data = JSON.parse(res.body); } catch { break; }
    const items = data.items || [];
    all.push(...items);
    process.stdout.write(`  Page ${page} — ${all.length}/${data.totalCount || '?'}\r`);
    if (items.length < 100 || all.length >= (data.totalCount || 0)) break;
    page++;
  }
  console.log(`\nFetched ${all.length} products.\n`);
  return all;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  EGLO Kalog Image Importer');
  console.log(`  Source: ${SOURCE_DIR}`);
  console.log(`  Dest:   ${DEST_DIR}`);
  console.log(`  Mode:   ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`  DB update: ${NO_DB_UPDATE ? 'disabled' : 'enabled'}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // ── 1. Scan source images ─────────────────────────────────────────────────
  console.log('Scanning source images...');
  const allFiles = scanImages(SOURCE_DIR);
  console.log(`Found ${allFiles.length} image files.\n`);

  if (allFiles.length === 0) {
    console.error(`No images found in: ${SOURCE_DIR}`);
    process.exit(1);
  }

  // ── 2. Group by SKU ───────────────────────────────────────────────────────
  // skuMap: { [sku]: [ { filePath, type, index, ext }, … ] }
  const skuMap = {};
  const unparsed = [];

  for (const filePath of allFiles) {
    const parsed = parseFilename(filePath);
    if (!parsed) { unparsed.push(filePath); continue; }
    if (!skuMap[parsed.sku]) skuMap[parsed.sku] = [];
    skuMap[parsed.sku].push({ filePath, ...parsed });
  }

  const skus = Object.keys(skuMap).sort();
  console.log(`Grouped into ${skus.length} unique article numbers:`);
  for (const sku of skus) {
    const imgs = skuMap[sku];
    // Sort by type priority, then by index
    imgs.sort((a, b) => typePriority(a.type) - typePriority(b.type) || a.index - b.index);
    const summary = imgs.map(i => `${i.type}_${String(i.index).padStart(4, '0')}${i.ext}`).join(', ');
    console.log(`  ${sku}: ${imgs.length} image(s) → ${summary}`);
  }

  if (unparsed.length) {
    console.log(`\n  WARNING: ${unparsed.length} file(s) could not be parsed:`);
    unparsed.forEach(f => console.log(`    ${path.relative(SOURCE_DIR, f)}`));
  }

  // ── 3. Plan copy operations ───────────────────────────────────────────────
  console.log('\nPlanning copy operations...');
  // copyPlan: { [sku]: [ { src, destFilename, destPath, webPath, isPrimary } ] }
  const copyPlan = {};

  for (const sku of skus) {
    const imgs = skuMap[sku]; // already sorted by priority
    copyPlan[sku] = [];

    imgs.forEach((img, i) => {
      const isPrimary = i === 0;
      const destFilename = isPrimary ? `${sku}${img.ext}` : `${sku}_${i + 1}${img.ext}`;
      const destPath = path.join(DEST_DIR, destFilename);
      const webPath  = `/images/products/${destFilename}`;
      copyPlan[sku].push({ src: img.filePath, destFilename, destPath, webPath, isPrimary });
    });
  }

  // Print plan
  for (const sku of skus) {
    for (const op of copyPlan[sku]) {
      const tag = op.isPrimary ? '[PRIMARY]' : '[extra  ]';
      console.log(`  ${tag} ${path.basename(op.src)}  →  ${op.destFilename}`);
    }
  }

  if (DRY_RUN) {
    console.log('\nDRY RUN — no files copied, no DB updates.\n');
    return;
  }

  // ── 4. Copy files ─────────────────────────────────────────────────────────
  console.log('\nCopying images...');
  fs.mkdirSync(DEST_DIR, { recursive: true });

  const copyResults = {}; // { [sku]: { primaryWebPath, allWebPaths, errors } }

  for (const sku of skus) {
    copyResults[sku] = { primaryWebPath: null, allWebPaths: [], errors: [] };
    for (const op of copyPlan[sku]) {
      try {
        fs.copyFileSync(op.src, op.destPath);
        console.log(`  Copied: ${op.destFilename}`);
        copyResults[sku].allWebPaths.push(op.webPath);
        if (op.isPrimary) copyResults[sku].primaryWebPath = op.webPath;
      } catch (err) {
        console.error(`  ERROR copying ${op.destFilename}: ${err.message}`);
        copyResults[sku].errors.push(err.message);
      }
    }
  }

  // ── 5. Fetch products & match by SKU ─────────────────────────────────────
  let token = null;
  if (!NO_DB_UPDATE) {
    token = await login();
  }

  const products = NO_DB_UPDATE ? [] : await fetchAllProducts(token);

  // Build SKU → product map
  const skuToProduct = {};
  for (const p of products) {
    if (p.sku) skuToProduct[p.sku] = p;
  }

  // ── 6. Update DB & build SQL ──────────────────────────────────────────────
  const sqlLines = [
    '-- Generated by scripts/import-kalog-images.js',
    `-- Date: ${new Date().toISOString()}`,
    '',
  ];

  const results = [];
  const stats = {
    imagesFound:   allFiles.length,
    skusFound:     skus.length,
    imagesCopied:  0,
    productsMatched: 0,
    dbUpdated:     0,
    noMatch:       [],
  };

  // Count copied
  for (const sku of skus) {
    stats.imagesCopied += copyResults[sku].allWebPaths.length;
  }

  console.log('\nMatching to database products...');

  for (const sku of skus) {
    const cr      = copyResults[sku];
    const product = skuToProduct[sku];
    const result  = { sku, images: cr.allWebPaths, primaryImageUrl: cr.primaryWebPath };

    if (!product) {
      console.log(`  SKU ${sku} — no matching product in database`);
      stats.noMatch.push(sku);
      result.status = 'no_db_match';
      results.push(result);
      continue;
    }

    stats.productsMatched++;
    result.productId    = product.id;
    result.productTitle = product.title;

    // Always emit SQL (useful fallback)
    if (cr.primaryWebPath) {
      sqlLines.push(
        `UPDATE "Products" SET "ImageUrl" = '${cr.primaryWebPath}' WHERE "Id" = '${product.id}'; -- SKU ${sku} | ${product.title}`
      );
    }

    if (NO_DB_UPDATE || !cr.primaryWebPath) {
      result.status = NO_DB_UPDATE ? 'db_update_skipped' : 'no_image_copied';
      results.push(result);
      continue;
    }

    // PUT to API
    process.stdout.write(`  SKU ${sku} → updating product "${product.title}"...`);
    try {
      const putBody = {
        title:              product.title,
        sku:                product.sku,
        price:              product.price,
        imageUrl:           cr.primaryWebPath,
        categoryId:         product.categoryId    || null,
        subcategoryId:      product.subcategoryId || null,
        productDetailsJson: product.productDetailsJson || null,
        dimensionsJson:     product.dimensionsJson     || null,
        technicalInfoJson:  product.technicalInfoJson  || null,
        otherInfoJson:      product.otherInfoJson      || null,
      };
      const res = await apiRequest(`/products/${product.id}`, 'PUT', putBody, token);
      if (res.status >= 200 && res.status < 300) {
        process.stdout.write(` OK\n`);
        result.status = 'db_updated';
        stats.dbUpdated++;
      } else {
        process.stdout.write(` FAILED (HTTP ${res.status}): ${JSON.stringify(res.body)}\n`);
        result.status   = 'db_update_failed';
        result.dbError  = `HTTP ${res.status}`;
      }
    } catch (err) {
      process.stdout.write(` ERROR: ${err.message}\n`);
      result.status  = 'db_update_error';
      result.dbError = err.message;
    }

    results.push(result);
  }

  // ── 7. Write outputs ──────────────────────────────────────────────────────
  fs.writeFileSync(RESULTS_FILE, JSON.stringify({ stats, results }, null, 2));
  fs.writeFileSync(SQL_FILE, sqlLines.join('\n') + '\n');

  // ── 8. Summary ────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Source images found:     ${stats.imagesFound}`);
  console.log(`  Unique article numbers:  ${stats.skusFound}`);
  console.log(`  Images copied to /public/images/products/: ${stats.imagesCopied}`);
  console.log(`  Products matched in DB:  ${stats.productsMatched}`);
  console.log(`  DB records updated:      ${stats.dbUpdated}`);
  if (stats.noMatch.length) {
    console.log(`  SKUs with no DB match:   ${stats.noMatch.join(', ')}`);
  }
  console.log('');
  console.log(`  Results: ${RESULTS_FILE}`);
  console.log(`  SQL:     ${SQL_FILE}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
