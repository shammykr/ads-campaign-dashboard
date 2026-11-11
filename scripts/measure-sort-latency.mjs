#!/usr/bin/env node
/**
 * Measures sort interaction latency on the campaign table.
 *
 * Builds a production bundle with React's profiling build enabled
 * (`vite build --mode profile` → dist-profile/), boots the mock API
 * (200 campaigns, no artificial latency) and a `vite preview` server, opens the app in headless Chrome, then clicks each
 * sortable column header repeatedly with a real (CDP-dispatched) mouse click.
 *
 * Two numbers are recorded per click:
 *   - click → next paint: from the click event's timestamp until the frame
 *     after React commits (rAF + macrotask), i.e. what the user perceives.
 *   - React commit time: Profiler `actualDuration` for the table subtree.
 *
 * Usage:  npm run measure:sort
 *   CHROME_PATH=/path/to/chrome   override browser
 *   ROUNDS=5                      passes over all sortable columns
 *   CPU_THROTTLE=1,4              CPU slowdown factors to test
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import puppeteer from 'puppeteer-core';
import { build, preview } from 'vite';

const API_PORT = 4100;
const WEB_PORT = 4180;
const ROUNDS = Number(process.env.ROUNDS ?? 5);
const THROTTLES = (process.env.CPU_THROTTLE ?? '1,4').split(',').map(Number);
const CHROME_PATH =
  process.env.CHROME_PATH ??
  {
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    linux: '/usr/bin/google-chrome',
    win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  }[process.platform];

await build({ mode: 'profile', logLevel: 'warn' });

const stats = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { n: s.length, median: q(0.5), p95: q(0.95), max: s[s.length - 1] };
};
const fmt = (o) => `median ${o.median.toFixed(1)} ms · p95 ${o.p95.toFixed(1)} ms · max ${o.max.toFixed(1)} ms (n=${o.n})`;

const api = spawn(process.execPath, ['server/index.js'], {
  env: { ...process.env, PORT: String(API_PORT), API_LATENCY_MS: '0', CAMPAIGN_COUNT: '200' },
  stdio: 'ignore',
});
process.env.API_PORT = String(API_PORT); // read by vite.config.ts proxy
const server = await preview({
  mode: 'profile',
  build: { outDir: 'dist-profile' },
  preview: { port: WEB_PORT, strictPort: true },
  logLevel: 'silent',
});
await sleep(500);

const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true });
const results = [];
try {
  for (const throttle of THROTTLES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${WEB_PORT}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[role="row"][aria-rowindex="2"]');
    const rowCount = await page.$eval('[role="table"][aria-label="Campaigns"]', (t) => Number(t.getAttribute('aria-rowcount')) - 1);
    const domRows = await page.$$eval('[role="table"][aria-label="Campaigns"] [role="row"]', (r) => r.length - 1);

    // Record click → next paint for every header click.
    await page.evaluate(() => {
      window.__sortLatency = [];
      document.addEventListener(
        'click',
        (e) => {
          if (!e.target.closest('[data-sort-key]')) return;
          const start = e.timeStamp;
          const commitsBefore = window.__profilerSamples?.length ?? 0;
          requestAnimationFrame(() =>
            setTimeout(() => {
              const commits = (window.__profilerSamples ?? []).slice(commitsBefore);
              window.__sortLatency.push({
                toPaint: performance.now() - start,
                commit: commits.reduce((sum, c) => sum + c.actualDuration, 0),
              });
            }, 0),
          );
        },
        true,
      );
    });

    const cdp = await page.createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });

    const keys = await page.$$eval('[data-sort-key]', (els) => els.map((e) => e.dataset.sortKey));
    // Warm-up click (not recorded) so JIT/first-render costs don't skew results.
    await page.click(`[data-sort-key="${keys[0]}"]`);
    await sleep(300);
    await page.evaluate(() => (window.__sortLatency = []));

    for (let r = 0; r < ROUNDS; r++) {
      for (const key of keys) {
        for (let i = 0; i < 2; i++) {
          // asc then desc
          await page.click(`[data-sort-key="${key}"]`);
          await sleep(150);
        }
      }
    }
    const samples = await page.evaluate(() => window.__sortLatency);
    await page.close();

    const toPaint = stats(samples.map((s) => s.toPaint));
    const commit = stats(samples.map((s) => s.commit));
    results.push({ throttle, rowCount, domRows, toPaint, commit });
    console.log(`\nCPU throttle ${throttle}x — ${rowCount} campaigns (${domRows} rows in DOM, virtualized)`);
    console.log(`  click → next paint : ${fmt(toPaint)}`);
    console.log(`  React commit       : ${fmt(commit)}`);
  }
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
  api.kill();
}

const target = 200;
const worst = Math.max(...results.map((r) => r.toPaint.p95));
console.log(`\nTarget < ${target} ms (p95 click → paint): ${worst < target ? 'PASS' : 'FAIL'} (worst p95 ${worst.toFixed(1)} ms)`);
