<template>
  <div class="dashboard" data-testid="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="card in statCards" :key="card.title">
        <el-card shadow="hover" class="stat-card" :data-testid="card.testid">
          <div class="stat-inner">
            <el-icon :size="32" :color="card.color">
              <component :is="card.icon" />
            </el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-title">{{ card.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card shadow="hover" data-testid="chart-execution-trend">
          <template #header>
            <span>最近 7 天执行趋势</span>
          </template>
          <div class="chart-placeholder">
            <el-empty description="暂无数据" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" data-testid="chart-status-distribution">
          <template #header>
            <span>执行状态分布</span>
          </template>
          <div class="chart-placeholder">
            <el-empty description="暂无数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'
import { Odometer, Grid, Document, CircleCheck } from '@element-plus/icons-vue'

const summary = ref({})

const statCards = ref([
  { title: '剧本总数', icon: 'Document', color: '#409eff', value: 0, testid: 'card-workflow-count' },
  { title: 'APP 总数', icon: 'Grid', color: '#67c23a', value: 0, testid: 'card-app-count' },
  { title: '今日执行', icon: 'Odometer', color: '#e6a23c', value: 0, testid: 'card-today-exec-count' },
  { title: '成功率', icon: 'CircleCheck', color: '#67c23a', value: '0%', testid: 'card-success-rate' },
])

async function fetchSummary() {
  try {
    summary.value = await request.get('/dashboard/summary')
    statCards.value[0].value = summary.value.workflow_count || 0
    statCards.value[1].value = summary.value.app_count || 0
    statCards.value[2].value = summary.value.today_execution_count || 0
    statCards.value[3].value = (summary.value.today_success_rate * 100).toFixed(1) + '%'
  } catch {
    // 使用默认值
  }
}

onMounted(fetchSummary)
</script>

<style scoped>
.dashboard {
  padding: 0;
}
.stats-row {
  margin-bottom: 20px;
}
.stat-card {
  cursor: pointer;
}
.stat-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-info {
  flex: 1;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}
.stat-title {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}
.chart-row {
  margin-bottom: 20px;
}
.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>