<template>
  <div class="workflow-list">
    <div class="page-header">
      <h2>剧本管理</h2>
      <el-button type="primary" @click="handleCreate" data-testid="btn-create-workflow">
        <el-icon><Plus /></el-icon>新建剧本
      </el-button>
    </div>

    <el-card shadow="hover">
      <el-table :data="workflowStore.workflows" v-loading="workflowStore.loading" stripe style="width: 100%" data-testid="workflow-list">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="剧本名称" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="handleEdit(row)">{{ row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column prop="update_time" label="更新时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useWorkflowStore } from '@/stores/workflow'

const router = useRouter()
const workflowStore = useWorkflowStore()

onMounted(() => {
  workflowStore.fetchList()
})

function handleCreate() {
  router.push('/workflows/new')
}

function handleEdit(row) {
  router.push(`/workflows/${row.uuid}`)
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除剧本「${row.name}」？`, '确认删除')
    await workflowStore.remove(row.uuid)
    ElMessage.success('删除成功')
  } catch {
    // 取消操作
  }
}
</script>

<style scoped>
.workflow-list {
  padding: 0;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}
</style>