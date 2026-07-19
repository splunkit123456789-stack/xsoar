import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/api/request'

export const useAppStore = defineStore('app', () => {
  const apps = ref([])
  const loading = ref(false)

  async function fetchList() {
    loading.value = true
    try {
      apps.value = await request.get('/apps')
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(code) {
    return await request.get(`/apps/${code}`)
  }

  return { apps, loading, fetchList, fetchDetail }
})