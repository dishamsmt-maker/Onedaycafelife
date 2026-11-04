/** Planning-only geometry: never replaces the surveyed physical site or live game map. */
export interface PlanningTable { id: string; x: number; z: number; diameter: number; }
export interface PlanningLayout {
  width: number;
  depth: number;
  tables: PlanningTable[];
  /** Keep-out corridor measured from the roadside entry towards the kiosk. */
  corridor: { xMin: number; xMax: number; zMin: number; zMax: number };
}
export interface LayoutFinding { code: 'OUTSIDE'|'TABLE_OVERLAP'|'ENTRY_BLOCKED'; tableIds: string[]; }
export function auditLayout(layout: PlanningLayout, clearance = 0.75): LayoutFinding[] {
  if (!Number.isFinite(clearance) || clearance < 0) throw new Error('Invalid clearance');
  if (!(layout.width > 0 && layout.depth > 0)) throw new Error('Invalid site dimensions');
  const issues: LayoutFinding[] = [];
  const radius = (t: PlanningTable) => t.diameter / 2;
  for (const t of layout.tables) {
    if (!(t.diameter > 0) || ![t.x, t.z, t.diameter].every(Number.isFinite)) throw new Error('Invalid table geometry');
    if (t.x - radius(t) < 0 || t.x + radius(t) > layout.width || t.z - radius(t) < 0 || t.z + radius(t) > layout.depth)
      issues.push({ code: 'OUTSIDE', tableIds: [t.id] });
    const c = layout.corridor;
    const nearestX = Math.max(c.xMin, Math.min(t.x, c.xMax));
    const nearestZ = Math.max(c.zMin, Math.min(t.z, c.zMax));
    if (Math.hypot(t.x - nearestX, t.z - nearestZ) < radius(t) + clearance)
      issues.push({ code: 'ENTRY_BLOCKED', tableIds: [t.id] });
  }
  for (let i = 0; i < layout.tables.length; i++) for (let j = i + 1; j < layout.tables.length; j++) {
    const a = layout.tables[i], b = layout.tables[j];
    if (Math.hypot(a.x - b.x, a.z - b.z) < radius(a) + radius(b) + clearance)
      issues.push({ code: 'TABLE_OVERLAP', tableIds: [a.id, b.id] });
  }
  return issues;
}
export function compareLayouts(a: PlanningLayout, b: PlanningLayout, clearance = 0.75) {
  return { a: { tables: a.tables.length, findings: auditLayout(a, clearance) },
    b: { tables: b.tables.length, findings: auditLayout(b, clearance) } };
}
