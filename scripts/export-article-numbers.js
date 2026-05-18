#!/usr/bin/env node
/**
 * scripts/export-article-numbers.js
 *
 * Fetches all products from the database and exports a CSV with
 * article numbers (SKUs) and product names — ready to send to EGLO.
 *
 * Usage:
 *   node scripts/export-article-numbers.js [options]
 *
 * Options:
 *   --api-base URL    API base URL (default: http://localhost:3000/api)
 *   --email EMAIL     Admin email  (optional, for auth-protected endpoints)
 *   --password PASS   Admin password
 *   --out FILE        Output CSV path (default: scripts/article-numbers.csv)
 */

'use strict';

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const zlib  = require('zlib');

// ─── Config ───────────────────────────────────────────────────────────────────
const SCRIPT_DIR   = __dirname;
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');

const args = process.argv.slice(2);
let apiBase       = 'http://localhost:3000/api';
let adminEmail    = process.env.ADMIN_EMAIL    || '';
let adminPassword = process.env.ADMIN_PASSWORD || '';
let outFile       = path.join(SCRIPT_DIR, 'article-numbers.csv');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--api-base' && args[i + 1]) apiBase       = args[++i];
  if (args[i] === '--email'    && args[i + 1]) adminEmail    = args[++i];
  if (args[i] === '--password' && args[i + 1]) adminPassword = args[++i];
  if (args[i] === '--out'      && args[i + 1]) outFile       = path.resolve(args[++i]);
}

// Load .env.local if present
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

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function get(urlStr, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const lib    = parsed.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   'GET',
      headers:  { 'Content-Type': 'application/json', ...headers },
      timeout:  30000,
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
    req.end();
  });
}

function post(urlStr, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const body   = JSON.stringify(data);
    const parsed = new URL(urlStr);
    const lib    = parsed.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers },
      timeout:  30000,
    }, res => {
      const chunks = [];
      stream = res;
      stream.on('data', c => chunks.push(c));
      stream.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
      stream.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${urlStr}`)); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── CSV escape ───────────────────────────────────────────────────────────────
function csvCell(val) {
  const s = String(val ?? '');
  // Quote if contains comma, quote, or newline
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
function csvRow(...cells) {
  return cells.map(csvCell).join(',');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching products from', apiBase);

  // Optional login for auth-protected endpoints
  let authHeader = '';
  if (adminEmail && adminPassword) {
    process.stdout.write(`Authenticating as ${adminEmail}... `);
    const res = await post(`${apiBase}/auth/login`, { email: adminEmail, password: adminPassword });
    let body = {};
    try { body = JSON.parse(res.body); } catch {}
    if (res.status === 200 && body.token) {
      authHeader = `Bearer ${body.token}`;
      process.stdout.write('OK\n');
    } else {
      process.stdout.write(`failed (HTTP ${res.status}) — proceeding without auth\n`);
    }
  }

  const headers = authHeader ? { Authorization: authHeader } : {};

  // Paginate through all products
  const allProducts = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const url = `${apiBase}/products?page=${page}&pageSize=${pageSize}`;
    const res = await get(url, headers);
    let data;
    try { data = JSON.parse(res.body); } catch {
      console.error(`Failed to parse response on page ${page} (HTTP ${res.status})`);
      console.error(res.body.slice(0, 300));
      process.exit(1);
    }

    if (res.status !== 200) {
      console.error(`API error HTTP ${res.status} on page ${page}`);
      process.exit(1);
    }

    const items = data.items || [];
    if (items.length === 0) break;
    allProducts.push(...items);

    process.stdout.write(`  Fetched page ${page} — ${allProducts.length}/${data.totalCount || '?'} products\r`);

    if (allProducts.length >= (data.totalCount || 0) || items.length < pageSize) break;
    page++;
  }

  console.log(`\nTotal products fetched: ${allProducts.length}\n`);

  if (allProducts.length === 0) {
    console.error('No products returned. Is the dev server running at', apiBase, '?');
    process.exit(1);
  }

  // Deduplicate by SKU (keep first occurrence)
  const seen = new Set();
  const unique = [];
  for (const p of allProducts) {
    const sku = (p.sku || '').trim();
    if (!sku) continue;
    if (seen.has(sku)) continue;
    seen.add(sku);
    unique.push(p);
  }

  // Sort by SKU numerically
  unique.sort((a, b) => {
    const na = parseInt(a.sku, 10) || 0;
    const nb = parseInt(b.sku, 10) || 0;
    return na - nb || a.sku.localeCompare(b.sku);
  });

  console.log(`Unique article numbers: ${unique.length}`);

  // Build CSV
  const lines = [];
  lines.push(csvRow('Article Number', 'Product Name', 'Category', 'Price (MKD)', 'Has Image'));

  for (const p of unique) {
    const hasImage = p.imageUrl ? 'Yes' : 'No';
    lines.push(csvRow(
      p.sku,
      p.title || '',
      p.categoryName || p.category || '',
      p.price != null ? p.price : '',
      hasImage,
    ));
  }

  const csv = lines.join('\r\n') + '\r\n';
  fs.writeFileSync(outFile, csv, 'utf8');

  // Stats
  const withImage    = unique.filter(p => p.imageUrl).length;
  const withoutImage = unique.length - withImage;

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  DONE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Total products:        ${allProducts.length}`);
  console.log(`  Unique article numbers: ${unique.length}`);
  console.log(`  Already have images:   ${withImage}`);
  console.log(`  Missing images:        ${withoutImage}`);
  console.log(`\n  CSV saved to: ${outFile}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // Preview first 10 rows
  console.log('Preview (first 10 rows):');
  console.log(lines.slice(0, 11).join('\n'));
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
