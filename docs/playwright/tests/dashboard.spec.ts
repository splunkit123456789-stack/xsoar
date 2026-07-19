/**
 * 仪表盘端到端验收脚本
 */
import { test, expect } from '@playwright/test';

test.describe('仪表盘端到端', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin123');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('TC-P0-DASHBOARD-001 仪表盘卡片展示', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-workflow-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-app-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-today-exec-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-success-rate"]')).toBeVisible();
  });

  test('TC-P0-DASHBOARD-002 仪表盘图表展示', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="chart-execution-trend"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-status-distribution"]')).toBeVisible();
  });
});