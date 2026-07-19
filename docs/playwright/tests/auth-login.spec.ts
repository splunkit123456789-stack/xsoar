/**
 * 登录与登出端到端验收脚本
 *
 * 对应验收文档：MVP_人工验收.md
 * 覆盖用例：TC-MVP-LOGIN-001、TC-MVP-LOGIN-002、TC-MVP-LOGIN-003
 *
 * 运行：npx playwright test tests/auth-login.spec.ts --project=admin
 */
import { test, expect } from '@playwright/test';

const API_URL = process.env.SOAR_API_URL || 'http://127.0.0.1:8888';

test.describe('TC-MVP-LOGIN 登录与登出端到端', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.goto('/login');
    await expect(page.locator('[data-testid="login-page"]'), '[setup] 预期展示登录页').toBeVisible();
  });

  test('TC-MVP-LOGIN-001 登录必填校验', async ({ page }) => {
    // 清空用户名和密码，直接点击登录
    await page.locator('[data-testid="input-account"]').fill('');
    await page.locator('[data-testid="input-password"]').fill('');

    // 拦截登录请求，确认前端拦截不发送请求
    const loginRequest = page.waitForRequest(
      (req) => req.url().includes('/api/v1/soar/login'),
      { timeout: 3_000 }
    ).catch(() => null);

    await page.locator('[data-testid="btn-login"]').click();

    // Element Plus 表单校验应阻止提交，页面不跳转
    await expect(page.locator('[data-testid="login-page"]'), '[TC-MVP-LOGIN-001] 预期不跳转').toBeVisible();
    // 预期不发送登录请求
    expect(await loginRequest, '[TC-MVP-LOGIN-001] 预期不发送登录请求').toBeNull();
  });

  test('TC-MVP-LOGIN-002 错误密码登录失败', async ({ page }) => {
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('wrong_password');

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/soar/login')),
      page.locator('[data-testid="btn-login"]').click(),
    ]);

    expect(response.status(), '[TC-MVP-LOGIN-002] 预期后端返回非 2xx').toBeGreaterThanOrEqual(400);
    await expect(page.locator('[data-testid="login-page"]'), '[TC-MVP-LOGIN-002] 预期不进入控制台').toBeVisible();

    const token = await page.evaluate(() => localStorage.getItem('soar_token') || '');
    expect(token, '[TC-MVP-LOGIN-002] 预期本地不保存 Token').toBe('');
  });

  test('TC-MVP-LOGIN-003 正确账号登录成功', async ({ page }) => {
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin123');

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/soar/login')),
      page.locator('[data-testid="btn-login"]').click(),
    ]);

    expect(response.status(), '[TC-MVP-LOGIN-003] 预期登录成功返回 200').toBe(200);

    // 登录成功后应跳转到控制台
    await expect(page.locator('[data-testid="navbar"]'), '[TC-MVP-LOGIN-003] 预期展示导航栏').toBeVisible();
    await expect(page.locator('[data-testid="user-info"]'), '[TC-MVP-LOGIN-003] 预期展示用户信息').toBeVisible();

    // Token 应保存在本地
    const token = await page.evaluate(() => localStorage.getItem('soar_token') || '');
    expect(token.length, '[TC-MVP-LOGIN-003] 预期 Token 非空').toBeGreaterThan(0);
  });

  test('TC-MVP-LOGIN-004 登出', async ({ page }) => {
    // 先登录
    await page.locator('[data-testid="input-account"]').fill('admin');
    await page.locator('[data-testid="input-password"]').fill('admin123');
    await page.locator('[data-testid="btn-login"]').click();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();

    // 点击用户头像 → 登出
    await page.locator('[data-testid="user-info"]').click();
    await page.locator('[data-testid="btn-logout"]').click();

    // 应回到登录页
    await expect(page.locator('[data-testid="login-page"]'), '[TC-MVP-LOGIN-004] 预期回到登录页').toBeVisible();

    // 尝试访问受保护页面应跳回登录页
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="login-page"]'), '[TC-MVP-LOGIN-004] 预期受保护地址重定向到登录页').toBeVisible();
  });
});