<template>
  <div class="role-list">
    <div class="page-header">
      <h2>角色管理</h2>
      <el-button type="primary" @click="showDialog = true">
        <el-icon><Plus /></el-icon>新增角色
      </el-button>
    </div>

    <el-card shadow="hover">
      <el-table :data="roles" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="name" label="角色名" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="is_builtin" label="内置" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_builtin ? 'danger' : 'info'" size="small">{{ row.is_builtin ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'info'" size="small">{{ row.status === 0 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" :disabled="row.is_builtin" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" :disabled="row.is_builtin" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑角色' : '新增角色'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="角色名" prop="name">
          <el-input v-model="form.name" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="权限点">
          <el-checkbox-group v-model="form.permissions">
            <el-checkbox v-for="p in allPermissions" :key="p.code" :label="p.code" border>{{ p.name }}</el-checkbox>
          </el-checkbox-group>
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

const roles = ref([])
const allPermissions = ref([])
const loading = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref({ name: '', description: '', permissions: [] })
const rules = { name: [{ required: true, message: '请输入角色名', trigger: 'blur' }] }

onMounted(async () => {
  await Promise.all([fetchRoles(), fetchPermissions()])
})

async function fetchRoles() {
  loading.value = true
  try { roles.value = await request.get('/roles') } catch { roles.value = [] }
  finally { loading.value = false }
}

async function fetchPermissions() {
  try { allPermissions.value = await request.get('/permissions') } catch { allPermissions.value = [] }
}

function handleEdit(row) {
  isEdit.value = true
  form.value = { name: row.name, description: row.description, permissions: [] }
  showDialog.value = true
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定删除角色「${row.name}」？`, '确认').then(async () => {
    await request.delete(`/roles/${row.id}`)
    ElMessage.success('删除成功')
    await fetchRoles()
  }).catch(() => {})
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (isEdit.value) {
    await request.put(`/roles/${form.value.id}`, form.value)
  } else {
    await request.post('/roles', form.value)
  }
  ElMessage.success('保存成功')
  showDialog.value = false
  await fetchRoles()
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 20px; color: #333; }
.el-checkbox { margin-bottom: 8px; }
</style>