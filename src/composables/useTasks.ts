import { ref, onMounted } from 'vue'

export interface Task {
  id?: string | number
  title?: string
  description?: string | null
  status?: string | null
  due?: string | number | null
}

const API_BASE = 'https://69283de8b35b4ffc5014cf94.mockapi.io/api/tasks'

export function useTasks() {
  const tasks = ref<Task[]>([])
  const loading = ref(true)

  const loadTasks = async () => {
    const res = await fetch(API_BASE)
    tasks.value = await res.json()
    loading.value = false
  }

  const createTask = async (payload: Partial<Task>): Promise<Task> => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const created: Task = await res.json()
    tasks.value = [created, ...tasks.value]

    return created
  }

  const updateTask = async (id: string | number, payload: Partial<Task>): Promise<Task> => {
    const url = `${API_BASE}/${id}`
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const updated: Task = await res.json()
    const idx = tasks.value.findIndex((t) => String(t.id) === String(id))
    if (idx !== -1) {
      tasks.value.splice(idx, 1, updated)
    } else {
      tasks.value = [updated, ...tasks.value]
    }

    return updated
  }

  const deleteTask = async (id: string | number): Promise<void> => {
    const url = `${API_BASE}/${id}`
    await fetch(url, { method: 'DELETE' })
    tasks.value = tasks.value.filter((t) => String(t.id) !== String(id))
  }

  onMounted(loadTasks)

  return {
    tasks,
    loading,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
  }
}
