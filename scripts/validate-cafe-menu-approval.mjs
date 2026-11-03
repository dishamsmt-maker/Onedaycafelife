/**
 * TASK-026: offline structural review of the 37-row ONE DAY owner worksheet.
 * This is NOT an authenticated approval, POS import, or permission to sell.
 * It never reads game data, customer information, payments, or live inventory.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const COLUMNS = Object.freeze([
  'id', 'nameTh', 'category', 'source', 'ownerReviewStatus',
  'includeInRealMenu', 'priceTHB', 'portionSize', 'recipeVersion',
  'recipeIngredientsAndUnits', 'allergens', 'halalReviewStatus',
  'halalEvidenceSupplierOrCertificate', 'salesStartHHMM', 'salesEndHHMM',
  'approvalReference', 'reviewer', 'reviewDateYYYYMMDD', 'notes',
]);

function parseCsv(text) {
  if (typeof text !== 'string' || text.length > 1_000_000) throw new Error('invalid_csv_input');
  const input = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', quoted = false, afterQuote = false;
  const finishField = () => { row.push(field); field = ''; afterQuote = false; };
  const finishRow = () => { finishField(); rows.push(row); row = []; };
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; afterQuote = true; }
      else field += c;
    } else if (c === ',') finishField();
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && input[i + 1] === '\n') i++;
      finishRow();
    } else if (c === '"') {
      if (field || afterQuote) throw new Error('invalid_csv_quote');
      quoted = true;
    } else {
      if (afterQuote) throw new Error('invalid_csv_quote');
      field += c;
    }
  }
  if (quoted) throw new Error('unterminated_csv_quote');
  if (row.length || field || afterQuote) finishRow();
  return rows;
}

function minutes(value) {
  const match = /^(\d{2}):?(\d{2})$/.exec(value);
  if (!match) return null;
  const h = Number(match[1]), m = Number(match[2]);
  return h < 24 && m < 60 ? h * 60 + m : null;
}

/** Structural readiness only. `ok: true` never proves a real owner signed off. */
export function validateCafeMenuApprovalCsv(text) {
  const issues = [];
  let parsed;
  try { parsed = parseCsv(text); }
  catch (error) { return { ok: false, total: 0, pending: 0, ready: 0, issues: [String(error.message)] }; }
  const [header, ...rows] = parsed;
  if (!header || header.length !== COLUMNS.length || header.some((col, i) => col !== COLUMNS[i])) {
    return { ok: false, total: rows.length, pending: 0, ready: 0, issues: ['invalid_header'] };
  }
  if (rows.length !== 37) issues.push(`expected_37_rows_got_${rows.length}`);
  const ids = new Set();
  let pending = 0, ready = 0;
  for (const [index, fields] of rows.entries()) {
    const line = index + 2;
    if (fields.length !== COLUMNS.length) { issues.push(`row_${line}:column_count`); continue; }
    const row = Object.fromEntries(COLUMNS.map((col, i) => [col, fields[i].trim()]));
    const error = code => issues.push(`row_${line}:${code}`);
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(row.id)) error('invalid_id');
    if (ids.has(row.id)) error('duplicate_id');
    ids.add(row.id);
    if (!row.nameTh || !['porridge', 'breakfast_set', 'salad', 'drink', 'snack'].includes(row.category)) error('invalid_item');
    if (row.source !== 'GAME_V2_REFERENCE_ONLY') error('invalid_reference_source');
    if (row.ownerReviewStatus === 'PENDING') { pending++; error('pending_owner_review'); continue; }
    if (row.ownerReviewStatus === 'REJECTED' && row.includeInRealMenu === 'NO') continue;
    if (row.ownerReviewStatus !== 'APPROVED' || row.includeInRealMenu !== 'YES') { error('invalid_review_decision'); continue; }
    const required = [
      'priceTHB', 'portionSize', 'recipeVersion', 'recipeIngredientsAndUnits',
      'allergens', 'halalEvidenceSupplierOrCertificate', 'salesStartHHMM',
      'salesEndHHMM', 'approvalReference', 'reviewer', 'reviewDateYYYYMMDD',
    ];
    for (const col of required) if (!row[col]) error(`missing_${col}`);
    if (!/^[1-9]\d{0,5}(?:\.\d{1,2})?$/.test(row.priceTHB)) error('invalid_price');
    if (row.halalReviewStatus !== 'VERIFIED') error('halal_not_verified');
    const start = minutes(row.salesStartHHMM), end = minutes(row.salesEndHHMM);
    if (start === null || end === null || start < 390 || end > 1230 || start >= end) error('invalid_item_hours');
    if (!/^\d{8}$/.test(row.reviewDateYYYYMMDD)) error('invalid_review_date');
    if (!issues.some(issue => issue.startsWith(`row_${line}:`))) ready++;
  }
  return { ok: issues.length === 0, total: rows.length, pending, ready, issues };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: node scripts/validate-cafe-menu-approval.mjs <worksheet.csv>');
    process.exitCode = 2;
  } else {
    try {
      const result = validateCafeMenuApprovalCsv(readFileSync(path, 'utf8'));
      console.log(JSON.stringify(result, null, 2));
      if (!result.ok) process.exitCode = 1;
    } catch (error) {
      console.error(String(error));
      process.exitCode = 2;
    }
  }
}
