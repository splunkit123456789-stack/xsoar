<template>
  <div class="login-page" data-testid="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">SOAR 控制台</h1>
        <p class="login-subtitle">安全编排自动化与响应平台</p>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="account">
          <el-input
            v-model="form.account"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
            data-testid="input-account"
          />
        </el-form-item>
        <el-form-item prop="passwd">
          <el-input
            v-model="form.passwd"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            data-testid="input-password"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
            data-testid="btn-login"
          >
            登 录
          </el-button>
        </el-form-item>
        <div v-if="errorMsg" class="login-error" data-testid="login-error">
          <el-alert :title="errorMsg" type="error" :closable="false" show-icon />
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref(null)
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  account: '',
  passwd: '',
})

const rules = {
  account: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  passwd: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  errorMsg.value = ''
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await authStore.login(form.account, form.passwd)
    router.push('/dashboard')
  } catch (e) {
    errorMsg.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
}
.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-title {
  font-size: 28px;
  color: #1a73e8;
  margin: 0;
}
.login-subtitle {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}
.login-btn {
  width: 100%;
}
.login-error {
  margin-top: 16px;
}
</style>