/** Camera input lives outside restaurant state. It can never change the ledger. */
export type InteractionKind = 'staff'|'table'|'fridge'|'garden'|'bar'|'kitchen'|'customer';
type Listener = () => void;
const listeners = new Set<Listener>();
export const touchControls = {
  move: {x: 0, y: 0},
  look: {x: 0, y: 0},
  interact: false,
  position: {x: .4, z: -6.1},
  view: {yaw: 3.09, pitch: .03},
  nearby: null as null | {kind: InteractionKind; label: string; distance: number; id?:string},
  cameraRevision: 0,
  eyeHeight: 1.62,
  active: false,
  enabled: true,
  resetCount: 0,
  reset() {
    this.resetCount++;
    this.move.x = this.move.y = 0;
    this.look.x = this.look.y = 0;
    this.interact = false;
    this.emit();
  },
  subscribe(listener: Listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  emit() { listeners.forEach(listener => listener()); },
};
if (import.meta.env.DEV) (globalThis as any).__ONE_DAY_PLAYER__ = touchControls;
