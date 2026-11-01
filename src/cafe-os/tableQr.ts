/**
 * ONE DAY Café OS — QR table identifier contract.
 *
 * This is NOT part of the game simulation. No customer, payment, inventory,
 * or ledger data is read or written here. A QR table code is a locator,
 * NEVER authentication or proof of physical presence.
 */
export const CAFE_TABLE_IDS = ['T01', 'T02', 'T03'] as const;
export type CafeTableId = (typeof CAFE_TABLE_IDS)[number];

export function isCafeTableId(value: unknown): value is CafeTableId {
  return typeof value === 'string' && CAFE_TABLE_IDS.some(id => id === value);
}

/**
 * Parse a browser's location.search, accepting only one exact 'table' field.
 * Unknown tables, duplicate keys and unsupported parameters are rejected.
 */
export function parseCafeTableSearch(search: string): CafeTableId | null {
  if (typeof search !== 'string') return null;
  const query = search.startsWith('?') ? search.slice(1) : search;
  if (!query || query.includes('#')) return null;
  const params = new URLSearchParams(query);
  const keys = [...params.keys()];
  if (keys.length !== 1 || keys[0] !== 'table') return null;
  const value = params.get('table');
  return isCafeTableId(value) ? value : null;
}

/** Relative path only; deployment origin is chosen separately by the owner. */
export function cafeTableOrderPath(tableId: CafeTableId): string {
  if (!isCafeTableId(tableId)) throw new Error('Unknown café table');
  return `/order?table=${encodeURIComponent(tableId)}`;
}
