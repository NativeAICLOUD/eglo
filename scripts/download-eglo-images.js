#!/usr/bin/env node
/**
 * scripts/download-eglo-images.js
 *
 * Downloads product images from eglo.com/ko/ for all products in the database,
 * saves them to /public/images/products/[sku].jpg, and updates the database.
 *
 * Usage:
 *   node scripts/download-eglo-images.js [options]
 *
 * Options:
 *   --test            Process only the first 5 products
 *   --skip-existing   Skip products that already have a local image file
 *   --no-db-update    Download images but don't update the database
 *   --api-base URL    Next.js API base URL (default: http://localhost:3000/api)
 *   --email EMAIL     Admin email  (or env: ADMIN_EMAIL)
 *   --password PASS   Admin pass   (or env: ADMIN_PASSWORD)
 *
 * Outputs:
 *   scripts/image-download-results.json  — full per-product report
 *   scripts/update-image-urls.sql        — fallback SQL UPDATE statements
 */

'use strict';

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const zlib  = require('zlib');

// ─── Paths ────────────────────────────────────────────────────────────────────
const SCRIPT_DIR       = __dirname;
const PROJECT_ROOT     = path.resolve(SCRIPT_DIR, '..');
const PUBLIC_IMGS_DIR  = path.join(PROJECT_ROOT, 'public', 'images', 'products');
const RESULTS_FILE     = path.join(SCRIPT_DIR, 'image-download-results.json');
const SQL_FILE         = path.join(SCRIPT_DIR, 'update-image-urls.sql');

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args         = process.argv.slice(2);
const TEST_MODE    = args.includes('--test');
const SKIP_EXISTING = args.includes('--skip-existing');
const NO_DB_UPDATE = args.includes('--no-db-update');

let apiBase       = 'http://localhost:3000/api';
let adminEmail    = process.env.ADMIN_EMAIL    || '';
let adminPassword = process.env.ADMIN_PASSWORD || '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--api-base' && args[i + 1]) apiBase       = args[++i];
  if (args[i] === '--email'    && args[i + 1]) adminEmail    = args[++i];
  if (args[i] === '--password' && args[i + 1]) adminPassword = args[++i];
}

// Fall back to .env.local if credentials still missing
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));
const DELAY = 1500; // ms between EGLO requests

/** Fetch a URL, following up to `maxRedirects` redirects, return { status, body, finalUrl }. */
function fetchUrl(urlStr, opts = {}, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const lib    = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   opts.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EgloImageBot/1.0)',
        'Accept':     'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        ...( opts.headers || {} ),
      },
      timeout: 30000,
    };

    const req = lib.request(options, res => {
      // Handle redirects
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && maxRedirects > 0) {
        const nextUrl = new URL(res.headers.location, urlStr).toString();
        res.resume();
        return fetchUrl(nextUrl, opts, maxRedirects - 1).then(resolve).catch(reject);
      }

      // Handle gzip / deflate
      const chunks = [];
      let stream = res;
      const ce = res.headers['content-encoding'] || '';
      if (ce.includes('gzip'))    stream = res.pipe(zlib.createGunzip());
      else if (ce.includes('deflate')) stream = res.pipe(zlib.createInflate());

      stream.on('data', c => chunks.push(c));
      stream.on('end',  () => resolve({
        status:   res.statusCode,
        body:     Buffer.concat(chunks).toString('utf8'),
        finalUrl: urlStr,
      }));
      stream.on('error', reject);
    });

    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${urlStr}`)); });
    req.on('error', reject);

    if (opts.body) req.write(opts.body);
    req.end();
  });
}

/** Download binary content (image) from URL and save to filePath. */
function downloadBinary(urlStr, filePath) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const lib    = parsed.protocol === 'https:' ? https : http;

    function doRequest(currentUrl, redirects) {
      const p = new URL(currentUrl);
      const req = lib.request({
        hostname: p.hostname,
        port:     p.port || (p.protocol === 'https:' ? 443 : 80),
        path:     p.pathname + p.search,
        method:   'GET',
        headers:  { 'User-Agent': 'Mozilla/5.0 (compatible; EgloImageBot/1.0)' },
        timeout:  30000,
      }, res => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
          res.resume();
          return doRequest(new URL(res.headers.location, currentUrl).toString(), redirects - 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} downloading ${currentUrl}`));
        }

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        const out = fs.createWriteStream(filePath);

        // handle gzip
        const ce = res.headers['content-encoding'] || '';
        let stream = res;
        if (ce.includes('gzip')) stream = res.pipe(zlib.createGunzip());

        stream.pipe(out);
        out.on('finish', () => resolve(filePath));
        out.on('error', reject);
        stream.on('error', reject);
      });
      req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout downloading ${currentUrl}`)); });
      req.on('error', reject);
      req.end();
    }

    doRequest(urlStr, 5);
  });
}

/** POST/PUT JSON to our API. Returns { status, body }. */
async function apiRequest(endpoint, method, data, token) {
  const body = JSON.stringify(data);
  const url  = `${apiBase}${endpoint}`;
  const res  = await fetchUrl(url, {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Content-Length': Buffer.byteLength(body),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body,
  });
  let parsed = {};
  try { parsed = JSON.parse(res.body); } catch {}
  return { status: res.status, body: parsed };
}

// ─── Step 1: Authenticate ────────────────────────────────────────────────────
async function login() {
  if (!adminEmail || !adminPassword) {
    console.error('\nAdmin credentials required. Provide via:');
    console.error('  --email EMAIL --password PASS');
    console.error('  or ADMIN_EMAIL / ADMIN_PASSWORD env vars');
    console.error('  or ADMIN_EMAIL / ADMIN_PASSWORD in .env.local\n');
    process.exit(1);
  }

  console.log(`Authenticating as ${adminEmail}...`);
  const res = await apiRequest('/auth/login', 'POST', {
    email: adminEmail,
    password: adminPassword,
  });

  if (res.status !== 200 || !res.body.token) {
    console.error(`Login failed (HTTP ${res.status}):`, res.body);
    process.exit(1);
  }

  console.log('Authenticated successfully.\n');
  return res.body.token;
}

// ─── Step 2: Fetch all products ───────────────────────────────────────────────
async function fetchAllProducts(token) {
  console.log('Fetching product list from database...');
  const allProducts = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const url = `${apiBase}/products?page=${page}&pageSize=${pageSize}`;
    const res = await fetchUrl(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });

    let data;
    try { data = JSON.parse(res.body); } catch {
      console.error('Failed to parse product list response');
      break;
    }

    const items = data.items || [];
    allProducts.push(...items);

    process.stdout.write(`  Page ${page}/${Math.ceil((data.totalCount || 0) / pageSize)} — ${allProducts.length}/${data.totalCount || '?'} products\r`);

    if (items.length < pageSize || allProducts.length >= (data.totalCount || 0)) break;
    page++;
  }

  console.log(`\nFetched ${allProducts.length} products total.\n`);
  return allProducts;
}

// ─── Step 3: Build EGLO Kosovo sitemap URL index ──────────────────────────────
/**
 * Tries to parse a sitemap (or sitemap index) and return all product page URLs
 * from eglo.com/ko/ that match the pattern /ko/...-DIGITS.html
 *
 * Returns a Map<sku, url>
 */
async function buildSitemapIndex() {
  const skuToUrl = new Map();
  const PRODUCT_URL_RE = /\/ko\/[^"<\s]+-(\d{4,7})\.html$/;

  async function parseXmlUrls(xmlBody) {
    // Extract all <loc>...</loc> entries
    const locs = [];
    const locRe = /<loc>([^<]+)<\/loc>/g;
    let m;
    while ((m = locRe.exec(xmlBody)) !== null) {
      locs.push(m[1].trim());
    }
    return locs;
  }

  async function processSitemap(url, depth = 0) {
    if (depth > 3) return;
    let body;
    try {
      console.log(`  Fetching sitemap: ${url}`);
      const res = await fetchUrl(url);
      if (res.status !== 200) {
        console.warn(`  ⚠ Sitemap HTTP ${res.status}: ${url}`);
        return;
      }
      body = res.body;
    } catch (err) {
      console.warn(`  ⚠ Sitemap fetch error: ${err.message}`);
      return;
    }

    const locs = await parseXmlUrls(body);
    const isSitemapIndex = body.includes('<sitemapindex');

    if (isSitemapIndex) {
      // It's an index — recurse into each sub-sitemap
      console.log(`  Sitemap index with ${locs.length} sub-sitemaps`);
      for (const subUrl of locs) {
        // Only process Kosovo-specific sitemaps or product-type sitemaps
        if (subUrl.includes('/ko/') || subUrl.includes('product')) {
          await processSitemap(subUrl, depth + 1);
          await sleep(500);
        }
      }
    } else {
      // It's a URL list — filter for Kosovo product URLs
      let found = 0;
      for (const loc of locs) {
        const match = loc.match(PRODUCT_URL_RE);
        if (match) {
          const sku = match[1];
          if (!skuToUrl.has(sku)) {
            skuToUrl.set(sku, loc);
            found++;
          }
        }
      }
      if (found > 0) console.log(`  Found ${found} product URLs (total: ${skuToUrl.size})`);
    }
  }

  // Try Kosovo-specific sitemap first, then fall back to main sitemap
  const sitemapCandidates = [
    'https://www.eglo.com/ko/sitemap.xml',
    'https://www.eglo.com/sitemap.xml',
  ];

  for (const candidate of sitemapCandidates) {
    await processSitemap(candidate);
    if (skuToUrl.size > 0) break;
    await sleep(DELAY);
  }

  console.log(`Sitemap index built: ${skuToUrl.size} Kosovo product URLs found.\n`);
  return skuToUrl;
}

// ─── Step 4: Search EGLO Kosovo for a SKU (fallback) ─────────────────────────
async function searchForSku(sku) {
  const searchUrl = `https://www.eglo.com/ko/catalogsearch/result/?q=${encodeURIComponent(sku)}`;
  try {
    const res = await fetchUrl(searchUrl);
    if (res.status !== 200) return null;

    // Look for a product link matching the SKU
    const PRODUCT_URL_RE = new RegExp(`/ko/[^"\\s]+-${sku}\\.html`, 'i');
    const match = res.body.match(PRODUCT_URL_RE);
    if (match) {
      return `https://www.eglo.com${match[0]}`;
    }

    // Broader: find any /ko/...-DIGITS.html link in the search results
    const linkRe = /href="(https:\/\/www\.eglo\.com\/ko\/[^"]+\.html)"/g;
    let m;
    while ((m = linkRe.exec(res.body)) !== null) {
      if (m[1].includes(sku)) return m[1];
    }
  } catch {}
  return null;
}

// ─── Step 5: Extract og:image from a product page ────────────────────────────
async function extractOgImage(pageUrl) {
  const res = await fetchUrl(pageUrl);
  if (res.status !== 200) return null;

  const ogMatch = res.body.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || res.body.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

  return ogMatch ? ogMatch[1].trim() : null;
}

// ─── Step 6: Update product in DB ────────────────────────────────────────────
async function updateProductImageUrl(product, imageUrl, token) {
  // Build PUT body — include all fields the backend might need
  const putBody = {
    title:              product.title,
    sku:                product.sku,
    price:              product.price,
    imageUrl:           imageUrl,
    categoryId:         product.categoryId || null,
    subcategoryId:      product.subcategoryId || null,
    productDetailsJson: product.productDetailsJson || null,
    dimensionsJson:     product.dimensionsJson || null,
    technicalInfoJson:  product.technicalInfoJson || null,
    otherInfoJson:      product.otherInfoJson || null,
  };

  const res = await apiRequest(`/products/${product.id}`, 'PUT', putBody, token);
  return res;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  EGLO Kosovo Image Downloader');
  console.log(`  Mode: ${TEST_MODE ? 'TEST (5 products)' : 'FULL'}`);
  console.log(`  API:  ${apiBase}`);
  console.log(`  Skip existing: ${SKIP_EXISTING}`);
  console.log(`  DB update:     ${NO_DB_UPDATE ? 'disabled' : 'enabled'}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // Ensure output directory exists
  fs.mkdirSync(PUBLIC_IMGS_DIR, { recursive: true });

  // Step 1: Login
  const token = await login();

  // Step 2: Fetch all products
  let products = await fetchAllProducts(token);

  if (TEST_MODE) {
    products = products.slice(0, 5);
    console.log(`TEST MODE: processing ${products.length} products.\n`);
  }

  // Step 3: Build sitemap index
  console.log('Building EGLO Kosovo sitemap index...');
  const skuToUrl = await buildSitemapIndex();

  // ── Process each product ──────────────────────────────────────────────────
  const results = [];
  const sqlLines = [
    '-- Generated by scripts/download-eglo-images.js',
    `-- Date: ${new Date().toISOString()}`,
    '',
  ];

  const stats = { total: 0, downloaded: 0, dbUpdated: 0, skipped: 0, failed: 0, notFound: 0 };
  stats.total = products.length;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const sku     = product.sku;
    const label   = `[${i + 1}/${products.length}] SKU ${sku}`;

    const result = {
      id:       product.id,
      sku,
      title:    product.title,
      status:   'pending',
      imageUrl: null,
      localPath: null,
      error:    null,
    };

    // Check if we should skip
    const localImagePath = path.join(PUBLIC_IMGS_DIR, `${sku}.jpg`);
    const localImageUrl  = `/images/products/${sku}.jpg`;

    if (SKIP_EXISTING && fs.existsSync(localImagePath)) {
      console.log(`${label} — SKIP (file exists)`);
      result.status   = 'skipped';
      result.localPath = localImageUrl;
      stats.skipped++;
      results.push(result);
      continue;
    }

    try {
      // Step 3a: Find the product page URL
      let pageUrl = skuToUrl.get(sku) || null;

      if (!pageUrl) {
        process.stdout.write(`${label} — not in sitemap, searching...`);
        await sleep(DELAY);
        pageUrl = await searchForSku(sku);
        if (pageUrl) {
          process.stdout.write(` found.\n`);
        } else {
          process.stdout.write(` NOT FOUND.\n`);
          result.status = 'not_found';
          stats.notFound++;
          results.push(result);
          continue;
        }
      } else {
        process.stdout.write(`${label} — sitemap hit: ${pageUrl}\n`);
      }

      result.pageUrl = pageUrl;
      await sleep(DELAY);

      // Step 3b: Extract og:image from the product page
      process.stdout.write(`  Extracting og:image...`);
      const ogImageUrl = await extractOgImage(pageUrl);
      if (!ogImageUrl) {
        process.stdout.write(` no og:image found.\n`);
        result.status = 'no_image';
        stats.failed++;
        results.push(result);
        continue;
      }
      process.stdout.write(` ${ogImageUrl}\n`);
      result.imageUrl = ogImageUrl;

      await sleep(DELAY);

      // Step 3c: Download the image
      process.stdout.write(`  Downloading image...`);
      try {
        await downloadBinary(ogImageUrl, localImagePath);
        process.stdout.write(` saved to ${localImageUrl}\n`);
        result.localPath = localImageUrl;
        result.status    = 'downloaded';
        stats.downloaded++;
      } catch (dlErr) {
        process.stdout.write(` FAILED: ${dlErr.message}\n`);
        result.status = 'download_failed';
        result.error  = dlErr.message;
        stats.failed++;
        results.push(result);
        continue;
      }

      // Step 3d: Update the database
      sqlLines.push(
        `UPDATE "Products" SET "ImageUrl" = '${localImageUrl}' WHERE "Id" = '${product.id}'; -- SKU ${sku}`
      );

      if (!NO_DB_UPDATE) {
        process.stdout.write(`  Updating database...`);
        try {
          const updateRes = await updateProductImageUrl(product, localImageUrl, token);
          if (updateRes.status >= 200 && updateRes.status < 300) {
            process.stdout.write(` OK (HTTP ${updateRes.status})\n`);
            result.dbUpdated = true;
            stats.dbUpdated++;
          } else {
            process.stdout.write(` FAILED (HTTP ${updateRes.status}): ${JSON.stringify(updateRes.body)}\n`);
            result.dbUpdated = false;
            result.dbError   = `HTTP ${updateRes.status}`;
          }
        } catch (dbErr) {
          process.stdout.write(` ERROR: ${dbErr.message}\n`);
          result.dbUpdated = false;
          result.dbError   = dbErr.message;
        }
      }

    } catch (err) {
      console.error(`${label} — ERROR: ${err.message}`);
      result.status = 'error';
      result.error  = err.message;
      stats.failed++;
    }

    results.push(result);

    // Brief pause between products (already delayed per-request above, but add
    // a small extra pause to be polite overall)
    if (i < products.length - 1) await sleep(300);
  }

  // ── Write outputs ─────────────────────────────────────────────────────────
  fs.writeFileSync(RESULTS_FILE, JSON.stringify({ stats, results }, null, 2));
  fs.writeFileSync(SQL_FILE, sqlLines.join('\n') + '\n');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  DONE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Total products:   ${stats.total}`);
  console.log(`  Images downloaded: ${stats.downloaded}`);
  console.log(`  DB updated:       ${stats.dbUpdated}`);
  console.log(`  Skipped:          ${stats.skipped}`);
  console.log(`  Not found:        ${stats.notFound}`);
  console.log(`  Failed:           ${stats.failed}`);
  console.log('');
  console.log(`  Results: ${RESULTS_FILE}`);
  console.log(`  SQL:     ${SQL_FILE}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
