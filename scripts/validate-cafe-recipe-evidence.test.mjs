import { test } from 'node:test';
import assert from 'node:assert/strict';
import { candidateIdsFromMenuCsv, validateCafeRecipeEvidence } from './validate-cafe-recipe-evidence.mjs';

const ids = Array.from({ length: 37 }, (_, i) => `synthetic-menu-${i + 1}`);
const pending = () => ({
  schemaVersion: 1, scope: 'OFFLINE_RECIPE_EVIDENCE_ONLY',
  items: ids.map(menuId => ({ menuId, origin: 'V2_CANDIDATE_ID_ONLY', reviewStatus: 'PENDING',
    recipeVersion: '', portionSize: '', allergensReviewed: '', handlingNotes: '', ingredients: [],
    reviewerRef: '', reviewedOn: '' })),
});
const syntheticIngredient = () => ({
  name: 'SYNTHETIC ingredient', quantity: 12, unit: 'g',
  supplierEvidenceRef: 'SYNTHETIC-REF-NOT-A-SUPPLIER',
  halalEvidenceRef: 'SYNTHETIC-REF-NOT-A-CERTIFICATE',
  halalReviewStatus: 'EVIDENCE_RECORDED',
  allergenNotes: 'SYNTHETIC-NONE-DECLARED', storageHandling: 'SYNTHETIC-COOL',
});
function completeFirst(doc) {
  Object.assign(doc.items[0], { reviewStatus: 'EVIDENCE_COMPLETE', recipeVersion: 'SYNTHETIC-v1',
    portionSize: 'SYNTHETIC 1 serving', allergensReviewed: 'SYNTHETIC reviewed',
    handlingNotes: 'SYNTHETIC dry storage', ingredients: [syntheticIngredient()],
    reviewerRef: 'SYNTHETIC-REVIEWER', reviewedOn: '20261103' });
}

test('37 pending candidates are blocked without inventing approvals', () => {
  const result = validateCafeRecipeEvidence(pending(), ids);
  assert.equal(result.ok, false);
  assert.equal(result.pending, 37);
  assert.equal(result.evidenceComplete, 0);
});

test('synthetic complete evidence + excluded items pass structural check only', () => {
  const doc = pending();
  doc.items.slice(1).forEach(row => { row.reviewStatus = 'EXCLUDED'; });
  completeFirst(doc);
  const result = validateCafeRecipeEvidence(doc, ids);
  assert.equal(result.ok, true);
  assert.equal(result.evidenceComplete, 1);
});

test('missing supplier/halal references fail closed', () => {
  const doc = pending(); doc.items.slice(1).forEach(row => { row.reviewStatus = 'EXCLUDED'; });
  completeFirst(doc); doc.items[0].ingredients[0].halalEvidenceRef = '';
  doc.items[0].ingredients[0].supplierEvidenceRef = '';
  const result = validateCafeRecipeEvidence(doc, ids);
  assert.equal(result.ok, false);
  assert(result.issues.some(x => x.includes('halalEvidenceRef')));
  assert(result.issues.some(x => x.includes('supplierEvidenceRef')));
});

test('invalid unit, negative quantity and fractional pieces are blocked', () => {
  const doc = pending(); doc.items.slice(1).forEach(row => { row.reviewStatus = 'EXCLUDED'; });
  completeFirst(doc);
  doc.items[0].ingredients[0].quantity = -1;
  doc.items[0].ingredients[0].unit = 'kg';
  assert.equal(validateCafeRecipeEvidence(doc, ids).ok, false);
  doc.items[0].ingredients[0].quantity = 1.5;
  doc.items[0].ingredients[0].unit = 'piece';
  assert.equal(validateCafeRecipeEvidence(doc, ids).ok, false);
});

test('unknown and duplicate menu IDs are rejected', () => {
  const doc = pending();
  doc.items[0].menuId = 'unknown';
  assert(validateCafeRecipeEvidence(doc, ids).issues.some(x => x.includes('unknown_menu_id')));
  doc.items[0].menuId = doc.items[1].menuId;
  assert(validateCafeRecipeEvidence(doc, ids).issues.some(x => x.includes('duplicate_menu_id')));
});

test('CSV candidate IDs are exact and unique, rejecting malformed sources', () => {
  const csv = 'id,nameTh,category,source\n' + ids.map(id => `${id},Example,drink,REFERENCE`).join('\n') + '\n';
  assert.deepEqual(candidateIdsFromMenuCsv(csv), ids);
  assert.throws(() => candidateIdsFromMenuCsv(csv + 'bad,line\n'));
  assert.throws(() => candidateIdsFromMenuCsv('wrong,header\n'));
});
