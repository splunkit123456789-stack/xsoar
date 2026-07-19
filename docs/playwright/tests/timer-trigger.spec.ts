/**
 * 定时触发器端到端验收脚本
 *
 * 对应验收文档：P0_人工验收.md
 * 覆盖用例：TC-P0-TIMER-001 ~ TC-P0-TIMER-004
 *
 * 运行：npx playwright test tests/timer-trigger.spec.ts --project=admin
 */
import { test, expect } from '@playwright/test';

test.describe('TC-P0-TIMER 定时触发器端到端', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin_123456');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('TC-P0-TIMER-001 配置 Interval 定时触发器', async ({ page }) => {
    await page.locator('[data-testid="nav-workflow"]').click();

    // 创建新剧本或打开已有剧本
    await page.locator('[data-testid="btn-create-workflow"]').click();

    // 点击"定时触发器"配置
    await page.locator('[data-testid="tab-timer"]').click();
    await expect(page.locator('[data-testid="timer-config"]')).toBeVisible();

    // 配置 Interval 触发
    await page.locator('[data-testid="timer-type"]').selectOption('interval');
    await page.locator('[data-testid="timer-interval-type"]').selectOption('minutes');
    await page.locator('[data-testid="timer-interval-value"]').fill('1');
    await page.locator('[data-testid="timer-jitter"]').fill('0');

    await page.locator('[data-testid="btn-save-timer"]').click();
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('TC-P0-TIMER-002 配置 Cron 定时触发器', async ({ page }) => {
    await page.locator('[data-testid="nav-workflow"]').click();
    await page.locator('[data-testid="workflow-list"]').first().click();
    await page.locator('[data-testid="tab-timer"]').click();

    // 配置 Cron 触发
    await page.locator('[data-testid="timer-type"]').selectOption('cron');
    await page.locator('[data-testid="timer-cron"]').fill('0 2 * * *');
    await page.locator('[data-testid="btn-save-timer"]').click();

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('TC-P0-TIMER-003 Cron 表达式校验', async ({ page }) => {
    await page.locator('[data-testid="nav-workflow"]').click();
    await page.locator('[data-testid="workflow-list"]').first().click();
    await page.locator('[data-testid="tab-timer"]').click();

    // 输入非法 Cron 表达式
    await page.locator('[data-testid="timer-type"]').selectOption('cron');
    await page.locator('[data-testid="timer-cron"]').fill('invalid cron');
    await page.locator('[data-testid="btn-save-timer"]').click();

    await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="timer-error"]')).toContainText('Cron 表达式非法');
  });

  test('TC-P0-TIMER-004 暂停/恢复定时任务', async ({ page }) => {
    await page.locator('[data-testid="nav-timer"]').click();
    await expect(page.locator('[data-testid="timer-list"]')).toBeVisible();

    // 暂停定时任务
    await page.locator('[data-testid="btn-pause-timer"]').first().click();
    await expect(page.locator('[data-testid="timer-status"]')).toContainText('暂停');

    // 恢复定时任务
    await page.locator('[data-testid="btn-resume-timer"]').first().click();
    await expect(page.locator('[data-testid="timer-status"]')).toContainText('启用');
  });
});