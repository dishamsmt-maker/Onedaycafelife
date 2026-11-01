import test from 'node:test';
import assert from 'node:assert/strict';
import { auditPrStack, EXPECTED_STACK } from './pr-stack-audit.mjs';

const shaFor = number => (number === 10 ? 'a' : String(number)).repeat(40);
const mainSha = 'f'.repeat(40);

function fixture() {
  const pulls = EXPECTED_STACK.map(({ number, base }) => ({
    number,
    state: 'open',
    merged_at: null,
    mergeable: true,
    base: { ref: base },
    head: { sha: shaFor(number) },
  }));
  const runs = EXPECTED_STACK.map(({ number }) => ({
    event: 'pull_request',
    head_sha: shaFor(number),
    status: 'completed',
    conclusion: 'success',
    created_at: '2026-11-01T12:00:00Z',
    html_url: 'https://github.com/example/repo/actions/runs/' + number,
  }));
  const filesByPr = Object.fromEntries(EXPECTED_STACK.map(({ number }) => [number, ['feature-' + number + '.ts']]));
  return { pulls, runs, filesByPr, mainSha };
}

test('green stack stays review-only: never auto-merge or deploy', () => {
  const result = auditPrStack(fixture());
  assert.equal(result.blockers, 0);
  assert.equal(result.warnings, 0);
  assert.equal(result.releaseGate, 'OWNER_REVIEW_REQUIRED');
  assert.equal(result.safeToAutoMerge, false);
  assert.equal(result.safeToAutoDeploy, false);
  assert.equal(result.prChecks.length, 5);
});

test('rejects unexpected base branch in stacked PR', () => {
  const data = fixture();
  data.pulls.find(pr => pr.number === 9).base.ref = 'main';
  const result = auditPrStack(data);
  assert.ok(result.findings.some(f => f.code === 'wrong_base' && f.detail.includes('#9')));
});

test('rejects missing current-head CI, even if an older commit passed', () => {
  const data = fixture();
  data.runs.find(run => run.head_sha === shaFor(8)).head_sha = 'b'.repeat(40);
  const result = auditPrStack(data);
  assert.ok(result.findings.some(f => f.code === 'ci_missing' && f.detail.includes('#8')));
});

test('newest CI failure overrides an older green CI for the same SHA', () => {
  const data = fixture();
  data.runs.push({
    event: 'pull_request',
    head_sha: shaFor(7),
    status: 'completed',
    conclusion: 'failure',
    created_at: '2026-11-01T13:00:00Z',
    html_url: 'https://github.com/example/repo/actions/runs/999',
  });
  const result = auditPrStack(data);
  assert.ok(result.findings.some(f => f.code === 'ci_not_green' && f.detail.includes('#7')));
});

test('closed, merged, or conflicting PR is not ready for owner review', () => {
  const data = fixture();
  data.pulls.find(pr => pr.number === 6).state = 'closed';
  data.pulls.find(pr => pr.number === 6).merged_at = '2026-11-01T14:00:00Z';
  data.pulls.find(pr => pr.number === 10).mergeable = false;
  const result = auditPrStack(data);
  assert.ok(result.findings.some(f => f.code === 'pr_not_open'));
  assert.ok(result.findings.some(f => f.code === 'merge_conflict'));
});

test('flags README/workflow overlaps across game and cafe branches', () => {
  const data = fixture();
  data.filesByPr[6] = ['README.md', '.github/workflows/pr-checks.yml'];
  data.filesByPr[7] = ['README.md', '.github/workflows/pr-checks.yml'];
  const result = auditPrStack(data);
  assert.equal(result.blockers, 0);
  assert.ok(result.findings.some(f => f.code === 'cross_lane_overlap' && f.detail.includes('README.md')));
});

test('fails closed for missing PR, unknown main SHA and unverified file lists', () => {
  const data = fixture();
  data.pulls = data.pulls.filter(pr => pr.number !== 9);
  data.mainSha = '';
  delete data.filesByPr[10];
  const result = auditPrStack(data);
  assert.ok(result.blockers >= 2);
  assert.ok(result.findings.some(f => f.code === 'pr_missing'));
  assert.ok(result.findings.some(f => f.code === 'main_sha_unknown'));
  assert.ok(result.findings.some(f => f.code === 'files_unverified'));
});
