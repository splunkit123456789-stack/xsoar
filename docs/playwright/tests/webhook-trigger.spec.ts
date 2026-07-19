/**
 * Webhook 触发器和外部 API 端到端验收脚本
 *
 * 对应验收文档：P0_人工验收.md
 * 覆盖用例：TC-P0-WEBHOOK-001 ~ TC-P0-WEBHOOK-004
 *
 * 运行：npx playwright test tests/webhook-trigger.spec.ts --project=admin
 */
import { test, expect } from '@playwright/test';

const API_URL = process.env.SOAR_API_URL || 'http://127.0.0.1:8888';

test.describe('TC-P0-WEBHOOK Webhook 触发器端到端', () => {
  test.describe.configure({ mode: 'serial' });

  let token = '';
  let webhookUuid = '';
  let apiKey = '';

  test.beforeAll(async ({ request }) => {
    // 获取 API Key
    const loginResp = await request.post(`${API_URL}/api/v1/soar/login`, {
      data: { account: 'admin', passwd: 'admin_123456' }
    });
    const loginData = await loginResp.json();
    token = loginData.data.token;

    // 获取 API Key
    const settingResp = await request.get(`${API_URL}/api/v1/soar/setting/api_key`, {
      headers: { token }
    });
    const settingData = await settingResp.json();
    apiKey = settingData.data.value;
  });

  test('TC-P0-WEBHOOK-001 启用 Webhook 触发', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin_123456');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();

    // 创建剧本
    await page.locator('[data-testid="nav-workflow"]').click();
    await page.locator('[data-testid="btn-create-workflow"]').click();

    // 启用 Webhook
    await page.locator('[data-testid="tab-webhook"]').click();
    await page.locator('[data-testid="btn-enable-webhook"]').click();

    // 获取 Webhook UUID
    await expect(page.locator('[data-testid="webhook-uuid"]')).toBeVisible();
    webhookUuid = await page.locator('[data-testid="webhook-uuid"]').textContent() || '';
    expect(webhookUuid.length, '[TC-P0-WEBHOOK-001] 预期 Webhook UUID 非空').toBeGreaterThan(0);
  });

  test('TC-P0-WEBHOOK-002 通过 Webhook API 触发剧本', async ({ request }) => {
    expect(webhookUuid).not.toBe('');
    expect(apiKey).not.toBe('');

    const response = await request.post(`${API_URL}/api/v1/soar/webhook`, {
      data: {
        key: apiKey,
        uuid: webhookUuid,
        data: { alert_id: 'test-001', src_ip: '10.0.1.8' }
      }
    });

    expect(response.status(), '[TC-P0-WEBHOOK-002] 预期 Webhook 触发成功').toBe(200);
    const respData = await response.json();
    expect(respData.data.exec_id, '[TC-P0-WEBHOOK-002] 预期返回 exec_id').toBeTruthy();
  });

  test('TC-P0-WEBHOOK-003 Webhook 错误 API Key', async ({ request }) => {
    expect(webhookUuid).not.toBe('');

    const response = await request.post(`${API_URL}/api/v1/soar/webhook`, {
      data: {
        key: 'wrong_api_key',
        uuid: webhookUuid,
        data: { test: true }
      }
    });

    expect(response.status(), '[TC-P0-WEBHOOK-003] 预期错误 API Key 返回 401').toBeGreaterThanOrEqual(400);
    const respData = await response.json();
    expect(respData.code).toBe('WEBHOOK_KEY_INVALID');
  });

  test('TC-P0-WEBHOOK-004 通过外部 API 查询执行状态', async ({ request }) => {
    expect(apiKey).not.toBe('');

    // 先通过 webhook 触发一次执行
    const execResp = await request.post(`${API_URL}/api/v1/soar/webhook`, {
      data: { key: apiKey, uuid: webhookUuid, data: { test: true } }
    });
    const execData = await execResp.json();
    const execId = execData.data.exec_id;

    // 查询执行状态
    const statusResp = await request.get(
      `${API_URL}/api/v1/soar/api/exec_status?exec_id=${execId}&key=${apiKey}`
    );
    expect(statusResp.status(), '[TC-P0-WEBHOOK-004] 预期查询执行状态成功').toBe(200);
    const statusData = await statusResp.json();
    expect(statusData.data.status).toBe('success');
  });
});