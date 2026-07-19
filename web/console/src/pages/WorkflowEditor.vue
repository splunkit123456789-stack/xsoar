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
        <div class="panel-search">
          <el-input v-model="appSearch" placeholder="搜索 APP" size="small" prefix-icon="Search" />
        </div>
        <div class="app-list">
          <div
            v-for="app in filteredApps"
            :key="app.code"
            class="app-item"
            draggable="true"
            @dragstart="onDragStart($event, app)"
            :data-testid="`app-node-${app.code}`"
          >
            <div class="app-name">{{ app.name }}</div>
            <div class="app-type">{{ app.type }}</div>
          </div>
        </div>
      </div>

      <!-- 中间画布（Vue Flow） -->
      <div class="canvas-wrapper">
        <VueFlow
          :nodes="flowNodes"
          :edges="flowEdges"
          @nodes-change="onNodesChange"
          @edges-change="onEdgesChange"
          @drop="onDrop"
          @dragover="onDragOver"
          fit-view-on-init
          class="flow-canvas"
          data-testid="editor-canvas"
        >
          <Background />
          <Controls />
          <template #node-custom="nodeProps">
            <div class="flow-node" :data-testid="`canvas-node-${nodeProps.id}`">
              <div class="flow-node-header">
                <span class="flow-node-label">{{ nodeProps.data.label }}</span>
                <el-icon class="flow-node-remove" @click="removeNode(nodeProps.id)"><Close /></el-icon>
              </div>
              <div class="flow-node-body">
                <div v-for="(val, key) in nodeProps.data.args" :key="key" class="flow-node-arg">
                  <label>{{ key }}</label>
                  <el-input v-model="nodeProps.data.args[key]" size="small" data-testid="input-param-name" />
                </div>
              </div>
            </div>
          </template>
        </VueFlow>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check, VideoPlay, Close } from '@element-plus/icons-vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { useWorkflowStore } from '@/stores/workflow'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const workflowStore = useWorkflowStore()
const appStore = useAppStore()

const workflowName = ref('未命名剧本')
const executing = ref(false)
const isNew = route.params.uuid === 'new'
const appSearch = ref('')

const { nodes: flowNodes, edges: flowEdges, onNodesChange, onEdgesChange, addNodes, addEdges, toObject } = useVueFlow({ id: 'wf' })

const filteredApps = computed(() => {
  const q = appSearch.value.toLowerCase()
  if (!q) return appStore.apps
  return appStore.apps.filter(a => a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q))
})

onMounted(async () => {
  await appStore.fetchList()
  if (!isNew) {
    const wf = await workflowStore.fetchDetail(route.params.uuid)
    workflowName.value = wf.name
  }
})

function onDragStart(e, app) {
  e.dataTransfer.setData('application/appcode', app.code)
  e.dataTransfer.setData('application/appname', app.name)
  e.dataTransfer.setData('application/action', app.actions?.[0]?.func || '')
  e.dataTransfer.effectAllowed = 'copy'
}

function onDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
}

function onDrop(e) {
  const appCode = e.dataTransfer.getData('application/appcode')
  const appName = e.dataTransfer.getData('application/appname')
  const action = e.dataTransfer.getData('application/action')
  if (!appCode) return

  const position = { x: e.clientX - 300, y: e.clientY - 100 }
  const nodeId = `node-${Date.now()}`

  addNodes({
    id: nodeId,
    type: 'custom',
    position,
    data: {
      label: appName,
      appCode,
      action,
      args: {},
    },
  })
}

function removeNode(id) {
  flowNodes.value = flowNodes.value.filter(n => n.id !== id)
  flowEdges.value = flowEdges.value.filter(e => e.source !== id && e.target !== id)
}

async function handleSave() {
  const flow = toObject()
  const data = {
    name: workflowName.value,
    flow_json: JSON.stringify(flow),
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
  width: 220px;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}
.panel-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}
.panel-search {
  margin-bottom: 8px;
}
.app-list {
  flex: 1;
  overflow-y: auto;
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
.canvas-wrapper {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
.flow-canvas {
  width: 100%;
  height: 100%;
}
.flow-node {
  width: 200px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  font-size: 13px;
}
.flow-node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #409eff;
  color: #fff;
}
.flow-node-remove {
  cursor: pointer;
  font-size: 12px;
}
.flow-node-body {
  padding: 8px 10px;
}
.flow-node-arg {
  margin-bottom: 6px;
}
.flow-node-arg label {
  display: block;
  font-size: 11px;
  color: #666;
  margin-bottom: 2px;
}
</style>