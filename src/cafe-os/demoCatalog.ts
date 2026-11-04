import type { CafeCatalogItem } from './orderCore';

/** Demonstration-only halal menu; prices, recipes and costs require owner validation. */
export const DEMO_HALAL_MENU: readonly (CafeCatalogItem & { nameTh: string })[] = [
  { id: 'rice-porridge-chicken', nameTh: 'ข้าวต้มไก่', priceSatang: 4500, recipe: { rice: 1, chicken: 1, broth: 1 }, enabled: true },
  { id: 'rice-porridge-fish', nameTh: 'ข้าวต้มปลา', priceSatang: 5500, recipe: { rice: 1, fish: 1, broth: 1 }, enabled: true },
  { id: 'congee-chicken', nameTh: 'โจ๊กไก่', priceSatang: 4500, recipe: { congee: 1, chicken: 1 }, enabled: true },
  { id: 'egg-toast', nameTh: 'ขนมปังไข่', priceSatang: 3500, recipe: { bread: 2, egg: 1 }, enabled: true },
  { id: 'grilled-chicken', nameTh: 'ไก่ย่าง', priceSatang: 4900, recipe: { chicken: 2, marinade: 1 }, enabled: true },
  { id: 'french-fries', nameTh: 'เฟรนช์ฟรายส์', priceSatang: 3900, recipe: { potato: 2, oil: 1 }, enabled: true },
  { id: 'iced-tea', nameTh: 'ชาเย็น', priceSatang: 3500, recipe: { tea: 1, milk: 1, ice: 1 }, enabled: true },
  { id: 'iced-coffee', nameTh: 'กาแฟเย็น', priceSatang: 4500, recipe: { coffee: 1, milk: 1, ice: 1 }, enabled: true },
];
export const DEMO_TABLE_IDS = ['t1', 't2', 't3', 't4', 't5'] as const;
export function createDemoStock(units = 20): Record<string, number> {
  if (!Number.isSafeInteger(units) || units < 0) throw new Error('invalid demo stock');
  return Object.fromEntries(
    [...new Set(DEMO_HALAL_MENU.flatMap(item => Object.keys(item.recipe)))].map(id => [id, units]),
  );
}
