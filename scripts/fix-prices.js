#!/usr/bin/env node
/**
 * scripts/fix-prices.js
 *
 * Fixes prices that were imported from the EGLO CENOVNIK with European number
 * formatting (period as thousands separator). E.g. "2.340" was stored as 2.34
 * instead of 2340.
 *
 * This script:
 *   1. Logs in with admin credentials
 *   2. Fetches all products
 *   3. Finds products with price < 100 MKD (clearly wrong — no lighting product costs < 100 MKD)
 *   4. Multiplies each price by 1000 and updates via PUT /api/products/:id
 *
 * Usage:
 *   node scripts/fix-prices.js --email admin@example.com --password yourpassword
 *   node scripts/fix-prices.js --email admin@example.com --password yourpassword --dry-run
 *   node scripts/fix-prices.js --email admin@example.com --password yourpassword --api-base http://localhost:5181/api
 *
 * Options:
 *   --email EMAIL       Admin email  (or env: ADMIN_EMAIL)
 *   --password PASS     Admin password (or env: ADMIN_PASSWORD)
 *   --api-base URL      API base URL (default: http://localhost:5181/api)
 *   --threshold N       Max price to fix, default 100 (products with price < N get ×1000)
 *   --dry-run           Show what would change without making any updates
 */

'use strict';

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const zlib  = require('zlib');

// ─── Config ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let apiBase    = 'http://localhost:5181/api';
let email      = process.env.ADMIN_EMAIL    || '';
let password   = process.env.ADMIN_PASSWORD || '';
let threshold  = 100;
let dryRun     = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--api-base'  && args[i+1]) apiBase   = args[++i];
  if (args[i] === '--email'     && args[i+1]) email     = args[++i];
  if (args[i] === '--password'  && args[i+1]) password  = args[++i];
  if (args[i] === '--threshold' && args[i+1]) threshold = parseFloat(args[++i]);
  if (args[i] === '--dry-run')                dryRun    = true;
}

// Load .env.local credentials if not provided
try {
  const env = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8');
  for (const line of env.split('\n')) {
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (k === 'ADMIN_EMAIL'    && !email)    email    = v;
    if (k === 'ADMIN_PASSWORD' && !password) password = v;
  }
} catch {}

if (!email || !password) {
  console.error('ERROR: --email and --password are required.');
  console.error('Usage: node scripts/fix-prices.js --email admin@example.com --password yourpassword');
  process.exit(1);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function request(method, urlStr, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const lib    = parsed.protocol === 'https:' ? https : http;
    const bodyStr = body ? JSON.stringify(body) : null;

    const req = lib.request({
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        ...headers,
      },
      timeout: 30000,
    }, res => {
      const chunks = [];
      let stream = res;
      if ((res.headers['content-encoding'] || '').includes('gzip'))
        stream = res.pipe(zlib.createGunzip());
      stream.on('data', c => chunks.push(c));
      stream.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
      stream.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${urlStr}`)); });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

const get  = (url, h) => request('GET',  url, null, h);
const post = (url, b, h) => request('POST', url, b, h);
const put  = (url, b, h) => request('PUT',  url, b, h);

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  EGLO Price Fix Script`);
  console.log(`  API: ${apiBase}`);
  console.log(`  Threshold: prices < ${threshold} MKD will be multiplied by 1000`);
  if (dryRun) console.log(`  MODE: DRY RUN — no changes will be made`);
  console.log(`${'═'.repeat(60)}\n`);

  // Step 1: Login
  process.stdout.write(`Authenticating as ${email}... `);
  const loginRes = await post(`${apiBase}/auth/login`, { email, password });
  let loginBody = {};
  try { loginBody = JSON.parse(loginRes.body); } catch {}

  if (loginRes.status !== 200 || !loginBody.token) {
    console.error(`FAILED (HTTP ${loginRes.status})`);
    console.error(loginRes.body.slice(0, 300));
    process.exit(1);
  }
  const token = loginBody.token;
  const authHeader = { Authorization: `Bearer ${token}` };
  console.log('OK');

  // Step 2: Fetch all products (paginated)
  console.log('\nFetching all products...');
  const allProducts = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const url = `${apiBase}/products?page=${page}&pageSize=${pageSize}`;
    const res = await get(url, authHeader);
    let data;
    try { data = JSON.parse(res.body); } catch {
      console.error(`Failed to parse page ${page} (HTTP ${res.status})`);
      process.exit(1);
    }
    if (res.status !== 200) {
      console.error(`API error HTTP ${res.status} on page ${page}`);
      process.exit(1);
    }
    const items = data.items || [];
    if (items.length === 0) break;
    allProducts.push(...items);
    process.stdout.write(`  Fetched ${allProducts.length}/${data.totalCount || '?'} products\r`);
    if (allProducts.length >= (data.totalCount || 0) || items.length < pageSize) break;
    page++;
  }
  console.log(`\nTotal products: ${allProducts.length}`);

  // Step 3: Identify wrong prices
  const toFix = allProducts.filter(p => typeof p.price === 'number' && p.price > 0 && p.price < threshold);
  console.log(`\nProducts with price < ${threshold} MKD (need fixing): ${toFix.length}`);

  if (toFix.length === 0) {
    console.log('Nothing to fix!');
    return;
  }

  // Show sample
  console.log('\nSample of products to fix (first 10):');
  toFix.slice(0, 10).forEach(p => {
    const corrected = Math.round(p.price * 1000);
    console.log(`  SKU ${String(p.sku || '').padEnd(8)} ${String(p.price).padEnd(10)} → ${corrected} ден.  ${(p.title || '').substring(0, 40)}`);
  });
  if (toFix.length > 10) console.log(`  ... and ${toFix.length - 10} more`);

  if (dryRun) {
    console.log(`\nDRY RUN: Would update ${toFix.length} products.`);
    console.log('Run without --dry-run to apply changes.');
    return;
  }

  // Step 4: Update prices
  console.log(`\nUpdating ${toFix.length} products...`);
  let success = 0;
  let failed  = 0;
  const errors = [];

  for (let i = 0; i < toFix.length; i++) {
    const p = toFix[i];
    const newPrice = Math.round(p.price * 1000);

    try {
      const res = await put(`${apiBase}/products/${p.id}`, {
        name:               p.title        || '',
        description:        p.sku          || '',
        price:              newPrice,
        categoryId:         p.categoryId   || null,
        productDetailsJson: p.productDetailsJson  || null,
        dimensionsJson:     p.dimensionsJson      || null,
        technicalInfoJson:  p.technicalInfoJson   || null,
        otherInfoJson:      p.otherInfoJson       || null,
      }, authHeader);

      if (res.status >= 200 && res.status < 300) {
        success++;
      } else {
        failed++;
        errors.push({ sku: p.sku, id: p.id, status: res.status, body: res.body.slice(0, 100) });
      }
    } catch (err) {
      failed++;
      errors.push({ sku: p.sku, id: p.id, error: err.message });
    }

    // Progress
    const pct = Math.round(((i + 1) / toFix.length) * 100);
    process.stdout.write(`  Progress: ${i + 1}/${toFix.length} (${pct}%) — ✓${success} ✗${failed}\r`);
  }

  // Step 5: Report
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log(`  DONE`);
  console.log(`  Updated successfully: ${success}`);
  console.log(`  Failed:               ${failed}`);
  console.log(`${'═'.repeat(60)}`);

  if (errors.length > 0) {
    console.log('\nFailed products:');
    errors.slice(0, 20).forEach(e => console.log(`  SKU ${e.sku} (${e.id}): ${e.status || e.error} ${e.body || ''}`));
  }

  // Save results
  const reportPath = path.join(__dirname, 'fix-prices-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ success, failed, errors, timestamp: new Date().toISOString() }, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
