<template>
  <div class="workflow-editor" data-testid="workflow-editor">
    <div class="editor-header">
      <div class="header-left">
        <el-button @click="$router.push('/workflows')" text>
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <el-input
          v-model="workflowName"
          placeholder="请输入剧本名称"
          class="name-input"
          data-testid="input-workflow-name"
        />
      </div>
      <div class="header-right">
        <el-button @click="handleSave" type="primary" data-testid="btn-save-workflow">
          <el-icon><Check /></el-icon>保存
        </el-button>
        <el-button @click="handleExecute" type="success" :loading="executing" data-testid="btn-execute">
          <el-icon><VideoPlay /></el-icon>执行
        </el-button>
      </div>
    </div>

    <div class="editor-body">
      <!-- 左侧 APP 库 -->
      <div class="app-panel">
        <div class="panel-title">APP 库</div>
        <div class="app-list">
          <div
            v-for="app in appStore.apps"
            :key="app.code"
            class="app-item"
            draggable="true"
            :data-testid="`app-node-${app.code}`"
          >
            <div class="app-name">{{ app.name }}</div>
            <div class="app-type">{{ app.type }}</div>
          </div>
        </div>
      </div>

      <!-- 中间画布 -->
      <div class="canvas-area" data-testid="editor-canvas">
        <div v-if="nodes.length === 0" class="canvas-empty">
          <el-empty description="从左侧拖拽 APP 到此处开始编排" />
        </div>
        <div v-for="(node, index) in nodes" :key="node.id" class="canvas-node" data-testid="canvas-node">
          <div class="node-header">
            <span class="node-label">{{ node.name }}</span>
            <el-icon class="node-remove" @click="removeNode(index)"><Close /></el-icon>
          </div>
          <div class="node-body">
            <div v-for="(arg, key) in node.args" :key="key" class="node-arg">
              <label>{{ key }}</label>
              <el-input v-model="node.args[key]" size="small" data-testid="input-param-name" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check, VideoPlay, Close } from '@element-plus/icons-vue'
import { useWorkflowStore } from '@/stores/workflow'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const workflowStore = useWorkflowStore()
const appStore = useAppStore()

const workflowName = ref('未命名剧本')
const nodes = ref([])
const executing = ref(false)
const isNew = route.params.uuid === 'new'

onMounted(async () => {
  await appStore.fetchList()
  if (!isNew) {
    const wf = await workflowStore.fetchDetail(route.params.uuid)
    workflowName.value = wf.name
    if (wf.flow_json) {
      try {
        nodes.value = JSON.parse(wf.flow_json).nodes || []
      } catch {}
    }
  }
})

async function handleSave() {
  const data = {
    name: workflowName.value,
    flow_json: JSON.stringify({ nodes: nodes.value }),
    flow_data: '{}',
  }
  try {
    if (isNew) {
      await workflowStore.create(data)
    } else {
      await workflowStore.update(route.params.uuid, data)
    }
    ElMessage.success('保存成功')
  } catch {}
}

async function handleExecute() {
  if (isNew) {
    ElMessage.warning('请先保存剧本')
    return
  }
  executing.value = true
  try {
    await workflowStore.execute(route.params.uuid)
    ElMessage.success('执行成功')
  } catch {
    ElMessage.error('执行失败')
  } finally {
    executing.value = false
  }
}

function removeNode(index) {
  nodes.value.splice(index, 1)
}
</script>

<style scoped>
.workflow-editor {
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.name-input {
  width: 300px;
}
.header-right {
  display: flex;
  gap: 8px;
}
.editor-body {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow: hidden;
}
.app-panel {
  width: 200px;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  overflow-y: auto;
}
.panel-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}
.app-item {
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: grab;
  background: #f8f9fa;
  transition: background 0.2s;
}
.app-item:hover {
  background: #e8f0fe;
}
.app-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}
.app-type {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}
.canvas-area {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-content: flex-start;
}
.canvas-empty {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
.canvas-node {
  width: 220px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #409eff;
  color: #fff;
  font-size: 13px;
}
.node-remove {
  cursor: pointer;
  font-size: 14px;
}
.node-body {
  padding: 8px 12px;
}
.node-arg {
  margin-bottom: 8px;
}
.node-arg label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
</style>