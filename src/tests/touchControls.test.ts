import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('touch input focus safety', () => {
  it('releases movement and look on window blur', async () => {
    const browserWindow = new EventTarget();
    const browserDocument = new EventTarget();
    vi.stubGlobal('window', browserWindow);
    vi.stubGlobal('document', browserDocument);

    const { touchControls } = await import('../game/touchControls');
    touchControls.move.x = 1;
    touchControls.move.y = -1;
    touchControls.look.x = 0.5;
    touchControls.interact = true;

    browserWindow.dispatchEvent(new Event('blur'));

    expect(touchControls.move).toEqual({ x: 0, y: 0 });
    expect(touchControls.look).toEqual({ x: 0, y: 0 });
    expect(touchControls.interact).toBe(false);
  });

  it('releases controls when the page becomes hidden', async () => {
    const browserWindow = new EventTarget();
    const browserDocument = new EventTarget();
    Object.defineProperty(browserDocument, 'hidden', { value: true });
    vi.stubGlobal('window', browserWindow);
    vi.stubGlobal('document', browserDocument);

    const { touchControls } = await import('../game/touchControls');
    touchControls.move.x = -1;
    touchControls.interact = true;

    browserDocument.dispatchEvent(new Event('visibilitychange'));

    expect(touchControls.move.x).toBe(0);
    expect(touchControls.interact).toBe(false);
  });
});
