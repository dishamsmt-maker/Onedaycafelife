/**
 * ONE DAY TASK-019: read-only PR dependency and CI audit.
 * Never merges, deploys, edits GitHub, or accesses café/customer data.
 * Run: node scripts/pr-stack-audit.mjs
 * Test: node --test scripts/pr-stack-audit.test.mjs
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const EXPECTED_STACK = Object.freeze([
  { number: 6, lane: 'game', base: 'main' },
  { number: 10, lane: 'game', base: 'agent/touch-focus-safety-20261101' },
  { number: 7, lane: 'cafe-os', base: 'main' },
  { number: 8, lane: 'cafe-os', base: 'feature/cafe-os-table-qr-contract-20261101' },
  { number: 9, lane: 'cafe-os', base: 'feature/cafe-os-idempotent-intake-20261101' },
]);

/** Pure audit: a green CI run never means owner approval or production readiness. */
export function auditPrStack({ pulls, runs, filesByPr = {}, mainSha }) {
  const findings = [];
  const prChecks = [];
  const add = (severity, code, detail) => findings.push({ severity, code, detail });
  if (!/^[0-9a-f]{40}$/.test(mainSha || '')) add('blocker', 'main_sha_unknown', 'Cannot verify main commit SHA.');

  for (const expected of EXPECTED_STACK) {
    const pr = pulls.find(item => item.number === expected.number);
    if (!pr) {
      add('blocker', 'pr_missing', 'PR #' + expected.number + ' was not returned.');
      prChecks.push({ number: expected.number, lane: expected.lane, status: 'missing' });
      continue;
    }
    const base = pr.base?.ref;
    const headSha = pr.head?.sha;
    if (pr.state !== 'open' || pr.merged_at) {
      add('blocker', 'pr_not_open', 'PR #' + expected.number + ' is no longer an open unmerged PR; re-audit stack.');
    }
    if (base !== expected.base) {
      add('blocker', 'wrong_base', 'PR #' + expected.number + ' base is ' + String(base) + ', expected ' + expected.base + '.');
    }
    if (pr.mergeable === false) add('blocker', 'merge_conflict', 'PR #' + expected.number + ' reports mergeable=false.');
    if (!/^[0-9a-f]{40}$/.test(headSha || '')) add('blocker', 'head_sha_unknown', 'PR #' + expected.number + ' has no verifiable head SHA.');

    const matches = runs.filter(run => run.event === 'pull_request' && run.head_sha === headSha);
    matches.sort((a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
    const latest = matches[0];
    if (!latest) add('blocker', 'ci_missing', 'No PR CI run found for PR #' + expected.number + ' at its current head SHA.');
    else if (latest.status !== 'completed' || latest.conclusion !== 'success') {
      add('blocker', 'ci_not_green', 'PR #' + expected.number + ' latest matching CI: ' + latest.status + '/' + latest.conclusion + '.');
    }
    prChecks.push({
      number: expected.number,
      lane: expected.lane,
      base,
      headSha,
      state: pr.state,
      mergeable: pr.mergeable,
      ci: latest ? latest.status + '/' + latest.conclusion : 'not_found',
      ciUrl: latest?.html_url || null,
    });
  }

  const gameFiles = new Set();
  const cafeFiles = new Set();
  for (const expected of EXPECTED_STACK) {
    const paths = filesByPr[expected.number];
    if (!Array.isArray(paths)) {
      add('warning', 'files_unverified', 'File overlap not checked for PR #' + expected.number + '.');
      continue;
    }
    for (const path of paths) (expected.lane === 'game' ? gameFiles : cafeFiles).add(path);
  }
  const overlap = [...gameFiles].filter(path => cafeFiles.has(path)).sort();
  if (overlap.length) {
    add('warning', 'cross_lane_overlap', 'Both lanes change ' + overlap.join(', ') + '; review rebase/conflicts before any merge.');
  }

  return {
    mainSha,
    releaseGate: 'OWNER_REVIEW_REQUIRED',
    safeToAutoMerge: false,
    safeToAutoDeploy: false,
    prChecks,
    findings,
    blockers: findings.filter(item => item.severity === 'blocker').length,
    warnings: findings.filter(item => item.severity === 'warning').length,
  };
}

async function getJson(path) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'one-day-read-only-qa-audit',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;
  const response = await fetch('https://api.github.com/repos/dishamsmt-maker/Onedaycafelife' + path, {
    headers,
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('GitHub read failed: HTTP ' + response.status + ' for ' + path);
  return response.json();
}

export async function auditLiveStack() {
  const [pulls, runData, main, ...filePages] = await Promise.all([
    getJson('/pulls?state=all&per_page=100'),
    getJson('/actions/runs?per_page=100'),
    getJson('/commits/main'),
    ...EXPECTED_STACK.map(pr => getJson('/pulls/' + pr.number + '/files?per_page=100')),
  ]);
  const filesByPr = {};
  for (let i = 0; i < EXPECTED_STACK.length; i += 1) {
    filesByPr[EXPECTED_STACK[i].number] = filePages[i].map(file => file.filename);
  }
  return auditPrStack({ pulls, runs: runData.workflow_runs, filesByPr, mainSha: main.sha });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = await auditLiveStack();
    console.log(JSON.stringify({ checkedAt: new Date().toISOString(), ...result }, null, 2));
    if (result.blockers > 0) process.exitCode = 1;
  } catch (error) {
    console.error('QA audit incomplete (fail closed): ' + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}
