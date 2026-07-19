/**
 * 全局变量端到端验收脚本
 *
 * 对应验收文档：P0_人工验收.md
 * 覆盖用例：TC-P0-VAR-001 ~ TC-P0-VAR-003
 *
 * 运行：npx playwright test tests/variable-manager.spec.ts --project=admin
 */
import { test, expect } from '@playwright/test';

test.describe('TC-P0-VAR 全局变量端到端', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin_123456');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('TC-P0-VAR-001 创建全局变量', async ({ page }) => {
    await page.locator('[data-testid="nav-system"]').click();
    await page.locator('[data-testid="tab-variables"]').click();
    await page.locator('[data-testid="btn-create-variable"]').click();

    await page.locator('[data-testid="input-var-name"]').fill('default_smtp_host');
    await page.locator('[data-testid="input-var-value"]').fill('smtp.example.com');
    await page.locator('[data-testid="select-var-type"]').selectOption('string');
    await page.locator('[data-testid="input-var-remarks"]').fill('默认 SMTP 服务器');
    await page.locator('[data-testid="btn-save-variable"]').click();

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="variable-list"]')).toContainText('default_smtp_host');
  });

  test('TC-P0-VAR-002 在剧本中引用全局变量', async ({ page }) => {
    await page.locator('[data-testid="nav-workflow"]').click();
    await page.locator('[data-testid="btn-create-workflow"]').click();

    // 在剧本中使用 ${var.default_smtp_host}
    await page.locator('[data-testid="canvas-node"]').click();
    await page.locator('[data-testid="input-param-name"]').fill('${var.default_smtp_host}');
    await page.locator('[data-testid="btn-save-node-config"]').click();
    await page.locator('[data-testid="btn-save-workflow"]').click();
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('TC-P0-VAR-003 删除被引用的变量', async ({ page }) => {
    await page.locator('[data-testid="nav-system"]').click();
    await page.locator('[data-testid="tab-variables"]').click();

    // 尝试删除 default_smtp_host
    await page.locator('[data-testid="var-checkbox"]').first().click();
    await page.locator('[data-testid="btn-delete-variable"]').click();
    await page.locator('[data-testid="btn-confirm-delete"]').click();

    await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="toast-error"]')).toContainText('变量被引用不可删除');
  });
});