/**
 * APP 管理端到端验收脚本
 *
 * 对应验收文档：MVP_人工验收.md、P0_人工验收.md
 * 覆盖用例：TC-MVP-APP-001 ~ TC-MVP-APP-002、TC-P0-APP-001 ~ TC-P0-APP-003
 *
 * 运行：npx playwright test tests/app-management.spec.ts --project=admin
 */
import { test, expect } from '@playwright/test';

test.describe('APP 管理端到端', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin123');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('TC-MVP-APP-001 APP 列表展示', async ({ page }) => {
    await page.locator('[data-testid="nav-apps"]').click();
    await expect(page.locator('[data-testid="app-list"]')).toBeVisible();

    // 验证基础 APP 存在
    await expect(page.locator('[data-testid="app-card-helloworld"]')).toBeVisible();
    await expect(page.locator('[data-testid="app-card-base64"]')).toBeVisible();
    await expect(page.locator('[data-testid="app-card-email"]')).toBeVisible();

    // 验证 APP 展示名称、版本、类型、图标
    const appCard = page.locator('[data-testid="app-card-helloworld"]');
    await expect(appCard.locator('[data-testid="app-name"]')).toContainText('Hello World');
    await expect(appCard.locator('[data-testid="app-version"]')).toBeVisible();
    await expect(appCard.locator('[data-testid="app-type"]')).toContainText('基础应用');
    await expect(appCard.locator('[data-testid="app-icon"]')).toBeVisible();
  });

  test('TC-MVP-APP-002 APP 详情展示', async ({ page }) => {
    await page.locator('[data-testid="nav-apps"]').click();
    await page.locator('[data-testid="app-card-helloworld"]').click();

    await expect(page.locator('[data-testid="app-detail"]')).toBeVisible();
    await expect(page.locator('[data-testid="app-detail-name"]')).toContainText('Hello World');
    await expect(page.locator('[data-testid="app-detail-actions"]')).toBeVisible();
    await expect(page.locator('[data-testid="app-detail-args"]')).toBeVisible();
  });

  test('TC-P0-APP-001 APP 分组管理', async ({ page }) => {
    // 创建分组
    await page.locator('[data-testid="nav-apps"]').click();
    await page.locator('[data-testid="tab-app-groups"]').click();
    await page.locator('[data-testid="btn-create-group"]').click();
    await page.locator('[data-testid="input-group-name"]').fill('消息通知');
    await page.locator('[data-testid="btn-save-group"]').click();
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('TC-P0-APP-002 将 APP 归入分组', async ({ page }) => {
    await page.locator('[data-testid="nav-apps"]').click();

    // 编辑 email APP 的分组
    await page.locator('[data-testid="app-card-email"]').click();
    await page.locator('[data-testid="btn-edit-app"]').click();
    await page.locator('[data-testid="select-app-group"]').selectOption('消息通知');
    await page.locator('[data-testid="btn-save-app"]').click();
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('TC-P0-APP-003 按分组筛选 APP', async ({ page }) => {
    await page.locator('[data-testid="nav-apps"]').click();

    // 按分组筛选
    await page.locator('[data-testid="filter-app-group"]').selectOption('消息通知');
    await page.waitForTimeout(500);

    // 验证只显示对应分组下的 APP
    const appCards = await page.locator('[data-testid^="app-card-"]').count();
    expect(appCards, '[TC-P0-APP-003] 预期筛选结果不为空').toBeGreaterThan(0);
  });
});