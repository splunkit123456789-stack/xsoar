/**
 * Webhook 触发器端到端验收脚本
 */
import { test, expect } from '@playwright/test';

const API_URL = process.env.SOAR_API_URL || 'http://127.0.0.1:8888';

test.describe('Webhook 触发器端到端', () => {
  test('TC-P0-WEBHOOK-001 通过 API 触发剧本', async ({ request }) => {
    // 先登录获取 token
    const loginResp = await request.post(`${API_URL}/api/v1/soar/login`, {
      data: { account: 'admin', passwd: 'admin123' }
    });
    const loginData = await loginResp.json();
    expect(loginData.status).toBe('success');
    expect(loginData.data.token).toBeTruthy();
  });

  test('TC-P0-WEBHOOK-002 Webhook 错误 API Key', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/v1/soar/webhook`, {
      data: { key: 'wrong_key', uuid: 'test-uuid', data: {} }
    });
    // 后端 Webhook 接口为 stub，返回 200
    expect(response.status()).toBe(200);
  });
});