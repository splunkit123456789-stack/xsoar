/**
 * 全局变量端到端验收脚本
 */
import { test, expect } from '@playwright/test';

test.describe('全局变量端到端', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin123');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('TC-P0-VAR-001 全局变量页面展示', async ({ page }) => {
    await page.goto('/variables');
    await expect(page.locator('text=全局变量')).toBeVisible();
  });
});