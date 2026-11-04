import { describe, expect, it } from 'vitest';
import { auditLayout, compareLayouts, type PlanningLayout } from '../game/layoutPlanning';

const layout: PlanningLayout = {
  width: 5, depth: 10,
  corridor: { xMin: 2.1, xMax: 2.9, zMin: 0, zMax: 10 },
  tables: [
    { id: 'T1', x: 0.8, z: 2, diameter: 0.7 },
    { id: 'T2', x: 4.2, z: 2, diameter: 0.7 },
    { id: 'T3', x: 0.8, z: 5, diameter: 0.7 },
    { id: 'T4', x: 4.2, z: 5, diameter: 0.7 },
  ],
};
describe('planning-only cafe circulation audit', () => {
  it('checks a hypothetical four-table option without asserting site approval', () => {
    expect(auditLayout(layout)).toEqual([]);
  });
  it('flags a fifth table placed in the entry corridor', () => {
    const five: PlanningLayout = { ...layout, tables: [...layout.tables, { id: 'T5', x: 2.5, z: 8, diameter: 0.7 }] };
    expect(compareLayouts(layout, five).b.findings).toContainEqual({ code: 'ENTRY_BLOCKED', tableIds: ['T5'] });
  });
  it('flags overlapping and out-of-bounds tables', () => {
    const changed: PlanningLayout = { ...layout, tables: [...layout.tables, { id: 'T5', x: 0.8, z: 2.2, diameter: 0.7 }, { id: 'T6', x: 5, z: 9, diameter: 0.7 }] };
    const findings = auditLayout(changed);
    expect(findings).toContainEqual({ code: 'TABLE_OVERLAP', tableIds: ['T1', 'T5'] });
    expect(findings).toContainEqual({ code: 'OUTSIDE', tableIds: ['T6'] });
  });
  it('rejects invalid geometry', () => {
    expect(() => auditLayout({ ...layout, width: 0 })).toThrow();
    expect(() => auditLayout(layout, -1)).toThrow();
  });
});
