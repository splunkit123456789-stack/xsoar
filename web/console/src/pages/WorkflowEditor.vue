<template>
  <div class="workflow-editor" data-testid="workflow-editor">
    <!-- 顶部工具栏 -->
    <div class="editor-header">
      <div class="header-left">
        <el-button @click="$router.push('/workflows')" text>
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <el-tag color="#bf423d" class="type-tag">{{ currentTypeName }}</el-tag>
        <el-input v-model="workflowName" placeholder="请输入剧本名称" class="name-input" data-testid="input-workflow-name" />
        <span class="work-remarks">{{ workflowRemarks }}</span>
      </div>
      <div class="header-right">
        <el-tooltip content="保存剧本" placement="top">
          <el-button @click="handleSave" type="primary" :loading="saveLoading" data-testid="btn-save-workflow">
            <el-icon><Cloudy /></el-icon>保存
          </el-button>
        </el-tooltip>
        <el-tooltip content="导出剧本" placement="top">
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>导出
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <div class="editor-body">
      <!-- 左侧面板 -->
      <div class="left-panel" :style="{ width: panelWidth }">
        <div class="panel-toggle" @click="togglePanel">
          <el-icon><DArrowLeft v-if="panelOpen" /><DArrowRight v-else /></el-icon>
        </div>

        <div v-show="panelOpen" class="panel-content">
          <!-- 系统组件 -->
          <div class="panel-section">
            <div class="section-title">系统组件</div>
            <div class="tools-grid">
              <div v-for="tool in systemTools" :key="tool.code" class="tool-item" draggable="true" @dragstart="onDragStart($event, tool)">
                <img :src="tool.icon" class="tool-icon" />
                <span class="tool-name">{{ tool.name }}</span>
              </div>
            </div>
          </div>

          <div class="panel-divider"></div>

          <!-- APP 组件 -->
          <div class="panel-section">
            <div class="section-title">APP 组件</div>
            <el-input v-model="appSearch" placeholder="搜索 APP" size="small" prefix-icon="Search" class="app-search" />
            <div class="tools-grid">
              <div v-for="app in filteredApps" :key="app.code" class="tool-item" draggable="true" @dragstart="onDragStart($event, app)">
                <el-avatar :size="40" :src="app.icon" class="tool-icon">{{ app.name.charAt(0) }}</el-avatar>
                <span class="tool-name">{{ app.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 画布区域 -->
      <div class="canvas-wrapper" ref="canvasWrapper">
        <VueFlow
          :nodes="flowNodes"
          :edges="flowEdges"
          @nodes-change="onNodesChange"
          @edges-change="onEdgesChange"
          @connect="onConnect"
          :default-edge-options="{ type: 'smoothstep', animated: false, style: { stroke: '#c7342e', strokeWidth: 2 } }"
          :node-types="nodeTypes"
          fit-view-on-init
          class="flow-canvas"
          data-testid="editor-canvas"
        >
          <Background :gap="20" />
          <Controls position="bottom-right" />
          <template #node-custom="props">
            <div class="wf-node" @click="selectNode(props.id)">
              <div class="wf-node-header" :style="{ background: nodeColor(props) }">
                <img v-if="props.data.icon" :src="props.data.icon" class="wf-node-icon" />
                <span class="wf-node-label">{{ props.data.label }}</span>
              </div>
              <div class="wf-node-body">
                <div v-for="(val, key) in props.data.args" :key="key" class="wf-node-arg">
                  <label>{{ key }}</label>
                  <el-input v-model="props.data.args[key]" size="small" @click.stop />
                </div>
              </div>
              <!-- 输入锚点 -->
              <div class="wf-anchor wf-anchor-input"></div>
              <!-- 输出锚点 -->
              <div class="wf-anchor wf-anchor-output"></div>
            </div>
          </template>
        </VueFlow>
      </div>

      <!-- 右侧参数面板 -->
      <div v-if="selectedNode" class="right-panel">
        <div class="panel-title">节点配置</div>
        <el-form size="small" label-position="top">
          <el-form-item label="节点名称">
            <el-input v-model="selectedNode.data.label" />
          </el-form-item>
          <el-form-item label="APP">
            <el-tag>{{ selectedNode.data.appCode || selectedNode.data.type }}</el-tag>
          </el-form-item>
          <el-form-item v-if="selectedNode.data.args" v-for="(val, key) in selectedNode.data.args" :key="key" :label="key">
            <el-input v-model="selectedNode.data.args[key]" />
          </el-form-item>
          <el-form-item>
            <el-button type="danger" size="small" @click="removeNode(selectedNode.id)">删除节点</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div class="bottom-toolbar">
      <div class="toolbar-left">
        <el-tooltip content="执行剧本" placement="top">
          <el-button type="primary" :loading="executing" @click="handleExecute" class="run-btn">
            <el-icon><VideoPlay /></el-icon>执行
          </el-button>
        </el-tooltip>
        <el-divider direction="vertical" />
        <el-tooltip content="撤销" placement="top">
          <el-button text @click="undo"><el-icon><Back /></el-icon></el-button>
        </el-tooltip>
        <el-tooltip content="重做" placement="top">
          <el-button text @click="redo"><el-icon><Right /></el-icon></el-button>
        </el-tooltip>
        <el-divider direction="vertical" />
        <el-tooltip content="放大" placement="top">
          <el-button text @click="zoomIn"><el-icon><ZoomIn /></el-icon></el-button>
        </el-tooltip>
        <el-tooltip content="缩小" placement="top">
          <el-button text @click="zoomOut"><el-icon><ZoomOut /></el-icon></el-button>
        </el-tooltip>
        <el-tooltip content="自适应" placement="top">
          <el-button text @click="fitView"><el-icon><FullScreen /></el-icon></el-button>
        </el-tooltip>
        <el-divider direction="vertical" />
        <el-tooltip content="删除选中" placement="top">
          <el-button text @click="deleteSelected"><el-icon><Delete /></el-icon></el-button>
        </el-tooltip>
      </div>
      <div class="toolbar-right">
        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Cloudy, Download, DArrowLeft, DArrowRight, VideoPlay, Back, Right, ZoomIn, ZoomOut, FullScreen, Delete, Search } from '@element-plus/icons-vue'
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
const workflowRemarks = ref('')
const executing = ref(false)
const saveLoading = ref(false)
const isNew = route.params.uuid === 'new'
const appSearch = ref('')
const selectedNode = ref(null)
const panelOpen = ref(true)
const panelWidth = computed(() => panelOpen.value ? '280px' : '40px')
const canvasWrapper = ref(null)

const { nodes: flowNodes, edges: flowEdges, onNodesChange, onEdgesChange, addNodes, addEdges, toObject, fitView, zoomIn, zoomOut, getZoomLevel, getNodes, getEdges, removeNodes, removeEdges } = useVueFlow({ id: 'wf' })

const zoomLevel = ref(1)

const systemTools = [
  { code: 'start', name: '开始', type: 'system', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234CAF50"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="white"/></svg>' },
  { code: 'end', name: '结束', type: 'system', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23F44336"><circle cx="12" cy="12" r="10"/><rect x="8" y="8" width="8" height="8" rx="2" fill="white"/></svg>' },
  { code: 'if', name: 'IF', type: 'system', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FF9800"><path d="M12 2L2 22h20L12 2z"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="10">IF</text></svg>' },
  { code: 'for', name: 'For', type: 'system', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239C27B0"><path d="M12 2L2 22h20L12 2z"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="8">For</text></svg>' },
  { code: 'timer', name: '定时器', type: 'system', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232196F3"><circle cx="12" cy="13" r="9" fill="none" stroke="white" stroke-width="2"/><path d="M12 9v4l3 3" stroke="white" stroke-width="2"/></svg>' },
  { code: 'webhook', name: 'WebHook', type: 'system', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300BCD4"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>' },
  { code: 'input', name: '用户输入', type: 'system', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23607D8B"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/></svg>' },
  { code: 'audit', name: '人工审计', type: 'system', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23E91E63"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' },
]

const filteredApps = computed(() => {
  const q = appSearch.value.toLowerCase()
  if (!q) return appStore.apps
  return appStore.apps.filter(a => a.name.toLowerCase().includes(q))
})

const currentTypeName = computed(() => '默认分类')

const nodeTypes = { custom: 'custom' }

onMounted(async () => {
  await appStore.fetchList()
  if (!isNew) {
    const wf = await workflowStore.fetchDetail(route.params.uuid)
    workflowName.value = wf.name
    workflowRemarks.value = wf.remarks || ''
  }
  nextTick(() => fitView())
})

function onDragStart(e, item) {
  const data = { code: item.code || item.app_dir, name: item.name, type: item.type || 'app', icon: item.icon }
  e.dataTransfer.setData('application/node', JSON.stringify(data))
  e.dataTransfer.effectAllowed = 'copy'
}

function onConnect(connection) {
  addEdges([{ ...connection, type: 'smoothstep', animated: false, style: { stroke: '#c7342e', strokeWidth: 2 } }])
}

function selectNode(id) {
  selectedNode.value = flowNodes.value.find(n => n.id === id)
  zoomLevel.value = getZoomLevel()
}

function removeNode(id) {
  removeNodes([id])
  selectedNode.value = null
}

function deleteSelected() {
  if (selectedNode.value) removeNode(selectedNode.value.id)
}

function undo() { /* 暂未实现 */ }
function redo() { /* 暂未实现 */ }

function nodeColor(props) {
  const colors = { start: '#4CAF50', end: '#F44336', if: '#FF9800', for: '#9C27B0', timer: '#2196F3', webhook: '#00BCD4', input: '#607D8B', audit: '#E91E63' }
  return colors[props.data.appCode] || colors[props.data.type] || '#409eff'
}

function togglePanel() { panelOpen.value = !panelOpen.value }

async function handleSave() {
  saveLoading.value = true
  const flow = toObject()
  try {
    if (isNew) await workflowStore.create({ name: workflowName.value, flow_json: JSON.stringify(flow), flow_data: '{}' })
    else await workflowStore.update(route.params.uuid, { name: workflowName.value, flow_json: JSON.stringify(flow), flow_data: '{}' })
    ElMessage.success('保存成功')
  } catch {}
  saveLoading.value = false
}

function handleExport() {
  const flow = toObject()
  const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${workflowName.value}.json`; a.click()
  URL.revokeObjectURL(url)
}

async function handleExecute() {
  if (isNew) { ElMessage.warning('请先保存剧本'); return }
  executing.value = true
  try {
    await workflowStore.execute(route.params.uuid)
    ElMessage.success('执行成功')
  } catch { ElMessage.error('执行失败') }
  executing.value = false
}

// 监听画布拖拽放置
document.addEventListener('drop', (e) => {
  const raw = e.dataTransfer.getData('application/node')
  if (!raw) return
  const data = JSON.parse(raw)
  const wrapper = canvasWrapper.value
  if (!wrapper) return
  const rect = wrapper.getBoundingClientRect()
  const position = { x: (e.clientX - rect.left - 100) / zoomLevel.value, y: (e.clientY - rect.top - 30) / zoomLevel.value }
  addNodes([{
    id: `node-${Date.now()}`,
    type: 'custom',
    position,
    data: { label: data.name, appCode: data.code, type: data.type, icon: data.icon, args: {} },
  }])
})
</script>

<style scoped>
.workflow-editor { height: 100vh; display: flex; flex-direction: column; background: #f0f2f5; }
.editor-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background: #fff; border-bottom: 1px solid #e8e8e8; }
.header-left { display: flex; align-items: center; gap: 8px; flex: 1; }
.name-input { width: 240px; }
.type-tag { color: #fff; border: none; }
.work-remarks { color: #999; font-size: 12px; }
.editor-body { flex: 1; display: flex; overflow: hidden; position: relative; }
.left-panel { background: #fff; border-right: 1px solid #e8e8e8; display: flex; transition: width 0.3s; position: relative; overflow: hidden; }
.panel-toggle { position: absolute; right: 0; top: 50%; transform: translateY(-50%); z-index: 10; cursor: pointer; padding: 8px 2px; background: #f5f5f5; border-radius: 4px 0 0 4px; }
.panel-content { flex: 1; overflow-y: auto; padding: 12px; }
.panel-section { margin-bottom: 12px; }
.section-title { font-size: 13px; font-weight: bold; color: #333; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #eee; }
.tools-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.tool-item { display: flex; flex-direction: column; align-items: center; padding: 8px 4px; border-radius: 8px; cursor: grab; background: #f8f9fa; transition: all 0.2s; }
.tool-item:hover { background: #e8f0fe; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.tool-icon { width: 36px; height: 36px; border-radius: 8px; margin-bottom: 4px; }
.tool-name { font-size: 11px; color: #333; text-align: center; line-height: 1.2; }
.app-search { margin-bottom: 8px; }
.panel-divider { height: 1px; background: #eee; margin: 8px 0; }
.canvas-wrapper { flex: 1; position: relative; }
.flow-canvas { width: 100%; height: 100%; }
.wf-node { width: 180px; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 2px solid transparent; transition: border-color 0.2s; position: relative; }
.wf-node:hover { border-color: #409eff; }
.wf-node-header { display: flex; align-items: center; gap: 6px; padding: 6px 10px; color: #fff; font-size: 12px; }
.wf-node-icon { width: 20px; height: 20px; border-radius: 4px; }
.wf-node-label { font-weight: 500; }
.wf-node-body { padding: 6px 10px; }
.wf-node-arg { margin-bottom: 4px; }
.wf-node-arg label { display: block; font-size: 11px; color: #666; margin-bottom: 2px; }
.wf-anchor { width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; position: absolute; }
.wf-anchor-input { top: 50%; left: -7px; transform: translateY(-50%); background: #4CAF50; }
.wf-anchor-output { top: 50%; right: -7px; transform: translateY(-50%); background: #c7342e; }
.right-panel { width: 260px; background: #fff; border-left: 1px solid #e8e8e8; padding: 12px; overflow-y: auto; }
.right-panel .panel-title { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #409eff; }
.bottom-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 6px 16px; background: #fff; border-top: 1px solid #e8e8e8; }
.toolbar-left { display: flex; align-items: center; gap: 4px; }
.run-btn { background: #c7342e; border-color: #c7342e; }
.run-btn:hover { background: #d32f2f; border-color: #d32f2f; }
.zoom-level { font-size: 12px; color: #999; }
</style>