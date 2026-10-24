import { expect, test } from '@playwright/test';

test('launches the game without uncaught browser errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  const board = page.getByRole('group', { name: 'Tic-tac-toe board' });
  await expect(board).toBeVisible();
  await expect(board.getByRole('button')).toHaveCount(9);
  await expect(page.getByRole('button', { name: 'Hint' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(pageErrors).toEqual([]);
});

test('plays a complete local round and records the result exactly once', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'TWO PLAYERS' }).click();

  const moves = [
    'Row 1, Column 1, empty',
    'Row 2, Column 1, empty',
    'Row 1, Column 2, empty',
    'Row 2, Column 2, empty',
    'Row 1, Column 3, empty',
  ];
  for (const move of moves) await page.getByRole('button', { name: move, exact: true }).click();

  await expect(page.getByText('Player X wins!', { exact: true })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem('ttu.statistics.v1') ?? '{}');
    return { matches: value.matches, playerXWins: value.playerXWins, playerOWins: value.playerOWins ?? 0 };
  })).toEqual({ matches: 1, playerXWins: 1, playerOWins: 0 });

  await page.getByRole('button', { name: /Play next round/ }).click();
  await expect.poll(async () => page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem('ttu.statistics.v1') ?? '{}');
    return { matches: value.matches, playerXWins: value.playerXWins };
  })).toEqual({ matches: 1, playerXWins: 1 });
});

test('AI makes a legal reply and does not leave the board blocked', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Row 2, Column 2, empty', exact: true }).click();
  await expect.poll(() => page.locator('.board-cell.has-mark').count(), { timeout: 5_000 }).toBe(2);
  await expect(page.locator('.board-cell.has-mark')).toHaveCount(2);
  const occupied = await page.locator('.board-cell.has-mark').count();
  expect(occupied).toBe(2);
  await expect(page.locator('.board-cell:not(.has-mark):not(:disabled)')).toHaveCount(7);
});

test('restart cancels a pending AI response from the previous round', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Row 2, Column 2, empty', exact: true }).click();
  await expect(page.locator('.board-cell.has-mark')).toHaveCount(1);
  await page.getByRole('button', { name: /Restart round/ }).click();
  await expect(page.locator('.board-cell.has-mark')).toHaveCount(0);
  await page.waitForTimeout(650);
  await expect(page.locator('.board-cell.has-mark')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Row 1, Column 1, empty', exact: true })).toBeEnabled();
});

test('Arabic RTL language persists across reload and arrow navigation follows visual direction', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  const board = page.getByRole('group', { name: 'لوحة إكس-أو' });
  const cells = board.getByRole('button');
  await expect(cells).toHaveCount(9);
  await cells.nth(0).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(cells.nth(1)).toBeFocused();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('group', { name: 'لوحة إكس-أو' })).toBeVisible();
});

test('game remains usable on a narrow mobile viewport without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('group', { name: 'Tic-tac-toe board' })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
});

test('standalone public pages preserve Arabic language selection', async ({ page }) => {
  await page.goto('/about.html');
  await expect(page.getByRole('heading', { name: 'A familiar game, with room to get better.' })).toBeVisible();
  await page.getByRole('button', { name: 'عربي' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { name: 'لعبة كلاسيكية، ومساحة للتطوّر.' })).toBeVisible();

  await page.goto('/contact.html');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('ads remain disabled by default in the production build', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('script[src*="pagead2.googlesyndication.com"], script[src*="adsbygoogle"]')).toHaveCount(0);
});
