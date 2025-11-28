<script setup lang="ts">
import { ref, reactive } from 'vue'
import TasksTable from '../components/TasksTable.vue'
import TaskModal from '../components/TaskModal.vue'
import { useTasks } from '../composables/useTasks'

interface Task {
  id?: string | number
  title?: string
  description?: string | null
  status?: string | null
  due?: string | number | null
}

const res = useTasks() as {
  createTask?: (t: Partial<Task>) => Promise<Task>
  loadTasks?: () => Promise<void>
}

const showCreate = ref(false)
const saving = ref(false)

const initial = reactive({
  title: '',
  description: '',
  status: 'To Do',
  due: null as string | number | null,
})

function openCreate() {
  Object.assign(initial, { title: '', description: '', status: 'To Do', due: null })
  showCreate.value = true
}
function closeCreate() {
  showCreate.value = false
}

async function handleSave(payload: Partial<Task> | undefined) {
  if (!payload) {
    showCreate.value = false
    return
  }

  saving.value = true

  try {
    if (typeof res.createTask === 'function') {
      await res.createTask(payload)
    }
    if (typeof res.loadTasks === 'function') {
      await res.loadTasks()
    }
  } catch (err) {
     console.error(err)
  } finally {
    saving.value = false
    showCreate.value = false
  }
}
</script>

<template>
  <header class="dashboard-header">
    <h1>Dashboard</h1>
    <div class="actions">
      <button class="btn primary" @click="openCreate">Add Task</button>
    </div>
  </header>

  <TasksTable />

  <TaskModal
    mode="create"
    :visible="showCreate"
    :initial="initial"
    @save="handleSave"
    @close="closeCreate"
  />
</template>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.btn.primary {
  background: var(--link-color, #2563eb);
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
}
</style>
