/**
 * 用户与角色管理端到端验收脚本
 *
 * 对应验收文档：P0_人工验收.md
 * 覆盖用例：TC-P0-USER-001 ~ TC-P0-USER-005
 *
 * 运行：npx playwright test tests/user-rbac.spec.ts --project=admin
 */
import { test, expect } from '@playwright/test';

const API_URL = process.env.SOAR_API_URL || 'http://127.0.0.1:8888';

test.describe('TC-P0-USER 用户与角色管理端到端', () => {
  test.describe.configure({ mode: 'serial' });

  let token = '';

  test.beforeAll(async ({ request }) => {
    const loginResp = await request.post(`${API_URL}/api/v1/soar/login`, {
      data: { account: 'admin', passwd: 'admin_123456' }
    });
    const loginData = await loginResp.json();
    token = loginData.data.token;
  });

  test('TC-P0-USER-001 创建角色', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin_123456');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();

    // 导航到角色管理
    await page.locator('[data-testid="nav-system"]').click();
    await page.locator('[data-testid="tab-roles"]').click();
    await page.locator('[data-testid="btn-create-role"]').click();

    await page.locator('[data-testid="input-role-name"]').fill('分析师');
    await page.locator('[data-testid="input-role-desc"]').fill('安全运营分析师');
    await page.locator('[data-testid="btn-save-role"]').click();

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="role-list"]')).toContainText('分析师');
  });

  test('TC-P0-USER-002 创建用户并绑定角色', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin_123456');
    await page.locator('[data-testid="btn-login"]').click();

    // 导航到用户管理
    await page.locator('[data-testid="nav-system"]').click();
    await page.locator('[data-testid="tab-users"]').click();
    await page.locator('[data-testid="btn-create-user"]').click();

    await page.locator('[data-testid="input-user-account"]').fill('analyst1');
    await page.locator('[data-testid="input-user-password"]').fill('Passw0rd!');
    await page.locator('[data-testid="input-user-nickname"]').fill('分析师张三');
    await page.locator('[data-testid="input-user-email"]').fill('zhangsan@example.com');
    await page.locator('[data-testid="select-user-role"]').selectOption('分析师');
    await page.locator('[data-testid="btn-save-user"]').click();

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-list"]')).toContainText('analyst1');
  });

  test('TC-P0-USER-003 以新用户登录', async ({ page }) => {
    // 登出
    await page.goto('/');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin_123456');
    await page.locator('[data-testid="btn-login"]').click();
    await page.locator('[data-testid="user-info"]').click();
    await page.locator('[data-testid="btn-logout"]').click();

    // 以新用户登录
    await page.locator('[data-testid="input-account"]').fill('analyst1');
    await page.locator('[data-testid="input-password"]').fill('Passw0rd!');
    await page.locator('[data-testid="btn-login"]').click();

    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-info"]')).toContainText('分析师张三');
  });

  test('TC-P0-USER-004 删除用户', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin_123456');
    await page.locator('[data-testid="btn-login"]').click();

    await page.locator('[data-testid="nav-system"]').click();
    await page.locator('[data-testid="tab-users"]').click();

    // 删除 analyst1 用户
    await page.locator('[data-testid="user-checkbox-analyst1"]').click();
    await page.locator('[data-testid="btn-delete-user"]').click();
    await page.locator('[data-testid="btn-confirm-delete"]').click();

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-list"]')).not.toContainText('analyst1');
  });

  test('TC-P0-USER-005 不允许删除自己', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin_123456');
    await page.locator('[data-testid="btn-login"]').click();

    await page.locator('[data-testid="nav-system"]').click();
    await page.locator('[data-testid="tab-users"]').click();

    // 尝试删除自己
    await page.locator('[data-testid="user-checkbox-admin"]').click();
    await page.locator('[data-testid="btn-delete-user"]').click();

    await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="toast-error"]')).toContainText('不允许删除自己');
  });
});