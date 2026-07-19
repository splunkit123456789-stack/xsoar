/**
 * APP 管理端到端验收脚本
 */
import { test, expect } from '@playwright/test';

test.describe('APP 管理端到端', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin123');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('TC-MVP-APP-001 APP 列表展示', async ({ page }) => {
    await page.goto('/apps');
    await expect(page.locator('[data-testid="app-list"]')).toBeVisible();
    // 验证基础 APP 存在
    await expect(page.locator('text=Hello World').first()).toBeVisible();
  });

  test('TC-MVP-APP-002 APP 详情展示', async ({ page }) => {
    await page.goto('/apps');
    await page.locator('text=Hello World').first().click();
    // 应展示详情弹窗或跳转
  });
});