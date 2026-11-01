import { describe, expect, it } from 'vitest';
import {
  CAFE_TABLE_IDS,
  cafeTableOrderPath,
  isCafeTableId,
  parseCafeTableSearch,
} from '../cafe-os/tableQr';

describe('Café OS table QR contract (not the game)', () => {
  it('accepts exactly the three launch tables and round-trips generated paths', () => {
    expect(CAFE_TABLE_IDS).toEqual(['T01', 'T02', 'T03']);
    for (const tableId of CAFE_TABLE_IDS) {
      expect(isCafeTableId(tableId)).toBe(true);
      const path = cafeTableOrderPath(tableId);
      expect(path).toBe(`/order?table=${tableId}`);
      expect(parseCafeTableSearch(new URL(path, 'https://example.test').search)).toBe(tableId);
    }
  });

  it('rejects unknown, blank, lower-case and padded table IDs', () => {
    for (const value of ['T00', 'T04', 't01', ' T01', 'T01 ', '', null, 1, {}]) {
      expect(isCafeTableId(value)).toBe(false);
    }
    for (const search of ['?table=T00', '?table=T04', '?table=t01', '?table=%20T01', '?table=T01%20', '?table=']) {
      expect(parseCafeTableSearch(search)).toBeNull();
    }
    expect(() => cafeTableOrderPath('T99' as any)).toThrow('Unknown café table');
  });

  it('rejects duplicate keys, unknown parameters, fragments and missing table', () => {
    for (const search of [
      '', '?', '?table=T01&table=T02', '?table=T01&table=T01',
      '?table=T01&role=admin', '?table=T01#foo', '?foo=T01', '?TABLE=T01',
    ]) {
      expect(parseCafeTableSearch(search)).toBeNull();
    }
  });

  it('allows URL-encoded exact IDs but never treats the QR as a payment token', () => {
    expect(parseCafeTableSearch('?table=%54%30%31')).toBe('T01');
    expect(cafeTableOrderPath('T02')).not.toContain('token');
    expect(cafeTableOrderPath('T02')).not.toContain('payment');
  });
});
