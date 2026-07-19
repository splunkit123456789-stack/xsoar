/**
 * 仪表盘端到端验收脚本
 *
 * 对应验收文档：P0_人工验收.md
 * 覆盖用例：TC-P0-DASHBOARD-001 ~ TC-P0-DASHBOARD-002
 *
 * 运行：npx playwright test tests/dashboard.spec.ts --project=admin
 */
import { test, expect } from '@playwright/test';

test.describe('TC-P0-DASHBOARD 仪表盘端到端', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin_123456');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('TC-P0-DASHBOARD-001 仪表盘卡片展示', async ({ page }) => {
    await page.locator('[data-testid="nav-dashboard"]').click();
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

    // 验证顶部卡片
    await expect(page.locator('[data-testid="card-workflow-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-app-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-today-exec-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-success-rate"]')).toBeVisible();
  });

  test('TC-P0-DASHBOARD-002 仪表盘图表展示', async ({ page }) => {
    await page.locator('[data-testid="nav-dashboard"]').click();
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

    // 验证图表
    await expect(page.locator('[data-testid="chart-execution-trend"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-status-distribution"]')).toBeVisible();
  });
});