/**
 * 定时触发器端到端验收脚本
 */
import { test, expect } from '@playwright/test';

test.describe('定时触发器端到端', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin123');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('TC-P0-TIMER-001 创建剧本', async ({ page }) => {
    await page.goto('/workflows');
    await expect(page.locator('[data-testid="workflow-list"]')).toBeVisible();
    await page.locator('[data-testid="btn-create-workflow"]').click();
    // 应跳转到编辑器
  });
});