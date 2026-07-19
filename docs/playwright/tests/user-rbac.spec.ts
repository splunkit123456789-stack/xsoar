/**
 * 用户与角色管理端到端验收脚本
 */
import { test, expect } from '@playwright/test';

const API_URL = process.env.SOAR_API_URL || 'http://127.0.0.1:8888';

test.describe('用户与角色管理端到端', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin123');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('TC-P0-USER-001 用户列表展示', async ({ page }) => {
    await page.goto('/users');
    await expect(page.locator('[data-testid="user-list"]')).toBeVisible();
    await expect(page.locator('text=admin').first()).toBeVisible();
  });

  test('TC-P0-USER-002 角色列表展示', async ({ page }) => {
    await page.goto('/roles');
    await expect(page.locator('text=super_admin')).toBeVisible();
    await expect(page.locator('text=workflow_editor')).toBeVisible();
  });
});