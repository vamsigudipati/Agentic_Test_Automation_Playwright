#!/usr/bin/env node
// @ts-check
/**
 * Reliability runner
 *
 * Runs the Playwright suite N times with retries disabled, collects the
 * outcome and duration of every test in every run, and writes:
 *
 *   <out>/reliability.json   machine-readable results
 *   <out>/reliability.md     human-readable summary (pass rate, flaky tests,
 *                            p50 / p95 duration per test)
 *
 * Usage (from EAEmployeeWithTestSprite/tests):
 *
 *   node scripts/reliability.js [--runs 5] [--project chromium] [--grep <re>]
 *                               [--out ../../reports] [--start-app]
 *                               [--fail-on-flaky] [-- <extra playwright args>]
 *
 * Exit code is 1 when any test failed in every run (a consistently broken
 * test). With --fail-on-flaky it is also 1 when any test was flaky.
 *
 * No dependencies beyond Node and the locally installed @playwright/test.
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const TESTS_DIR = path.resolve(__dirname, '..');
const APP_DIR = path.resolve(TESTS_DIR, '..');
const DEFAULT_OUT = path.resolve(APP_DIR, '..', 'reports');

// ─── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const opts = {
    runs: 5,
    project: null,
    grep: null,
    out: DEFAULT_OUT,
    startApp: false,
    failOnFlaky: false,
    extra: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') { opts.extra = argv.slice(i + 1); break; }
    else if (a === '--runs' || a === '-n') opts.runs = parseInt(argv[++i], 10);
    else if (a.startsWith('--runs=')) opts.runs = parseInt(a.slice(7), 10);
    else if (a === '--project') opts.project = argv[++i];
    else if (a.startsWith('--project=')) opts.project = a.slice(10);
    else if (a === '--grep' || a === '-g') opts.grep = argv[++i];
    else if (a === '--out') opts.out = path.resolve(argv[++i]);
    else if (a.startsWith('--out=')) opts.out = path.resolve(a.slice(6));
    else if (a === '--start-app') opts.startApp = true;
    else if (a === '--fail-on-flaky') opts.failOnFlaky = true;
    else if (a === '--help' || a === '-h') { printHelp(); process.exit(0); }
    else { console.error(`Unknown argument: ${a}`); printHelp(); process.exit(2); }
  }
  if (!Number.isInteger(opts.runs) || opts.runs < 1) {
    console.error('--runs must be a positive integer');
    process.exit(2);
  }
  return opts;
}

function printHelp() {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(2, 22).join('\n'));
}

// ─── App lifecycle (optional) ────────────────────────────────────────────────

function httpOk(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => { res.resume(); resolve(res.statusCode && res.statusCode < 500); });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

async function waitFor(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await httpOk(url)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function startApp(logDir) {
  fs.mkdirSync(logDir, { recursive: true });
  const backendLog = fs.openSync(path.join(logDir, 'backend.log'), 'w');
  const frontendLog = fs.openSync(path.join(logDir, 'frontend.log'), 'w');
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const backend = spawn('node', ['server.js'], {
    cwd: path.join(APP_DIR, 'backend'), stdio: ['ignore', backendLog, backendLog], detached: true,
  });
  const frontend = spawn(npx, ['vite', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
    cwd: path.join(APP_DIR, 'frontend'), stdio: ['ignore', frontendLog, frontendLog], detached: true,
  });
  const procs = [backend, frontend];
  const stop = () => {
    for (const p of procs) {
      if (p.pid && !p.killed) {
        try { process.kill(-p.pid, 'SIGTERM'); } catch (_) { try { p.kill('SIGTERM'); } catch (__) { /* gone */ } }
      }
    }
  };
  return { stop };
}

// ─── Single Playwright run ───────────────────────────────────────────────────

function runPlaywright(runIndex, opts, jsonFile) {
  const args = ['playwright', 'test', '--retries=0', '--reporter=json'];
  if (opts.project) args.push(`--project=${opts.project}`);
  if (opts.grep) args.push(`--grep=${opts.grep}`);
  args.push(...opts.extra);
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const started = Date.now();
  const res = spawnSync(npx, args, {
    cwd: TESTS_DIR,
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: jsonFile, RELIABILITY_RUN: String(runIndex) },
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
  const wall = Date.now() - started;
  if (!fs.existsSync(jsonFile)) {
    console.error(res.stdout?.toString() || '');
    console.error(res.stderr?.toString() || '');
    throw new Error(`Run ${runIndex}: Playwright produced no JSON report (exit ${res.status})`);
  }
  return { report: JSON.parse(fs.readFileSync(jsonFile, 'utf8')), exitCode: res.status, wallMs: wall };
}

/** Flatten a Playwright JSON report into [{ id, file, line, title, project, status, durationMs }]. */
function collect(report) {
  const rows = [];
  const walk = (suite, titles) => {
    const chain = suite.title && suite.file !== suite.title ? [...titles, suite.title] : titles;
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        const result = t.results && t.results[t.results.length - 1];
        const status = t.status === 'skipped' ? 'skipped' : (t.status === 'expected' ? 'passed' : 'failed');
        rows.push({
          id: `${t.projectName} › ${spec.file}:${spec.line} › ${[...chain, spec.title].join(' › ')}`,
          file: spec.file,
          line: spec.line,
          title: [...chain, spec.title].join(' › '),
          project: t.projectName,
          status,
          durationMs: result ? result.duration : 0,
          error: status === 'failed' && result && result.error ? String(result.error.message || '').split('\n')[0].slice(0, 300) : undefined,
        });
      }
    }
    for (const child of suite.suites || []) walk(child, chain);
  };
  for (const s of report.suites || []) walk(s, []);
  return rows;
}

// ─── Statistics ──────────────────────────────────────────────────────────────

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length); // nearest-rank
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1];
}

function summarise(runs, opts) {
  /** @type {Map<string, any>} */
  const byTest = new Map();
  for (const run of runs) {
    for (const r of run.rows) {
      let t = byTest.get(r.id);
      if (!t) {
        t = { id: r.id, file: r.file, line: r.line, title: r.title, project: r.project,
              runs: 0, passed: 0, failed: 0, skipped: 0, durations: [], outcomes: [], errors: [] };
        byTest.set(r.id, t);
      }
      t.runs++;
      t[r.status]++;
      t.outcomes.push(r.status === 'passed' ? 'P' : r.status === 'failed' ? 'F' : 'S');
      if (r.status !== 'skipped') t.durations.push(r.durationMs);
      if (r.error && !t.errors.includes(r.error)) t.errors.push(r.error);
    }
  }

  const tests = [...byTest.values()].map((t) => {
    const executed = t.passed + t.failed;
    const classification =
      executed === 0 ? 'skipped'
      : t.failed === 0 ? 'stable'
      : t.passed === 0 ? 'failing'
      : 'flaky';
    return {
      id: t.id, file: t.file, line: t.line, title: t.title, project: t.project,
      runs: t.runs, passed: t.passed, failed: t.failed, skipped: t.skipped,
      passRate: executed ? +(t.passed / executed * 100).toFixed(1) : null,
      classification,
      outcomes: t.outcomes.join(''),
      p50Ms: Math.round(percentile(t.durations, 50)),
      p95Ms: Math.round(percentile(t.durations, 95)),
      minMs: t.durations.length ? Math.min(...t.durations) : 0,
      maxMs: t.durations.length ? Math.max(...t.durations) : 0,
      errors: t.errors,
    };
  }).sort((a, b) => (a.passRate ?? 101) - (b.passRate ?? 101) || b.p95Ms - a.p95Ms || a.id.localeCompare(b.id));

  const executions = tests.reduce((n, t) => n + t.passed + t.failed, 0);
  const passedExecutions = tests.reduce((n, t) => n + t.passed, 0);
  const runWalls = runs.map((r) => r.wallMs);

  return {
    generatedAt: new Date().toISOString(),
    command: `node scripts/reliability.js ${process.argv.slice(2).join(' ')}`.trim(),
    environment: {
      node: process.version,
      playwright: playwrightVersion(),
      os: `${os.platform()} ${os.release()} (${os.arch()})`,
      ci: !!process.env.CI,
      project: opts.project || 'all',
      retries: 0,
    },
    summary: {
      runs: runs.length,
      tests: tests.length,
      executions,
      passedExecutions,
      failedExecutions: executions - passedExecutions,
      passRate: executions ? +(passedExecutions / executions * 100).toFixed(2) : null,
      stable: tests.filter((t) => t.classification === 'stable').length,
      flaky: tests.filter((t) => t.classification === 'flaky').length,
      failing: tests.filter((t) => t.classification === 'failing').length,
      skipped: tests.filter((t) => t.classification === 'skipped').length,
      fullyGreenRuns: runs.filter((r) => r.rows.every((x) => x.status !== 'failed')).length,
      runDurationMs: { p50: Math.round(percentile(runWalls, 50)), p95: Math.round(percentile(runWalls, 95)),
                       min: Math.min(...runWalls), max: Math.max(...runWalls) },
    },
    runs: runs.map((r) => ({
      run: r.run, wallMs: r.wallMs, exitCode: r.exitCode,
      passed: r.rows.filter((x) => x.status === 'passed').length,
      failed: r.rows.filter((x) => x.status === 'failed').length,
      skipped: r.rows.filter((x) => x.status === 'skipped').length,
    })),
    tests,
  };
}

function playwrightVersion() {
  try { return require('@playwright/test/package.json').version; } catch (_) { return 'unknown'; }
}

// ─── Markdown ────────────────────────────────────────────────────────────────

const fmtMs = (ms) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`);
const esc = (s) => String(s).replace(/\|/g, '\\|');

function toMarkdown(data) {
  const s = data.summary;
  const lines = [];
  lines.push('# Reliability report');
  lines.push('');
  lines.push(`Generated ${data.generatedAt} · Playwright ${data.environment.playwright} · Node ${data.environment.node} · ${data.environment.os}${data.environment.ci ? ' · CI' : ''}`);
  lines.push('');
  lines.push('```');
  lines.push(data.command);
  lines.push('```');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|---|---|');
  lines.push(`| Runs | ${s.runs} (project: ${data.environment.project}, retries: 0) |`);
  lines.push(`| Tests per run | ${s.tests} |`);
  lines.push(`| Test executions | ${s.executions} (${s.passedExecutions} passed, ${s.failedExecutions} failed) |`);
  lines.push(`| **Pass rate** | **${s.passRate ?? 'n/a'}%** |`);
  lines.push(`| Stable tests (passed every run) | ${s.stable} |`);
  lines.push(`| Flaky tests (passed and failed) | ${s.flaky} |`);
  lines.push(`| Failing tests (failed every run) | ${s.failing} |`);
  lines.push(`| Skipped tests | ${s.skipped} |`);
  lines.push(`| Fully green runs | ${s.fullyGreenRuns} / ${s.runs} |`);
  lines.push(`| Suite duration p50 / p95 | ${fmtMs(s.runDurationMs.p50)} / ${fmtMs(s.runDurationMs.p95)} |`);
  lines.push('');
  lines.push('## Runs');
  lines.push('');
  lines.push('| Run | Passed | Failed | Skipped | Duration |');
  lines.push('|---|---|---|---|---|');
  for (const r of data.runs) lines.push(`| ${r.run} | ${r.passed} | ${r.failed} | ${r.skipped} | ${fmtMs(r.wallMs)} |`);
  lines.push('');

  const flaky = data.tests.filter((t) => t.classification === 'flaky');
  lines.push('## Flaky tests');
  lines.push('');
  if (!flaky.length) lines.push('None. Every test produced the same outcome in all runs.');
  else {
    lines.push('| Test | Project | Outcomes | Pass rate | p50 | p95 | Last error |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const t of flaky) lines.push(`| ${esc(t.file)}:${t.line} ${esc(t.title)} | ${t.project} | \`${t.outcomes}\` | ${t.passRate}% | ${fmtMs(t.p50Ms)} | ${fmtMs(t.p95Ms)} | ${esc(t.errors[0] || '')} |`);
  }
  lines.push('');

  const failing = data.tests.filter((t) => t.classification === 'failing');
  lines.push('## Consistently failing tests');
  lines.push('');
  if (!failing.length) lines.push('None.');
  else {
    lines.push('| Test | Project | Error |');
    lines.push('|---|---|---|');
    for (const t of failing) lines.push(`| ${esc(t.file)}:${t.line} ${esc(t.title)} | ${t.project} | ${esc(t.errors[0] || '')} |`);
  }
  lines.push('');

  lines.push('## Per-test statistics');
  lines.push('');
  lines.push('Outcomes are one letter per run: `P` passed, `F` failed, `S` skipped. Durations are per attempt (nearest-rank percentiles).');
  lines.push('');
  lines.push('| Test | Project | Outcomes | Pass rate | p50 | p95 | Status |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const t of data.tests) {
    lines.push(`| ${esc(t.file)}:${t.line} ${esc(t.title)} | ${t.project} | \`${t.outcomes}\` | ${t.passRate ?? 'n/a'}% | ${fmtMs(t.p50Ms)} | ${fmtMs(t.p95Ms)} | ${t.classification} |`);
  }
  lines.push('');
  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  fs.mkdirSync(opts.out, { recursive: true });
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reliability-'));

  let app = null;
  if (opts.startApp) {
    console.log('Starting backend (4000) and frontend (5173)…');
    app = startApp(path.join(opts.out, 'logs'));
    const ok = (await waitFor('http://localhost:4000/employees', 60000)) && (await waitFor('http://localhost:5173/', 60000));
    if (!ok) { app.stop(); throw new Error('App did not become healthy within 60s; see reports/logs'); }
    console.log('App is up.');
  }

  const runs = [];
  try {
    for (let i = 1; i <= opts.runs; i++) {
      process.stdout.write(`Run ${i}/${opts.runs}… `);
      const jsonFile = path.join(workDir, `run-${i}.json`);
      const { report, exitCode, wallMs } = runPlaywright(i, opts, jsonFile);
      const rows = collect(report);
      const passed = rows.filter((r) => r.status === 'passed').length;
      const failed = rows.filter((r) => r.status === 'failed').length;
      console.log(`${passed} passed, ${failed} failed, ${rows.length - passed - failed} skipped in ${fmtMs(wallMs)} (exit ${exitCode})`);
      runs.push({ run: i, rows, exitCode, wallMs });
    }
  } finally {
    if (app) app.stop();
  }

  const data = summarise(runs, opts);
  fs.writeFileSync(path.join(opts.out, 'reliability.json'), JSON.stringify(data, null, 2));
  fs.writeFileSync(path.join(opts.out, 'reliability.md'), toMarkdown(data));

  const s = data.summary;
  console.log('');
  console.log(`Pass rate ${s.passRate}% over ${s.executions} executions · stable ${s.stable} · flaky ${s.flaky} · failing ${s.failing}`);
  console.log(`Suite duration p50 ${fmtMs(s.runDurationMs.p50)} · p95 ${fmtMs(s.runDurationMs.p95)}`);
  console.log(`Wrote ${path.join(opts.out, 'reliability.json')} and reliability.md`);

  if (s.failing > 0) process.exitCode = 1;
  if (opts.failOnFlaky && s.flaky > 0) process.exitCode = 1;
}

main().catch((err) => { console.error(err.message || err); process.exit(1); });
