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
  it('releases held inputs on pagehide without changing camera pose', async () => {
    const browserWindow = new EventTarget();
    const browserDocument = new EventTarget();
    vi.stubGlobal('window', browserWindow);
    vi.stubGlobal('document', browserDocument);

    const { touchControls } = await import('../game/touchControls');
    const onReset = vi.fn();
    const unsubscribe = touchControls.subscribe(onReset);
    touchControls.move.x = 0.8;
    touchControls.move.y = -0.6;
    touchControls.look.x = 12;
    touchControls.look.y = -7;
    touchControls.interact = true;
    touchControls.position = { x: 1.5, z: -2.2 };
    touchControls.view = { yaw: 1.2, pitch: -0.3 };
    const before = touchControls.resetCount;

    browserWindow.dispatchEvent(new Event('pagehide'));

    expect(touchControls.move).toEqual({ x: 0, y: 0 });
    expect(touchControls.look).toEqual({ x: 0, y: 0 });
    expect(touchControls.interact).toBe(false);
    expect(touchControls.resetCount).toBe(before + 1);
    expect(touchControls.position).toEqual({ x: 1.5, z: -2.2 });
    expect(touchControls.view).toEqual({ yaw: 1.2, pitch: -0.3 });
    expect(onReset).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('does not reset on visibilitychange when the page is visible', async () => {
    const browserWindow = new EventTarget();
    const browserDocument = new EventTarget();
    Object.defineProperty(browserDocument, 'hidden', { value: false });
    vi.stubGlobal('window', browserWindow);
    vi.stubGlobal('document', browserDocument);

    const { touchControls } = await import('../game/touchControls');
    touchControls.move.y = 1;
    const before = touchControls.resetCount;

    browserDocument.dispatchEvent(new Event('visibilitychange'));

    expect(touchControls.move.y).toBe(1);
    expect(touchControls.resetCount).toBe(before);
  });

});
