/**
 * ONE DAY Café OS — prototype menu review gate for draft orders.
 *
 * NOT a production authorization or payment check. Structural approval fields
 * can be forged; only an authenticated, authoritative server-side menu can
 * decide whether a real order may be accepted.
 *
 * This module never imports game code or reads customer/transaction data.
 */
import {
  createCafeDraftInbox,
  parseCafeDraftOrderRequest,
  type CafeIntakeResult,
} from './orderIntake';
import {
  listStructurallyApprovedMenuItems,
  validateCafeMenuCatalog,
  type CafeMenuValidation,
} from './menuDraft';

export type CafeMenuReviewGateResult =
  | CafeIntakeResult
  | Readonly<{ accepted: false; reason: 'invalid_catalog' | 'menu_not_approved' }>;

/**
 * The catalog is validated and snapshotted at construction. Changing the
 * caller's catalog later cannot silently enable a pending menu item.
 *
 * This is a demonstration of a fail-closed boundary, not an authenticated
 * review/approval workflow or a persistent POS/KDS.
 */
export function createCafeMenuReviewGate(catalog: unknown) {
  const validation: CafeMenuValidation = validateCafeMenuCatalog(catalog);
  const approvedIds = new Set(
    validation.ok
      ? listStructurallyApprovedMenuItems(catalog).map(item => item.id)
      : [],
  );
  const inbox = createCafeDraftInbox();

  return {
    getCatalogValidation(): CafeMenuValidation {
      return validation;
    },
    submit(value: unknown): CafeMenuReviewGateResult {
      // Validate the request first; do not accidentally accept malformed
      // payloads or caller-supplied prices/roles/payment fields.
      const request = parseCafeDraftOrderRequest(value);
      if (!request) return { accepted: false, reason: 'invalid_request' };

      if (!validation.ok) return { accepted: false, reason: 'invalid_catalog' };

      // Every line must have an exact ID in the structurally approved
      // snapshot. Unknown and PENDING IDs are both rejected.
      if (request.items.some(item => !approvedIds.has(item.menuId))) {
        return { accepted: false, reason: 'menu_not_approved' };
      }

      // Idempotency remains enforced by the existing in-memory inbox.
      return inbox.submit(value);
    },
    getOrders() {
      return inbox.getOrders();
    },
  };
}
