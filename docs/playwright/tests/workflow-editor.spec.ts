/**
 * 剧本编辑器端到端验收脚本
 */
import { test, expect } from '@playwright/test';

test.describe('剧本编辑器端到端', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin123');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('TC-MVP-WORKFLOW-001 剧本列表展示', async ({ page }) => {
    await page.goto('/workflows');
    await expect(page.locator('[data-testid="workflow-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-create-workflow"]')).toBeVisible();
  });

  test('TC-MVP-WORKFLOW-002 打开新建剧本编辑器', async ({ page }) => {
    await page.goto('/workflows');
    await page.locator('[data-testid="btn-create-workflow"]').click();
    // 跳转到编辑器页（new 路由）
    await expect(page.locator('[data-testid="workflow-editor"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-workflow-name"]')).toBeVisible();
  });
});