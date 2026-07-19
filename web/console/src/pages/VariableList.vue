<template>
  <div class="variable-list">
    <div class="page-header">
      <h2>全局变量</h2>
      <el-button type="primary" @click="showDialog = true">
        <el-icon><Plus /></el-icon>新增变量
      </el-button>
    </div>

    <el-card shadow="hover">
      <el-table :data="variables" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="name" label="变量名" width="200" />
        <el-table-column prop="value" label="值" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="remarks" label="描述" min-width="200" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑变量' : '新增变量'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="变量名" prop="name">
          <el-input v-model="form.name" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="值" prop="value">
          <el-input v-model="form.value" type="textarea" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" style="width:100%">
            <el-option label="string" value="string" />
            <el-option label="number" value="number" />
            <el-option label="boolean" value="boolean" />
            <el-option label="json" value="json" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="remarks">
          <el-input v-model="form.remarks" />
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

const variables = ref([])
const loading = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref({ name: '', value: '', type: 'string', remarks: '' })
const rules = { name: [{ required: true, message: '请输入变量名', trigger: 'blur' }] }

onMounted(fetchVariables)

async function fetchVariables() {
  loading.value = true
  try { variables.value = await request.get('/variables') } catch { variables.value = [] }
  finally { loading.value = false }
}

function handleEdit(row) {
  isEdit.value = true
  form.value = { id: row.id, name: row.name, value: row.value, type: row.type, remarks: row.remarks }
  showDialog.value = true
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定删除变量「${row.name}」？`, '确认').then(async () => {
    await request.delete(`/variables/${row.id}`)
    ElMessage.success('删除成功')
    await fetchVariables()
  }).catch(() => {})
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (isEdit.value) {
    await request.put(`/variables/${form.value.id}`, form.value)
  } else {
    await request.post('/variables', form.value)
  }
  ElMessage.success('保存成功')
  showDialog.value = false
  await fetchVariables()
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 20px; color: #333; }
</style>