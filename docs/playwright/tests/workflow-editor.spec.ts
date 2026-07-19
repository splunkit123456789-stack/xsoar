/**
 * 剧本编辑器端到端验收脚本
 *
 * 对应验收文档：MVP_人工验收.md
 * 覆盖用例：TC-MVP-WORKFLOW-001 ~ TC-MVP-WORKFLOW-005
 *
 * 运行：npx playwright test tests/workflow-editor.spec.ts --project=admin
 */
import { test, expect } from '@playwright/test';

test.describe('TC-MVP-WORKFLOW 剧本编辑器端到端', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 登录
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin123');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('TC-MVP-WORKFLOW-001 创建剧本', async ({ page }) => {
    // 导航到剧本管理
    await page.locator('[data-testid="nav-workflow"]').click();
    await expect(page.locator('[data-testid="workflow-list"]')).toBeVisible();

    // 点击"新建剧本"
    await page.locator('[data-testid="btn-create-workflow"]').click();
    await expect(page.locator('[data-testid="workflow-editor"]')).toBeVisible();

    // 输入剧本名称
    await page.locator('[data-testid="input-workflow-name"]').fill('Playwright 测试剧本');
    await page.locator('[data-testid="btn-save-workflow"]').click();

    // 验证保存成功
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('TC-MVP-WORKFLOW-002 拖拽 APP 节点到画布', async ({ page }) => {
    await page.locator('[data-testid="nav-workflow"]').click();

    // 打开已有剧本
    await page.locator('[data-testid="workflow-list"]').first().click();
    await expect(page.locator('[data-testid="workflow-editor"]')).toBeVisible();

    // 从左侧 APP 库拖拽 helloworld 到画布
    const appSource = page.locator('[data-testid="app-node-helloworld"]');
    const canvas = page.locator('[data-testid="editor-canvas"]');
    await appSource.dragTo(canvas);

    // 验证节点出现在画布中
    await expect(page.locator('[data-testid="canvas-node"]')).toBeVisible();
  });

  test('TC-MVP-WORKFLOW-003 配置节点参数', async ({ page }) => {
    await page.locator('[data-testid="nav-workflow"]').click();
    await page.locator('[data-testid="workflow-list"]').first().click();

    // 点击画布上的节点，打开配置面板
    await page.locator('[data-testid="canvas-node"]').click();
    await expect(page.locator('[data-testid="node-config-panel"]')).toBeVisible();

    // 配置参数
    await page.locator('[data-testid="input-param-name"]').fill('W5');
    await page.locator('[data-testid="btn-save-node-config"]').click();

    // 验证参数保存成功
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('TC-MVP-WORKFLOW-004 保存剧本', async ({ page }) => {
    await page.locator('[data-testid="nav-workflow"]').click();
    await page.locator('[data-testid="workflow-list"]').first().click();

    await page.locator('[data-testid="btn-save-workflow"]').click();

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('TC-MVP-WORKFLOW-005 删除剧本', async ({ page }) => {
    await page.locator('[data-testid="nav-workflow"]').click();

    // 勾选剧本，点击删除
    await page.locator('[data-testid="workflow-checkbox"]').first().click();
    await page.locator('[data-testid="btn-delete-workflow"]').click();

    // 确认删除
    await expect(page.locator('[data-testid="dialog-confirm"]')).toBeVisible();
    await page.locator('[data-testid="btn-confirm-delete"]').click();

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });
});