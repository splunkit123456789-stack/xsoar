<template>
  <div class="user-list">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="showDialog = true">
        <el-icon><Plus /></el-icon>新增用户
      </el-button>
    </div>

    <el-card shadow="hover">
      <el-table :data="users" v-loading="loading" stripe style="width: 100%" data-testid="user-list">
        <el-table-column prop="account" label="账号" width="150" />
        <el-table-column prop="nick_name" label="昵称" width="150" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="role_name" label="角色" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'info'" size="small">
              {{ row.status === 0 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑用户弹窗 -->
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑用户' : '新增用户'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="账号" prop="account">
          <el-input v-model="form.account" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="密码" prop="passwd" v-if="!isEdit">
          <el-input v-model="form.passwd" type="password" show-password />
        </el-form-item>
        <el-form-item label="昵称" prop="nick_name">
          <el-input v-model="form.nick_name" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="角色" prop="role_id">
          <el-select v-model="form.role_id" style="width:100%">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/api/request'

const users = ref([])
const roles = ref([])
const loading = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = ref({ account: '', passwd: '', nick_name: '', email: '', role_id: '' })
const rules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  passwd: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  nick_name: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
}

onMounted(async () => {
  await Promise.all([fetchUsers(), fetchRoles()])
})

async function fetchUsers() {
  loading.value = true
  try { users.value = await request.get('/users') } catch { users.value = [] }
  finally { loading.value = false }
}

async function fetchRoles() {
  try { roles.value = await request.get('/roles') } catch { roles.value = [] }
}

function handleEdit(row) {
  isEdit.value = true
  form.value = { account: row.account, nick_name: row.nick_name, email: row.email, role_id: row.role_id }
  showDialog.value = true
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定删除用户「${row.account}」？`, '确认').then(async () => {
    await request.delete(`/users/${row.id}`)
    ElMessage.success('删除成功')
    await fetchUsers()
  }).catch(() => {})
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (isEdit.value) {
    await request.put(`/users/${form.value.id}`, form.value)
  } else {
    await request.post('/users', form.value)
  }
  ElMessage.success('保存成功')
  showDialog.value = false
  await fetchUsers()
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 20px; color: #333; }
</style>