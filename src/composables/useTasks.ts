import { ref, onMounted } from 'vue'

export function useTasks() {
  const tasks = ref([])
  const loading = ref(true)

  const loadTasks = async () => {
    const res = await fetch('https://69283de8b35b4ffc5014cf94.mockapi.io/api/tasks')
    tasks.value = await res.json()
    loading.value = false
  }

  onMounted(loadTasks)

  return {
    tasks,
    loading,
    loadTasks
  }
}
