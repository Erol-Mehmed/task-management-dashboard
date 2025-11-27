<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue'
import { useTasks } from '../composables/useTasks.ts'

interface Task {
  id: string | number
  title: string
  description?: string | null
  status?: string | null
  due?: string | number | null
}

const error = ref<string | null>(null)

function truncateText(s?: string | null, max = 50) {
  if (!s) return '-'
  if (s.length <= max) return s
  return s.slice(0, max) + '…'
}

function normalizeStatus(raw?: string | boolean | null) {
  if (
    raw === true ||
    String(raw).toLowerCase() === 'done' ||
    String(raw).toLowerCase() === 'completed'
  )
    return 'Done'
  const s = String(raw ?? '').toLowerCase()
  if (s.includes('in') && s.includes('progress')) return 'In Progress'
  if (s.includes('progress') || s.includes('doing')) return 'In Progress'
  if (s.includes('todo') || s === 'open' || s === '') return 'To Do'
  if (s.includes('done') || s.includes('completed')) return 'Done'
  return 'To Do'
}

function formatDate(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return '-'

  let num: number | null = null
  if (typeof value === 'number') num = value
  else {
    {
      const parsed = Number(value)
      if (!Number.isNaN(parsed)) num = parsed
    }
  }

  if (num !== null) {
    if (num > 0 && num < 1e12) num = num * 1000
    const d = new Date(num)
    if (!isNaN(d.getTime())) return d.toLocaleDateString()
    return String(value)
  }

  const d = new Date(String(value))
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString()
}

function getErrorMessage(err: unknown) {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    const maybe = (err as { message?: unknown }).message
    if (typeof maybe === 'string') return maybe
  }
  return 'Failed to load'
}

const res = useTasks() as {
  tasks: Ref<Task[]>
  loading: Ref<boolean>
  loadTasks?: () => Promise<void>
}
const tasks = res.tasks
const loading = res.loading
const loadTasks = res.loadTasks

if (typeof loadTasks === 'function') {
  if (typeof window !== 'undefined') {
    loadTasks().catch((err) => {
      error.value = getErrorMessage(err)
    })
  } else {
    onMounted(() => {
      loadTasks().catch((err) => {
        error.value = getErrorMessage(err)
      })
    })
  }
}
</script>

<template>
  <div class="tasks-view">
    <h2>Tasks</h2>

    <div v-if="loading" class="info">Loading…</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <table v-else class="tasks-table" aria-live="polite">
      <thead>
        <tr>
          <th class="col-title">Title</th>
          <th class="col-desc">Description</th>
          <th class="col-status">Status</th>
          <th class="col-due">Due Date</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!tasks.length">
          <td colspan="4" class="empty">No tasks found.</td>
        </tr>

        <tr v-for="task in tasks" :key="task.id">
          <td class="col-title" :title="task.title">
            <div class="title-wrap">{{ task.title }}</div>
          </td>

          <td class="col-desc">
            <div v-if="task.description" class="desc-trunc">
              {{ truncateText(task.description, 120) }}
            </div>
            <span v-else>-</span>
          </td>

          <td class="col-status">{{ normalizeStatus(task.status) }}</td>
          <td class="col-due">{{ formatDate(task.due) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.tasks-view {
  padding: 1.25rem;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  color: #0f172a;
}

h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #0b1220;
}

.info {
  color: #334155;
}
.error {
  color: #b91c1c;
  margin-bottom: 0.75rem;
}

/* Table styling */
.tasks-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.35rem;
  thead th {
    text-align: left;
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
    color: #475569;
    font-weight: 600;
  }

  tbody tr {
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.03);
    transition:
      transform 0.08s ease,
      box-shadow 0.08s ease;
  }

  tbody tr:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(2, 6, 23, 0.06);
  }

  tbody td {
    padding: 0.75rem;
    vertical-align: top;
    border: none;
    font-size: 0.95rem;
    color: #0f172a;
  }

  .col-title {
    width: 28%;
    max-width: 32ch;
  }
  .col-desc {
    width: 48%;
    max-width: 60ch;
  }
  .col-status {
    width: 12%;
    color: #334155;
  }
  .col-due {
    width: 12%;
    color: #334155;
  }

  .title-wrap {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .desc-trunc {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #334155;
  }

  .link-btn {
    margin-left: 0.6rem;
    background: none;
    border: none;
    color: #0ea5a4;
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0;
  }

  .empty {
    text-align: center;
    padding: 1.25rem;
    color: #64748b;
    background: transparent;
    font-style: italic;
  }
}

/* small responsive adjustments */
@media (max-width: 720px) {
  .tasks-table thead {
    display: none;
  }
  .tasks-table tbody tr {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }
  .tasks-table tbody td {
    display: block;
    padding: 0.6rem 0.75rem;
  }
}
</style>
