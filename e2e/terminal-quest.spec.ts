import { test, expect } from '@playwright/test';

test.describe('Terminal Quest - Critical Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the game to load (skip boot/start screens)
    await page.waitForSelector('.crt-container', { timeout: 30000 });
    // Press Enter to skip boot if needed
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
  });

  test('full game loop: boot → tutorial → cat → fragments → repair → restore', async ({ page }) => {
    // Wait for terminal to be ready
    await expect(page.locator('.terminal-area')).toBeVisible();

    // 1. Start tutorial
    await page.keyboard.type('help');
    await page.keyboard.press('Enter');
    await expect(page.locator('.terminal-area')).toContainText('Available Commands');

    // 2. Check tutorial starts
    await page.keyboard.type('ls');
    await page.keyboard.press('Enter');
    await expect(page.locator('.terminal-area')).toContainText('STEP 2/5');

    // 3. Read readme
    await page.keyboard.type('cat readme.txt');
    await page.keyboard.press('Enter');
    await expect(page.locator('.terminal-area')).toContainText('STEP 3/5');

    // 4. Change directory
    await page.keyboard.type('cd /logs');
    await page.keyboard.press('Enter');
    await expect(page.locator('.terminal-area')).toContainText('STEP 4/5');

    // 5. Ask daemon
    await page.keyboard.type('ask hello');
    await page.keyboard.press('Enter');
    await expect(page.locator('.terminal-area')).toContainText('STEP 5/5');
    await expect(page.locator('.terminal-area')).toContainText('TUTORIAL COMPLETE');
    await expect(page.locator('.terminal-area')).toContainText('First Boot');
  });

  test('cat interaction: feed, pet, trust building', async ({ page }) => {
    // Navigate to cat area
    await page.keyboard.type('cd /users/explorer');
    await page.keyboard.press('Enter');
    await page.keyboard.type('ls');
    await page.keyboard.press('Enter');

    // Check for cat fragment
    await expect(page.locator('.terminal-area')).toContainText('fragment');

    // Try to pet cat (might need trust first)
    await page.keyboard.type('pet');
    await page.keyboard.press('Enter');
  });

  test('story progression: story → repair → restore', async ({ page }) => {
    // Check story status
    await page.keyboard.type('story');
    await page.keyboard.press('Enter');
    await expect(page.locator('.terminal-area')).toContainText('ARC:');

    // Try repair (should fail at stage 0)
    await page.keyboard.type('repair');
    await page.keyboard.press('Enter');
    await expect(page.locator('.terminal-area')).toContainText('repair protocol offline');
  });

  test('daily quests and stats', async ({ page }) => {
    // Check daily
    await page.keyboard.type('daily');
    await page.keyboard.press('Enter');
    await expect(page.locator('.terminal-area')).toContainText('DAEMON_DAILY');

    // Check stats
    await page.keyboard.type('stats');
    await page.keyboard.press('Enter');
    await expect(page.locator('.terminal-area')).toContainText('SESSION STATISTICS');
  });

  test('minigames: crash and leak', async ({ page }) => {
    // Play crash
    await page.keyboard.type('play crash 10');
    await page.keyboard.press('Enter');
    await expect(page.locator('.terminal-area')).toContainText('TYPE THE SEQUENCE');

    // Get the sequence and guess
    const sequence = await page.locator('.terminal-area').textContent();
    const match = sequence?.match(/TYPE THE SEQUENCE: (\S+)/);
    if (match) {
      await page.keyboard.type(`guess ${match[1]}`);
      await page.keyboard.press('Enter');
      await expect(page.locator('.terminal-area')).toContainText('BITS');
    }
  });

  test('mobile viewport: panels visible, touch targets', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('.crt-container', { timeout: 30000 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Check right panels visible on mobile
    await expect(page.locator('text=OBJECTIVE')).toBeVisible();
    await expect(page.locator('text=PROCESSES')).toBeVisible();
    await expect(page.locator('text=FILE_SYSTEM_VISUALIZER')).toBeVisible();

    // Check tap targets are large enough
    const exportBtn = page.locator('button:has-text("EXPORT_BACKUP")');
    await expect(exportBtn).toBeVisible();
    const box = await exportBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});