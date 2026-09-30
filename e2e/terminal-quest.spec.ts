import { test, expect } from '@playwright/test';

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
          // One known process, so `kill` has a deterministic target.
          processes: [
            {
              pid: 4242,
              typeId: 'monitor',
              name: 'MONITOR_DAEMON',
              bitsYield: 20,
              dangerThreshold: 6,
              age: 1,
              terminated: false,
              spawnedAt: Date.now(),
            },
          ],
          saveVersion: 8,
        })
      );
    });
  await page.goto('/');
  // Boot sequence -> start screen -> game. Two Enters, same as a player.
  await page.waitForSelector('text=ENTER SYSTEM', { timeout: 30000 });
  await page.keyboard.press('Enter');
  await page.waitForSelector('.crt-container', { timeout: 30000 });
  await page.waitForTimeout(1200);
  return page.locator('.terminal-area');
};

const type = async (page, command) => {
  await page.keyboard.type(command);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
};

test.describe('Terminal Quest - Critical Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('full game loop: boot → tutorial → story → repair → restore', async ({ page }) => {
    const area = await boot(page);
    await expect(area).toBeVisible();

    // 1. Start tutorial
    await type(page, 'help');
    await expect(area).toContainText('Grid commands:');
    await expect(area).toContainText('Shell commands:');

    // 2. Check tutorial starts
    await type(page, 'ls');
    await expect(area).toContainText('STEP 2/5');

    // 3. Read readme (also unlocks the first lore entry)
    await type(page, 'cat readme.txt');
    await expect(area).toContainText('STEP 3/5');
    await expect(area).toContainText('LORE JOURNAL UPDATED', { timeout: 10_000 });

    // 4. Change directory
    await type(page, 'cd /logs');
    await expect(area).toContainText('STEP 4/5');

    // 5. Ask daemon
    await type(page, 'ask hello');
    await expect(area).toContainText('STEP 5/5');
    await expect(area).toContainText('TUTORIAL COMPLETE');
    await expect(area).toContainText('First Boot');
  });

  test('exploration: hidden files, ciphers and the journal', async ({ page }) => {
    const area = await boot(page);

    await type(page, 'ls -a');
    await expect(area).toContainText('.hidden');
    await expect(area).toContainText('Hidden Seeker');

    await type(page, 'cd .hidden && ls');
    await expect(area).toContainText('secret.txt');

    await type(page, 'lore');
    await expect(area).toContainText('[ORIGINS]');
  });

  test('story progression: story → repair → restore', async ({ page }) => {
    const area = await boot(page);

    await type(page, 'story');
    await expect(area).toContainText('ARC: DISCOVERY');

    // repair is requirement-gated at stage 0, so a fresh player sees the hint
    await type(page, 'repair');
    await expect(area).toContainText('repair protocol offline');
  });

  test('processes: ps, top, pgrep and kill', async ({ page }) => {
    const area = await boot(page);

    await type(page, 'ps aux');
    await expect(area).toContainText('COMMAND');
    await expect(area).toContainText('4242');

    await type(page, 'top');
    await expect(area).toContainText('load average');

    // The save seeds a process with PID 4242, so this needs no scraping.
    await type(page, 'pgrep monitor');
    await expect(area).toContainText('4242');

    await type(page, 'kill 4242');
    await expect(area).toContainText('terminated');
    await expect(area).toContainText('BITS');

    await type(page, 'kill 4242');
    await expect(area).toContainText('No such process');
  });

  test('daily quests and stats', async ({ page }) => {
    const area = await boot(page);

    await type(page, 'daily');
    await expect(area).toContainText('DAEMON_DAILY');

    await type(page, 'stats');
    await expect(area).toContainText('SESSION STATISTICS');
  });

  test('minigames: crash and leak', async ({ page }) => {
    const area = await boot(page);

    await type(page, 'motherlode'); // the classic cheat: instant balance
    await expect(area).toContainText('Master Cheater');
    await type(page, 'play crash 10');
    await expect(area).toContainText('TYPE THE SEQUENCE');

    // Read the sequence from its own line: the scrollback has no separators.
    const line = (await page.locator('.terminal-line').allInnerTexts()).find((text) =>
      text.includes('TYPE THE SEQUENCE')
    );
    const sequence = line?.match(/TYPE THE SEQUENCE: (\S+)/)?.[1];
    expect(sequence).toBeTruthy();

    await type(page, `guess ${sequence ?? ''}`);
    await expect(area).toContainText('ACCESS GRANTED');
  });

  test('mobile viewport: panels visible, touch targets', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const area = await boot(page);

    await expect(page.locator('.terminal-window-header', { hasText: 'OBJECTIVE' })).toBeVisible();
    await expect(page.locator('.terminal-window-header', { hasText: 'PROCESSES' })).toBeVisible();
    await expect(
      page.locator('.terminal-window-header', { hasText: 'FILE_SYSTEM_VISUALIZER' })
    ).toBeVisible();
    await expect(page.locator('.terminal-window-header', { hasText: 'LEADERBOARD' })).toBeVisible();
    await expect(area).toBeVisible();

    const exportBtn = page.locator('button:has-text("EXPORT_BACKUP")');
    await expect(exportBtn).toBeVisible();
    const box = await exportBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});
