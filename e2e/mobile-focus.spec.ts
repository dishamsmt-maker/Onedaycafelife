import { expect, test } from '@playwright/test';

/**
 * TASK-023: browser-level focus-loss regression on a mobile-sized Chromium
 * viewport. Synthetic blur/pagehide events test our listeners; they do NOT
 * certify a real iPhone/Safari app-switch or BFCache lifecycle.
 */
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
});

test('held joystick stops on blur and pagehide, then accepts a fresh touch', async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'เดินเข้าร้าน', exact: true }).tap();
  await page.getByRole('button', { name: 'หยุดเวลา', exact: true }).tap();

  const joystick = page.getByTestId('walk-joystick');
  await expect(joystick).toBeVisible();
  const box = await joystick.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  const cdp = await page.context().newCDPSession(page);

  const snapshot = await page.evaluate(() => {
    const game = (window as any).__ONE_DAY_DEV__.store.getState().game;
    return JSON.stringify({
      cash: game.cash,
      minute: game.minute,
      inventory: game.inventory,
      orders: game.orders,
      ledger: game.ledger,
    });
  });

  for (const [index, eventType] of (['blur', 'pagehide'] as const).entries()) {
    const pointerId = index + 1;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, id: pointerId }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y - 31, id: pointerId }],
    });
    await expect.poll(() => page.evaluate(() => (window as any).__ONE_DAY_PLAYER__.move.y))
      .toBeGreaterThan(0.4);

    const beforeReset = await page.evaluate(() => (window as any).__ONE_DAY_PLAYER__.resetCount);
    await page.evaluate(type => window.dispatchEvent(new Event(type)), eventType);

    await expect.poll(() => page.evaluate(() => {
      const input = (window as any).__ONE_DAY_PLAYER__;
      return { move: { ...input.move }, look: { ...input.look }, interact: input.interact };
    })).toEqual({ move: { x: 0, y: 0 }, look: { x: 0, y: 0 }, interact: false });
    await expect.poll(() => page.evaluate(() => (window as any).__ONE_DAY_PLAYER__.resetCount))
      .toBe(beforeReset + 1);
    await expect(joystick.locator('.walk-knob')).toHaveAttribute('style', /translate\(0px, 0px\)/);

    // The old held pointer cannot reactivate movement after a focus reset.
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y - 20, id: pointerId }],
    });
    await expect.poll(() => page.evaluate(() => (window as any).__ONE_DAY_PLAYER__.move.y))
      .toBe(0);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }

  // A new touch still works after both lifecycle resets.
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, id: 3 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x, y: y - 31, id: 3 }],
  });
  await expect.poll(() => page.evaluate(() => (window as any).__ONE_DAY_PLAYER__.move.y))
    .toBeGreaterThan(0.4);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => (window as any).__ONE_DAY_PLAYER__.move.y))
    .toBe(0);

  const after = await page.evaluate(() => {
    const game = (window as any).__ONE_DAY_DEV__.store.getState().game;
    return JSON.stringify({
      cash: game.cash,
      minute: game.minute,
      inventory: game.inventory,
      orders: game.orders,
      ledger: game.ledger,
    });
  });
  expect(after).toBe(snapshot);
  expect(errors).toEqual([]);
});
