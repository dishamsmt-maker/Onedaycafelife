/**
 * TASK-027: OFFLINE structural review of recipe/ingredient evidence.
 * A passing result is NOT owner approval, halal certification, or POS permission.
 * Never import game recipes, prices, live stock, or customer/supplier documents.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const ID = /^[a-z][a-z0-9-]{0,63}$/;
const UNITS = new Set(['g', 'ml', 'piece']);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

export function candidateIdsFromMenuCsv(csv) {
  if (typeof csv !== 'string' || csv.length > 1_000_000) throw new Error('invalid_menu_csv');
  const [header, ...rows] = csv.replace(/^\uFEFF/, '').trimEnd().split(/\r?\n/);
  if (!header?.startsWith('id,nameTh,category,')) throw new Error('invalid_menu_header');
  const ids = rows.map(line => {
    const match = /^([a-z][a-z0-9-]*),/.exec(line);
    if (!match) throw new Error('invalid_menu_id');
    return match[1];
  });
  if (ids.length !== 37 || new Set(ids).size !== 37) throw new Error('invalid_menu_id_set');
  return ids;
}

/** Evidence-complete means required fields are present, NOT authenticated or verified. */
export function validateCafeRecipeEvidence(document, candidateIds) {
  const issues = [];
  const fail = (index, code) => issues.push(`item_${index + 1}:${code}`);
  if (!Array.isArray(candidateIds) || candidateIds.length !== 37 ||
      candidateIds.some(id => !ID.test(id)) || new Set(candidateIds).size !== 37) {
    return { ok: false, total: 0, pending: 0, evidenceComplete: 0, issues: ['invalid_candidate_ids'] };
  }
  if (!document || document.schemaVersion !== 1 ||
      document.scope !== 'OFFLINE_RECIPE_EVIDENCE_ONLY' || !Array.isArray(document.items)) {
    return { ok: false, total: 0, pending: 0, evidenceComplete: 0, issues: ['invalid_document'] };
  }
  const expected = new Set(candidateIds);
  const seen = new Set();
  if (document.items.length !== 37) issues.push(`expected_37_items_got_${document.items.length}`);
  let pending = 0, evidenceComplete = 0;
  for (const [index, row] of document.items.entries()) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) { fail(index, 'invalid_item'); continue; }
    if (!expected.has(row.menuId)) fail(index, 'unknown_menu_id');
    if (seen.has(row.menuId)) fail(index, 'duplicate_menu_id');
    seen.add(row.menuId);
    if (row.origin !== 'V2_CANDIDATE_ID_ONLY') fail(index, 'invalid_origin');
    if (row.reviewStatus === 'PENDING') { pending++; fail(index, 'pending_evidence'); continue; }
    if (row.reviewStatus === 'EXCLUDED') continue;
    if (row.reviewStatus !== 'EVIDENCE_COMPLETE') { fail(index, 'invalid_review_status'); continue; }
    const before = issues.length;
    for (const key of ['recipeVersion', 'portionSize', 'allergensReviewed', 'handlingNotes', 'reviewerRef', 'reviewedOn']) {
      if (!nonempty(row[key])) fail(index, `missing_${key}`);
    }
    if (!/^\d{8}$/.test(row.reviewedOn || '')) fail(index, 'invalid_reviewed_date');
    if (!Array.isArray(row.ingredients) || row.ingredients.length === 0) {
      fail(index, 'missing_ingredients');
    } else {
      const ingredientNames = new Set();
      for (const [ingredientIndex, ingredient] of row.ingredients.entries()) {
        const prefix = `ingredient_${ingredientIndex + 1}`;
        if (!ingredient || typeof ingredient !== 'object' || Array.isArray(ingredient)) {
          fail(index, `${prefix}_invalid`); continue;
        }
        if (!nonempty(ingredient.name)) fail(index, `${prefix}_name`);
        if (ingredientNames.has(ingredient.name)) fail(index, `${prefix}_duplicate`);
        ingredientNames.add(ingredient.name);
        if (typeof ingredient.quantity !== 'number' || !Number.isFinite(ingredient.quantity) || ingredient.quantity <= 0 ||
            (ingredient.unit === 'piece' && !Number.isInteger(ingredient.quantity))) fail(index, `${prefix}_quantity`);
        if (!UNITS.has(ingredient.unit)) fail(index, `${prefix}_unit`);
        for (const key of ['supplierEvidenceRef', 'halalEvidenceRef', 'allergenNotes', 'storageHandling']) {
          if (!nonempty(ingredient[key])) fail(index, `${prefix}_${key}`);
        }
        if (ingredient.halalReviewStatus !== 'EVIDENCE_RECORDED') fail(index, `${prefix}_halal_unreviewed`);
      }
    }
    if (issues.length === before) evidenceComplete++;
  }
  for (const id of expected) if (!seen.has(id)) issues.push(`missing_menu_id:${id}`);
  return { ok: issues.length === 0, total: document.items.length, pending, evidenceComplete, issues };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 4) throw new Error('Usage: node scripts/validate-cafe-recipe-evidence.mjs <evidence.json> <menu-approval.csv>');
    const document = JSON.parse(readFileSync(process.argv[2], 'utf8'));
    const ids = candidateIdsFromMenuCsv(readFileSync(process.argv[3], 'utf8'));
    const result = validateCafeRecipeEvidence(document, ids);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    console.error(String(error));
    process.exitCode = 2;
  }
}
