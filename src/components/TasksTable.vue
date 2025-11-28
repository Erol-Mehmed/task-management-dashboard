<script setup lang="ts">
import { ref, computed, onMounted, type Ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useTasks } from '../composables/useTasks.ts'

interface Task {
  id: string | number
  title: string
  description?: string | null
  status?: string | null
  due?: string | number | null
}

const props = defineProps({
  showAdd: { type: Boolean, default: false },
})
const emits = defineEmits<{
  (e: 'create'): void
}>()

const router = useRouter()
const error = ref<string | null>(null)

function openTask(id: string | number) {
  router.push({ name: 'details', params: { id: String(id) } }).catch(() => {})
}

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

// Filters
const query = ref('')
const statusFilter = ref<'All' | 'To Do' | 'In Progress' | 'Done'>('All')
const statusOptions = ['All', 'To Do', 'In Progress', 'Done'] as const

const filteredTasks = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = Array.isArray(tasks?.value) ? tasks.value : []
  return list.filter((t) => {
    if (statusFilter.value !== 'All') {
      if (normalizeStatus(t.status) !== statusFilter.value) return false
    }
    if (!q) return true
    const title = String(t.title ?? '').toLowerCase()
    const desc = String(t.description ?? '').toLowerCase()
    return title.includes(q) || desc.includes(q)
  })
})

const expanded = reactive<Record<string, boolean>>({})

function isExpanded(id: string | number) {
  return !!expanded[String(id)]
}
function toggleExpanded(id: string | number) {
  const key = String(id)
  expanded[key] = !expanded[key]
}

function onCreate() {
  emits('create')
}

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
    <header class="tasks-header">
      <div class="left">
        <h2>Tasks</h2>
        <div class="filters">
          <input
            v-model="query"
            type="search"
            placeholder="Search title or description"
            aria-label="Search tasks"
            class="search"
          />
          <select v-model="statusFilter" aria-label="Filter by status" class="status-select">
            <option v-for="opt in statusOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
      </div>

      <div class="right">
        <button v-if="props.showAdd" class="btn" @click="onCreate">Add Task</button>
      </div>
    </header>

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
        <tr v-if="!filteredTasks.length">
          <td colspan="4" class="empty">No tasks found.</td>
        </tr>

        <tr
          v-for="task in filteredTasks"
          :key="task.id"
          class="clickable-row"
          role="link"
          :aria-label="`Open ${task.title}`"
          tabindex="0"
          @click="openTask(task.id)"
          @keydown.enter="openTask(task.id)"
        >
          <td class="col-title" :title="task.title">
            <div class="title-wrap">{{ task.title }}</div>
          </td>

          <td class="col-desc">
            <div v-if="task.description" :class="{ 'desc-trunc': !isExpanded(task.id) }">
              <template v-if="isExpanded(task.id)">
                {{ task.description }}
                <button
                  class="link-btn"
                  @click.stop="toggleExpanded(task.id)"
                  aria-label="Show less"
                >
                  Show less
                </button>
              </template>

              <template v-else>
                {{ truncateText(task.description, 50) }}
                <button
                  v-if="String(task.description).length > 50"
                  class="link-btn"
                  @click.stop="toggleExpanded(task.id)"
                  aria-label="Read more"
                >
                  Read more
                </button>
              </template>
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
  color: var(--color-text);

  .tasks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;

    .left {
      display: flex;
      gap: 1rem;
      align-items: center;

      h2 {
        margin: 0;
      }

      .filters {
        display: flex;
        gap: 0.5rem;
        align-items: center;

        .search {
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          border: 1px solid var(--panel-border);
          background: transparent;
          color: var(--color-text);
        }

        .status-select {
          padding: 0.35rem 0.5rem;
          border-radius: 6px;
          border: 1px solid var(--panel-border);
          background: transparent;
          color: var(--color-text);
        }
      }
    }

    .right {
      .btn {
        padding: 0.4rem 0.7rem;
        border-radius: 6px;
        background: var(--link-color);
        color: #fff;
        border: none;
        cursor: pointer;
      }
    }
  }

  .info {
    color: var(--color-subtle);
  }

  .error {
    color: var(--color-error);
    margin-bottom: 0.75rem;
  }

  .tasks-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 0.35rem;

    thead {
      th {
        text-align: left;
        padding: 0.5rem 0.75rem;
        font-size: 0.85rem;
        color: var(--color-heading-muted);
        font-weight: 600;
      }
    }

    tbody {
      tr {
        background: var(--color-bg);
        border-radius: 8px;
        box-shadow: 0 0 0 1px var(--panel-border);
        transition:
          transform 0.08s ease,
          box-shadow 0.08s ease;

        &:hover {
          transform: translateY(-2px);
          background: var(--color-bg-hover);
          box-shadow: var(--shadow-hover);
        }

        &:active {
          background: var(--color-bg-active);
          box-shadow: var(--shadow-active);
        }

        td {
          padding: 0.75rem;
          vertical-align: top;
          border: none;
          font-size: 0.95rem;
          color: var(--color-text);
        }
      }

      /* clickable row styling */
      .clickable-row {
        cursor: pointer;
      }
    }

    .col-title {
      width: 28%;
      max-width: 32ch;
    }

    .col-desc {
      width: 48%;
      max-width: 60ch;
    }

    .col-status,
    .col-due {
      width: 12%;
      color: var(--color-subtle);
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
      line-clamp: 3;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--color-subtle);
    }

    .link-btn {
      margin-left: 0.6rem;
      background: none;
      border: none;
      color: var(--link-color);
      cursor: pointer;
      font-size: 0.85rem;
      padding: 0;
    }

    .empty {
      text-align: center;
      padding: 1.25rem;
      color: var(--color-muted);
      background: transparent;
      font-style: italic;
    }

    @media (max-width: 720px) {
      thead {
        display: none;
      }

      tbody {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        tr {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.35rem;

          td {
            display: block;
            padding: 0.6rem 0.75rem;
          }
        }
      }
    }
  }
}
</style>
