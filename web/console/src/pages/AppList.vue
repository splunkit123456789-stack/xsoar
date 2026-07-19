<template>
  <div class="app-list">
    <div class="page-header">
      <h2>APP 管理</h2>
    </div>

    <el-card shadow="hover">
      <el-table :data="appStore.apps" v-loading="appStore.loading" stripe style="width: 100%" data-testid="app-list">
        <el-table-column label="图标" width="80">
          <template #default="{ row }">
            <el-avatar :size="36" :src="row.icon">
              {{ row.name?.charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="150" data-testid="app-name" />
        <el-table-column prop="version" label="版本" width="100" data-testid="app-version" />
        <el-table-column prop="type" label="类型" width="120" data-testid="app-type" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'info'" size="small">
              {{ row.status === 'enabled' ? '已启用' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

onMounted(() => {
  appStore.fetchList()
})

function handleDetail(row) {
  // 弹窗展示 APP 详情
}
</script>

<style scoped>
.app-list {
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