<template>
  <div class="log-list">
    <div class="page-header">
      <h2>执行日志</h2>
    </div>

    <el-card shadow="hover">
      <el-table :data="logs" v-loading="loading" stripe style="width: 100%" data-testid="logs-list">
        <el-table-column prop="exec_id" label="执行 ID" width="200" />
        <el-table-column prop="workflow_name" label="剧本名称" min-width="150" />
        <el-table-column prop="trigger_type" label="触发方式" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="triggerTypeMap[row.trigger_type]">
              {{ row.trigger_type === 'manual' ? '手动' : row.trigger_type === 'timer' ? '定时' : 'Webhook' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'" size="small">
              {{ row.status === 'success' ? '成功' : row.status === 'failed' ? '失败' : '运行中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="180" />
        <el-table-column prop="duration_ms" label="耗时(ms)" width="100" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleDetail(row)" data-testid="log-entry">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 执行详情弹窗 -->
    <el-dialog v-model="detailVisible" title="执行详情" width="800px" data-testid="logs-detail">
      <div v-if="currentDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="执行 ID" data-testid="node-detail-status">{{ currentDetail.log.exec_id }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentDetail.log.status }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ currentDetail.log.start_time }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ currentDetail.log.end_time }}</el-descriptions-item>
          <el-descriptions-item label="耗时" data-testid="node-detail-duration">{{ currentDetail.log.duration_ms }}ms</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin: 16px 0 8px;">节点详情</h4>
        <el-table :data="currentDetail.nodes" stripe size="small">
          <el-table-column prop="node_id" label="节点 ID" width="120" />
          <el-table-column prop="app_code" label="APP" width="100" />
          <el-table-column prop="action" label="动作" width="100" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="input" label="输入" min-width="150" show-overflow-tooltip data-testid="node-detail-input" />
          <el-table-column prop="output" label="输出" min-width="150" show-overflow-tooltip data-testid="node-detail-output" />
          <el-table-column prop="error" label="错误" min-width="150" show-overflow-tooltip />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'

const logs = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const currentDetail = ref(null)

const triggerTypeMap = {
  manual: 'primary',
  timer: 'warning',
  webhook: 'info',
}

onMounted(fetchLogs)

async function fetchLogs() {
  loading.value = true
  try {
    logs.value = await request.get('/logs')
  } catch {
    logs.value = []
  } finally {
    loading.value = false
  }
}

async function handleDetail(row) {
  try {
    currentDetail.value = await request.get(`/logs/${row.exec_id}`)
    detailVisible.value = true
  } catch {}
}
</script>

<style scoped>
.log-list {
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