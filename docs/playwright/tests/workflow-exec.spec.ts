/**
 * 剧本执行端到端验收脚本
 */
import { test, expect } from '@playwright/test';

test.describe('剧本执行端到端', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin123');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('TC-MVP-EXEC-001 执行日志列表展示', async ({ page }) => {
    await page.goto('/logs');
    await expect(page.locator('[data-testid="logs-list"]')).toBeVisible();
  });
});