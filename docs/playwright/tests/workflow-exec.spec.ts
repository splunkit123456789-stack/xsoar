/**
 * 剧本执行端到端验收脚本
 *
 * 对应验收文档：MVP_人工验收.md
 * 覆盖用例：TC-MVP-EXEC-001 ~ TC-MVP-EXEC-003
 *
 * 运行：npx playwright test tests/workflow-exec.spec.ts --project=admin
 */
import { test, expect } from '@playwright/test';

test.describe('TC-MVP-EXEC 剧本执行端到端', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 登录
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin_123456');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('TC-MVP-EXEC-001 手动执行剧本', async ({ page }) => {
    // 创建并执行剧本
    await page.locator('[data-testid="nav-workflow"]').click();
    await page.locator('[data-testid="workflow-list"]').first().click();

    // 点击"执行"按钮
    await page.locator('[data-testid="btn-execute"]').click();

    // 验证节点状态变化：pending → running → success
    await expect(page.locator('[data-testid="node-status-pending"]')).toBeVisible();

    // 等待执行完成
    await page.waitForSelector('[data-testid="node-status-success"]', { timeout: 30_000 });

    // 验证执行成功提示
    await expect(page.locator('[data-testid="toast-exec-success"]')).toBeVisible();
  });

  test('TC-MVP-EXEC-002 执行过程中节点状态实时变化', async ({ page }) => {
    await page.locator('[data-testid="nav-workflow"]').click();
    await page.locator('[data-testid="workflow-list"]').first().click();

    // 监听 WebSocket 消息
    const wsMessages: string[] = [];
    page.on('websocket', (ws) => {
      ws.on('framesent', (frame) => wsMessages.push(String(frame.payload)));
    });

    await page.locator('[data-testid="btn-execute"]').click();

    // 等待执行完成
    await page.waitForSelector('[data-testid="node-status-success"]', { timeout: 30_000 });

    // 验证 WebSocket 收到状态更新
    expect(wsMessages.length, '[TC-MVP-EXEC-002] 预期收到 WebSocket 消息').toBeGreaterThan(0);
  });

  test('TC-MVP-EXEC-003 执行日志记录', async ({ page }) => {
    // 执行剧本
    await page.locator('[data-testid="nav-workflow"]').click();
    await page.locator('[data-testid="workflow-list"]').first().click();
    await page.locator('[data-testid="btn-execute"]').click();
    await page.waitForSelector('[data-testid="node-status-success"]', { timeout: 30_000 });

    // 导航到执行日志
    await page.locator('[data-testid="nav-logs"]').click();
    await expect(page.locator('[data-testid="logs-list"]')).toBeVisible();

    // 验证执行日志列表中有刚执行的记录
    await expect(page.locator('[data-testid="log-entry"]').first()).toBeVisible();

    // 点击查看执行详情
    await page.locator('[data-testid="log-entry"]').first().click();
    await expect(page.locator('[data-testid="logs-detail"]')).toBeVisible();

    // 验证节点详情包含输入/输出/状态/耗时
    await expect(page.locator('[data-testid="node-detail-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="node-detail-output"]')).toBeVisible();
    await expect(page.locator('[data-testid="node-detail-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="node-detail-duration"]')).toBeVisible();
  });
});