import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { COLUMNS, validateCafeMenuApprovalCsv as validate } from './validate-cafe-menu-approval.mjs';

const base = () => Object.fromEntries(COLUMNS.map(key => [key, '']));
const pending = (id = 'test-item') => ({ ...base(), id, nameTh: 'เมนูทดสอบ', category: 'drink', source: 'GAME_V2_REFERENCE_ONLY', ownerReviewStatus: 'PENDING', halalReviewStatus: 'UNVERIFIED' });
const approved = (id = 'test-item') => ({ ...pending(id), ownerReviewStatus: 'APPROVED', includeInRealMenu: 'YES', priceTHB: '40.50', portionSize: '1 cup', recipeVersion: 'test-v1', recipeIngredientsAndUnits: 'water 100 ml', allergens: 'NONE', halalReviewStatus: 'VERIFIED', halalEvidenceSupplierOrCertificate: 'SYNTHETIC_TEST_EVIDENCE', salesStartHHMM: '06:30', salesEndHHMM: '20:30', approvalReference: 'SYNTHETIC_NOT_REAL', reviewer: 'synthetic-test', reviewDateYYYYMMDD: '20261103' });
const csv = (rows) => [COLUMNS.join(','), ...rows.map(row => COLUMNS.map(col => {
  const s = String(row[col] ?? '');
  return /[,"\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}).join(','))].join('\n') + '\n';
const batch = (factory) => Array.from({ length: 37 }, (_, i) => factory(`test-item-${i + 1}`));

describe('TASK-026 offline worksheet validator — not owner authentication', () => {
  it('blocks 37 pending candidates', () => {
    const r = validate(csv(batch(pending)));
    assert.equal(r.ok, false); assert.equal(r.total, 37); assert.equal(r.pending, 37); assert.equal(r.ready, 0);
  });
  it('accepts structurally complete SYNTHETIC rows without claiming human approval', () => {
    const r = validate(csv(batch(approved)));
    assert.equal(r.ok, true); assert.equal(r.ready, 37);
  });
  it('rejects missing price, recipe, halal evidence, and item hours', () => {
    const rows = batch(approved);
    rows[0].priceTHB = ''; rows[1].recipeIngredientsAndUnits = '';
    rows[2].halalEvidenceSupplierOrCertificate = ''; rows[3].salesStartHHMM = '22:00';
    const r = validate(csv(rows));
    assert.equal(r.ok, false); assert.equal(r.ready, 33);
    assert.ok(r.issues.some(x => x.includes('missing_priceTHB')));
    assert.ok(r.issues.some(x => x.includes('missing_recipeIngredientsAndUnits')));
    assert.ok(r.issues.some(x => x.includes('missing_halalEvidenceSupplierOrCertificate')));
    assert.ok(r.issues.some(x => x.includes('invalid_item_hours')));
  });
  it('rejects duplicate ids, wrong row count, bad header and invalid status', () => {
    const rows = batch(approved); rows[1].id = rows[0].id;
    assert.equal(validate(csv(rows)).ok, false);
    assert.ok(validate(csv(rows.slice(1))).issues.includes('expected_37_rows_got_36'));
    assert.ok(validate('not,a,valid,header\n').issues.includes('invalid_header'));
    rows[1].id = 'test-item-2'; rows[1].ownerReviewStatus = 'PENDING';
    assert.equal(validate(csv(rows)).pending, 1);
  });
  it('handles quoted commas/newlines and rejects malformed quotes', () => {
    const rows = batch(approved); rows[0].recipeIngredientsAndUnits = 'water, 100 ml\nice, 10 g';
    assert.equal(validate(csv(rows)).ok, true);
    assert.equal(validate('"unterminated').ok, false);
  });
  it('allows explicitly excluded rows without pretending they are sellable', () => {
    const rows = batch(approved); rows[0] = { ...pending('test-item-1'), ownerReviewStatus: 'REJECTED', includeInRealMenu: 'NO' };
    const r = validate(csv(rows)); assert.equal(r.ok, true); assert.equal(r.ready, 36);
  });
});
