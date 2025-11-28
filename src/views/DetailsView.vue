<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, type Ref, isRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TaskModal from '../components/TaskModal.vue'
import BaseButton from '../components/BaseButton.vue'
import { useTasks } from '../composables/useTasks'

interface Task {
  id: string | number
  title: string
  description?: string | null
  status?: string | null
  due?: string | number | null
  [k: string]: unknown
}

interface UseTasksReturn {
  tasks: Ref<Task[]>
  loading?: Ref<boolean> | boolean
  loadTasks?: () => Promise<void>
  updateTask?: (id: string | number, payload: Partial<Task>) => Promise<Task | void>
  createTask?: (t: Partial<Task>) => Promise<Task>
}

const route = useRoute()
const router = useRouter()

const idParam = computed(() => String(route.params.id || ''))

const res = useTasks() as unknown as UseTasksReturn
const tasks = res.tasks
const loading = res.loading

const error = ref<string | null>(null)
const saving = ref(false)
const showEdit = ref(false)

const isLoading = computed(() => {
  if (loading === undefined) return false
  if (isRef(loading)) return Boolean(loading.value)
  return Boolean(loading)
})

const task = computed<Task | undefined>(() =>
  Array.isArray(tasks?.value) ? tasks.value.find((t) => String(t.id) === idParam.value) : undefined,
)

function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    const maybe = (err as { message?: unknown }).message
    if (typeof maybe === 'string') return maybe
  }
  return 'An unexpected error occurred'
}

onMounted(() => {
  if (
    (!tasks || !Array.isArray(tasks.value) || tasks.value.length === 0) &&
    typeof res.loadTasks === 'function'
  ) {
    res.loadTasks().catch((err: unknown) => {
      error.value = getErrorMessage(err) || 'Failed to load tasks'
    })
  }
})

const edited = reactive<Partial<Task>>({})

watch(
  task,
  (t) => {
    if (t) Object.assign(edited, { ...t })
  },
  { immediate: true },
)

function openEdit() {
  if (!task.value) return
  Object.assign(edited, { ...task.value })
  showEdit.value = true
}

function cancelEdit() {
  showEdit.value = false
  if (task.value) Object.assign(edited, { ...task.value })
}

async function handleSaveFromModal(payload: Partial<Task>) {
  const payloadTask = payload as Task
  saving.value = true
  try {
    if (typeof res.updateTask === 'function') {
      await res.updateTask(payloadTask.id, payloadTask)
      if (typeof res.loadTasks === 'function') await res.loadTasks()
    } else if (Array.isArray(tasks?.value)) {
      const idx = tasks.value.findIndex((t) => String(t.id) === String(payloadTask.id))
      if (idx >= 0) tasks.value.splice(idx, 1, payloadTask)
    }
    showEdit.value = false
  } catch (err: unknown) {
    error.value = getErrorMessage(err) || 'Save failed'
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.back()
}

function formatDue(value: unknown) {
  if (value === undefined || value === null || value === '') return '—'
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isNaN(num)) {
    const ts = num > 0 && num < 1e12 ? num * 1000 : num
    const d = new Date(ts)
    if (!isNaN(d.getTime())) return d.toLocaleString()
  }
  const d2 = new Date(String(value))
  if (!isNaN(d2.getTime())) return d2.toLocaleString()
  return String(value)
}
</script>

<template>
  <div class="details-view" aria-live="polite">
    <header class="header">
      <button class="back" @click="goBack" aria-label="Back">← Back</button>
      <h1>Task Details</h1>
      <div class="actions">
        <BaseButton v-if="task" variant="primary" @click="openEdit">Edit Task</BaseButton>
      </div>
    </header>

    <main v-if="task" class="content">
      <section class="field">
        <label>Title</label>
        <div class="value">{{ task.title }}</div>
      </section>

      <section class="field">
        <label>Description</label>
        <div class="value" v-if="task.description">{{ task.description }}</div>
        <div class="value muted" v-else>—</div>
      </section>

      <section class="grid">
        <div class="field">
          <label>Status</label>
          <div class="value">{{ task.status ?? 'To Do' }}</div>
        </div>

        <div class="field">
          <label>Due</label>
          <div class="value">{{ formatDue(task.due) }}</div>
        </div>
      </section>
    </main>

    <div v-else class="not-found">
      <p v-if="isLoading">Loading…</p>
      <p v-else-if="error">{{ error }}</p>
      <p v-else>Task not found.</p>
    </div>

    <TaskModal
      :visible="showEdit"
      :initial="edited"
      mode="edit"
      @save="handleSaveFromModal"
      @close="cancelEdit"
    />
  </div>
</template>

<style scoped lang="scss">
.details-view {
  padding: 1.25rem;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  color: var(--color-text);

  .header {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;

    .back {
      font-size: 1rem;
      background: none;
      border: none;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      color: var(--link-color);

      &:hover {
        text-decoration: underline;
      }

      &:active {
        opacity: 0.7;
      }
    }

    h1 {
      margin: 0;
      font-size: 1.25rem;
      flex: 1;
    }

    .actions {
      ::v-deep(.btn) {
        margin-left: 0.5rem;
      }
    }
  }

  .content {
    background: var(--color-bg-contrast, transparent);
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 0 0 1px var(--panel-border);

    .field {
      margin-bottom: 0.75rem;
      label {
        display: block;
        font-size: 0.85rem;
        color: var(--color-heading-muted);
        margin-bottom: 0.25rem;
      }
      .value {
        font-size: 1rem;
        color: var(--color-text);
      }
      .muted {
        color: var(--color-subtle);
        font-style: italic;
      }
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
  }

  .not-found {
    padding: 1rem;
    color: var(--color-subtle);
  }
}

@media (max-width: 720px) {
  .details-view {
    .content {
      padding: 0.75rem;
    }
    .grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
