import { test, expect } from '@playwright/test';

/**
 * End-to-end checks for the real shell layer and the three new systems.
 * These run against the dev server, so the leaderboard falls back to the
 * local rival board (no Redis in CI).
 */

const boot = async (page) => {
  // A calm grid keeps the E2E assertions honest: the game still runs all its
  // systems, it just stops corrupting its own output mid-assertion.
  await page.addInitScript(() => {
    localStorage.setItem(
      'terminal_quest_save',
      JSON.stringify({
        bits: 0,
        inventory: [],
        achievements: [],
        currentDir: '/home',
        unlockedFiles: [],
        history: [],
        solvedPuzzles: [],
        consecutiveFailures: 0,
        cat: {
          unlocked: false,
          trust: 0,
          hunger: 100,
          isPresent: false,
          lastInteractionAt: Date.now(),
          fragmentsFound: 0,
        },
        settings: { chaos: false },
        saveVersion: 8,
      })
    );
  });
  await page.goto('/');
  // Boot sequence -> start screen -> game. Two Enters, same as a player.
  await page.waitForSelector('text=ENTER SYSTEM', { timeout: 30000 });
  await page.keyboard.press('Enter');
  await page.waitForSelector('.crt-container', { timeout: 30000 });
  const area = page.locator('.terminal-area');
  await expect(area).toBeVisible();
  return area;
};

const type = async (page, command) => {
  await page.keyboard.type(command);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
};

test.describe('Terminal Quest - shell layer', () => {
  test('navigates, reads and reports like a real shell', async ({ page }) => {
    const area = await boot(page);

    await type(page, 'pwd');
    await expect(area).toContainText('/home');

    await type(page, 'ls -l');
    await expect(area).toContainText('-rw-r--r--');
    await expect(area).toContainText('readme.txt');

    await type(page, 'cd /logs && ls');
    await expect(area).toContainText('crash_report.log');

    await type(page, 'cd - && pwd');
    await expect(area).toContainText('/home');
  });

  test('pipes, globs and redirection work', async ({ page }) => {
    const area = await boot(page);

    await type(page, 'ls *.txt');
    await expect(area).toContainText('readme.txt');

    await type(page, 'cat readme.txt | wc -c');
    await expect(area).not.toContainText('No such file');

    await type(page, 'echo hello from the shell > smoke.txt');
    await type(page, 'cat smoke.txt');
    await expect(area).toContainText('hello from the shell');

    await type(page, 'rm smoke.txt');
    await type(page, 'cat smoke.txt');
    await expect(area).toContainText('No such file');
  });

  test('rejects unknown commands the way a shell does', async ({ page }) => {
    const area = await boot(page);
    await type(page, 'definitelynotacommand');
    await expect(area).toContainText('not found');
  });

  test('man documents any command', async ({ page }) => {
    const area = await boot(page);
    await type(page, 'man grep');
    await expect(area).toContainText('GREP(1)');
  });
});

test.describe('Terminal Quest - leaderboard', () => {
  test('shows a board, a handle and a score', async ({ page }) => {
    const area = await boot(page);

    await type(page, 'leaderboard');
    await expect(area).toContainText('GRID LEADERBOARD');
    await expect(area).toContainText('YOUR POSITION');

    await type(page, 'leaderboard name e2e_runner');
    await expect(area).toContainText('OPERATOR HANDLE SET: e2e_runner');

    await type(page, 'leaderboard me');
    await expect(area).toContainText('LEADERBOARD SCORE:');

    await expect(page.locator('.terminal-window-header', { hasText: 'LEADERBOARD' })).toBeVisible();
  });
});

test.describe('Terminal Quest - lore journal', () => {
  test('indexes entries and pays for reading them', async ({ page }) => {
    const area = await boot(page);

    await type(page, 'lore');
    await expect(area).toContainText('LORE JOURNAL //');

    await type(page, 'cat readme.txt');
    await expect(area).toContainText('LORE JOURNAL UPDATED', { timeout: 10_000 });

    await type(page, 'lore readme');
    await expect(area).toContainText('A NOTE LEFT ON THE DESKTOP');
    await expect(area).toContainText('BITS for recovered lore');

    await expect(
      page.locator('.terminal-window-header', { hasText: 'LORE_JOURNAL' })
    ).toBeVisible();
  });
});

test.describe('Terminal Quest - glitch events', () => {
  test('an event can be forced, survived and tracked', async ({ page }) => {
    const area = await boot(page);

    await type(page, 'glitch');
    await expect(area).toContainText('GLITCH EVENTS');

    await type(page, 'glitch force --brief');
    await expect(area).toContainText('GLITCH EVENT:');
    await expect(page.locator('.crt-container.glitch-active')).toBeVisible();

    // 6 second window: type through it, then let the grid settle the event.
    await type(page, 'ls');
    await type(page, 'pwd');
    await page.waitForTimeout(8000);
    await type(page, 'ls');
    await expect(area).toContainText('GLITCH SURVIVED', { timeout: 15_000 });

    await expect(
      page.locator('.terminal-window-header', { hasText: 'GLITCH_EVENT' })
    ).toBeVisible();
  });
});
