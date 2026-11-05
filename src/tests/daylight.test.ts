import { describe, expect, it } from 'vitest';
import { daylight } from '../game/daylight';
describe('presentation daylight', () => {
  it('wraps days and gives both dawn and dusk warm light', () => {
    expect(daylight(405).sunColor).toBe('#ffc58c');
    expect(daylight(1035).sunColor).toBe('#ffc58c');
    expect(daylight(720).sunlight).toBeGreaterThan(daylight(0).sunlight);
    expect(daylight(405 + 1440)).toEqual(daylight(405));
  });
  it('softens sunlight in cloudy weather without changing its direction', () => {
    expect(daylight(750,true).sunlight).toBeLessThan(daylight(750).sunlight);
    expect(daylight(750,true).sunX).toBe(daylight(750).sunX);
  });
});
