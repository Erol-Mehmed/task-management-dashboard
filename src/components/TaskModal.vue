<script setup lang="ts">
import { reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import type { PropType } from 'vue'

interface Task {
  id?: string | number
  title: string
  description?: string | null
  status?: 'To Do' | 'In Progress' | 'Done' | string | null
  due?: string | number | null
  [k: string]: unknown
}

const props = defineProps({
  visible: { type: Boolean, required: true },
  initial: { type: Object as PropType<Partial<Task> | null>, default: null },
  mode: { type: String as PropType<'create' | 'edit'>, default: 'edit' },
})

const emits = defineEmits<{
  (e: 'save', payload: Task): void
  (e: 'close'): void
}>()

const statusOptions = ['To Do', 'In Progress', 'Done'] as const

function toDateInputValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return ''
  let num: number | null = null
  if (typeof value === 'number') num = value
  else {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) num = parsed
  }
  if (num !== null) {
    if (num > 0 && num < 1e12) num = num * 1000
    const d = new Date(num)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
    return ''
  }
  const d2 = new Date(String(value))
  if (!isNaN(d2.getTime())) return d2.toISOString().slice(0, 10)
  return ''
}

function normalizeDueFromInput(value: string): string | null {
  if (!value) return null
  // keep ISO date string (YYYY-MM-DD)
  return value
}

/* local form state */
const form = reactive({
  title: '',
  description: '',
  status: 'To Do' as string,
  dueInput: '' as string,
})

/* reset form when opened or initial changes */
watch(
  () => [props.visible, props.initial],
  ([visible]) => {
    if (visible) {
      form.title = String(props.initial?.title ?? '')
      form.description = props.initial?.description ?? ''
      form.status = (props.initial?.status as string) ?? 'To Do'
      form.dueInput = toDateInputValue(props.initial?.due)
    }
  },
  { immediate: true },
)

/* validation */
const titleValid = computed(() => form.title.trim().length > 0)
const dueValid = computed(() => {
  if (!form.dueInput) return true
  const d = new Date(form.dueInput)
  return !isNaN(d.getTime())
})
const formValid = computed(() => titleValid.value && dueValid.value)

/* actions */
function close() {
  emits('close')
}

function save() {
  if (!formValid.value) return
  const payload: Task = {
    ...(props.initial ?? {}),
    title: form.title.trim(),
    description: form.description === '' ? null : form.description,
    status: form.status,
    due: normalizeDueFromInput(form.dueInput),
  }
  emits('save', payload)
  emits('close')
}

/* keyboard: Escape to close */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div v-if="visible" class="task-modal" role="dialog" aria-modal="true" aria-label="Task form">
    <div class="modal-backdrop" @click="close" aria-hidden="true"></div>

    <div class="modal-panel" @click.stop>
      <header class="modal-header">
        <h2>{{ props.mode === 'create' ? 'Create Task' : 'Edit Task' }}</h2>
        <button class="close" @click="close" aria-label="Close">✕</button>
      </header>

      <form class="modal-body" @submit.prevent="save" novalidate>
        <label class="form-row">
          <span>Title *</span>
          <input v-model="form.title" type="text" required :class="{ invalid: !titleValid }" />
          <small v-if="!titleValid" class="error">Title is required.</small>
        </label>

        <label class="form-row">
          <span>Description</span>
          <textarea v-model="form.description" rows="4"></textarea>
        </label>

        <label class="form-row">
          <span>Status</span>
          <select v-model="form.status">
            <option v-for="opt in statusOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>

        <label class="form-row">
          <span>Due Date</span>
          <input v-model="form.dueInput" type="date" :class="{ invalid: !dueValid }" />
          <small v-if="!dueValid" class="error">Enter a valid date.</small>
        </label>

        <div class="form-actions">
          <button type="button" class="btn ghost" @click="close">Cancel</button>
          <button type="submit" class="btn primary" :disabled="!formValid">
            {{ props.mode === 'create' ? 'Create' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.task-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;

  .modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
  }

  .modal-panel {
    position: relative;
    width: 100%;
    max-width: 640px;
    background: var(--color-bg);
    border-radius: 8px;
    padding: 0.5rem;
    z-index: 70;
    box-shadow: var(--shadow-hover);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    border-bottom: 1px solid var(--panel-border);

    h2 {
      margin: 0;
      font-size: 1.1rem;
    }
    .close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
    }
  }

  .modal-body {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .form-row {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      span {
        font-size: 0.85rem;
        color: var(--color-heading-muted);
      }
      input,
      textarea,
      select {
        padding: 0.5rem;
        border: 1px solid var(--panel-border);
        border-radius: 6px;
        background: transparent;
        color: var(--color-text);
      }
      .error {
        color: var(--color-error);
        font-size: 0.85rem;
      }
      .invalid {
        outline: 1px solid var(--color-error);
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.5rem;

      .btn {
        padding: 0.45rem 0.75rem;
        border-radius: 6px;
        border: 1px solid transparent;
        cursor: pointer;
      }

      .ghost {
        background: transparent;
        border-color: var(--panel-border);
      }

      .primary {
        background: var(--link-color);
        color: #fff;
      }
    }
  }
}

@media (max-width: 720px) {
  .task-modal .modal-panel {
    margin: 0 0.5rem;
  }
}
</style>
