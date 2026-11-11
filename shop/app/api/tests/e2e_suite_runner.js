#!/usr/bin/env node

/**
 * Master E2E Test Suite Runner
 * Executes all test suites across Tiers 1-4 for all 21 features in Shop Huy Tutor.
 */

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const suites = [
  {
    name: 'r2Service.test.ts',
    file: path.join(__dirname, 'r2Service.test.ts'),
    features: 'F1, F2, F3, F4, F9',
    description: 'R2 naming, monotonic sequence, date parsing, folder sanitizing',
  },
  {
    name: 'adminMediaRoutes.test.ts',
    file: path.join(__dirname, 'adminMediaRoutes.test.ts'),
    features: 'F5, F6, F7, F8',
    description: 'GET media, POST upload, POST check-usage, POST delete',
  },
  {
    name: 'isolatedHtmlSanitizer.test.ts',
    file: path.join(__dirname, 'isolatedHtmlSanitizer.test.ts'),
    features: 'F12',
    description: 'HTML sanitization, script stripping, event handlers, container modes',
  },
  {
    name: 'cmsContract.test.ts',
    file: path.join(__dirname, 'cmsContract.test.ts'),
    features: 'F15, F16, F17, F18, F19, F20',
    description: '5 CMS builders schema validation, 9 utility pages 3 render modes',
  },
  {
    name: 'responsiveCssEncapsulation.test.ts',
    file: path.join(__dirname, 'responsiveCssEncapsulation.test.ts'),
    features: 'F13, F19',
    description: 'Responsive viewports, editor Tab indent, Shadow DOM CSS isolation',
  },
  {
    name: 'rbacAndSecurity.test.ts',
    file: path.join(__dirname, 'rbacAndSecurity.test.ts'),
    features: 'F5, F10, F21',
    description: 'Strict Shop RBAC perimeter attack & dual-standard error sanitization',
  },
  {
    name: 'crossFeatureE2E.test.ts',
    file: path.join(__dirname, 'crossFeatureE2E.test.ts'),
    features: 'Tiers 3 & 4 (All F1-F21)',
    description: '8 cross-feature integration pipelines + 7 real-world E2E scenarios',
  },
  {
    name: 'geminiRules.test.ts',
    file: path.join(__dirname, 'geminiRules.test.ts'),
    features: 'F21',
    description: 'Static GEMINI.md compliance (zero hardcoding, prefixes, fallbacks)',
  },
];

console.log('========================================================================');
console.log('  HUY TUTOR SHOP - COMPREHENSIVE 4-TIER E2E TEST SUITE RUNNER');
console.log('========================================================================\n');

let totalSuites = suites.length;
let passedSuites = 0;
let failedSuites = 0;
const results = [];

const overallStart = Date.now();

for (const suite of suites) {
  process.stdout.write(`▶ Running suite: ${suite.name} ... `);
  const start = Date.now();

  const run = spawnSync(process.execPath, ['--no-warnings', '--test', suite.file], {
    encoding: 'utf-8',
    env: { ...process.env, NODE_ENV: 'test' },
  });

  const duration = Date.now() - start;

  if (run.status === 0) {
    passedSuites++;
    console.log(`✔ PASSED (${duration}ms)`);
    results.push({
      name: suite.name,
      features: suite.features,
      status: 'PASS',
      duration: `${duration}ms`,
    });
  } else {
    failedSuites++;
    console.log(`✖ FAILED (${duration}ms)`);
    console.error(run.stdout || run.stderr);
    results.push({
      name: suite.name,
      features: suite.features,
      status: 'FAIL',
      duration: `${duration}ms`,
    });
  }
}

const overallDuration = Date.now() - overallStart;

console.log('\n========================================================================');
console.log('  TEST EXECUTION SUMMARY');
console.log('========================================================================');
console.table(results);

console.log(`Total Suites : ${totalSuites}`);
console.log(`Passed Suites: ${passedSuites}`);
console.log(`Failed Suites: ${failedSuites}`);
console.log(`Total Time   : ${overallDuration}ms\n`);

if (failedSuites === 0) {
  console.log('========================================================================');
  console.log('  🎉 100% OF ALL E2E TEST SUITES PASSED SUCCESSFULLY!');
  console.log('========================================================================\n');
  process.exit(0);
} else {
  console.error('========================================================================');
  console.error(`  ❌ TEST SUITE FAILED: ${failedSuites} suite(s) failed.`);
  console.error('========================================================================\n');
  process.exit(1);
}
