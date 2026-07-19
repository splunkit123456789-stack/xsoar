import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/api/request'

export const useWorkflowStore = defineStore('workflow', () => {
  const workflows = ref([])
  const currentWorkflow = ref(null)
  const loading = ref(false)

  async function fetchList() {
    loading.value = true
    try {
      workflows.value = await request.get('/workflows')
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(uuid) {
    currentWorkflow.value = await request.get(`/workflows/${uuid}`)
    return currentWorkflow.value
  }

  async function create(data) {
    const result = await request.post('/workflows', data)
    await fetchList()
    return result
  }

  async function update(uuid, data) {
    await request.put(`/workflows/${uuid}`, data)
    await fetchList()
  }

  async function remove(uuid) {
    await request.delete(`/workflows/${uuid}`)
    await fetchList()
  }

  async function execute(uuid) {
    return await request.post(`/workflows/${uuid}/execute`, { trigger_type: 'manual' })
  }

  return { workflows, currentWorkflow, loading, fetchList, fetchDetail, create, update, remove, execute }
})