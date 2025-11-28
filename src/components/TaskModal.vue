<script setup lang="ts">
import { reactive, computed, watch, onMounted, onUnmounted, ref } from 'vue'
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
type Status = (typeof statusOptions)[number]

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
  return value
}

/* local form state */
const form = reactive<{
  title: string
  description: string
  status: Status
  dueInput: string
}>({
  title: '',
  description: '',
  status: 'To Do',
  dueInput: '',
})

const touched = reactive<{
  title: boolean
  description: boolean
  status: boolean
  due: boolean
}>({
  title: false,
  description: false,
  status: false,
  due: false,
})

const submitted = ref(false)

/* reset form when opened or initial changes */
watch(
  () => [props.visible, props.initial],
  ([visible]) => {
    if (visible) {
      form.title = String(props.initial?.title ?? '')
      form.description = String(props.initial?.description ?? '')
      form.status = ((props.initial?.status as Status) ?? 'To Do') as Status
      form.dueInput = toDateInputValue(props.initial?.due)

      // reset validation state on open
      touched.title = false
      touched.description = false
      touched.status = false
      touched.due = false
      submitted.value = false
    }
  },
  { immediate: true },
)

/* validation */
const titleValid = computed(() => form.title.trim().length > 0)
const descriptionValid = computed(() => form.description.trim().length > 0)
const statusValid = computed(() => statusOptions.includes(form.status))
const dueValid = computed(() => {
  if (!form.dueInput) return false
  const d = new Date(form.dueInput)
  return !isNaN(d.getTime())
})
const formValid = computed(
  () => titleValid.value && descriptionValid.value && statusValid.value && dueValid.value,
)

/* actions */
function close() {
  emits('close')
}

function save() {
  submitted.value = true
  // mark all fields as touched so errors render
  ;(Object.keys(touched) as Array<keyof typeof touched>).forEach((k) => {
    touched[k] = true
  })

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
          <input
            v-model="form.title"
            type="text"
            required
            :class="{ invalid: (touched.title || submitted) && !titleValid }"
            @blur="touched.title = true"
            :aria-invalid="(touched.title || submitted) && !titleValid ? 'true' : 'false'"
          />
          <small v-if="(touched.title || submitted) && !titleValid" class="error"
            >Title is required.</small
          >
        </label>

        <label class="form-row">
          <span>Description *</span>
          <textarea
            v-model="form.description"
            rows="4"
            required
            :class="{ invalid: (touched.description || submitted) && !descriptionValid }"
            @blur="touched.description = true"
            :aria-invalid="
              (touched.description || submitted) && !descriptionValid ? 'true' : 'false'
            "
          ></textarea>
          <small v-if="(touched.description || submitted) && !descriptionValid" class="error"
            >Description is required.</small
          >
        </label>

        <label class="form-row">
          <span>Status *</span>
          <select
            v-model="form.status"
            required
            :class="{ invalid: (touched.status || submitted) && !statusValid }"
            @blur="touched.status = true"
            :aria-invalid="(touched.status || submitted) && !statusValid ? 'true' : 'false'"
          >
            <option v-for="opt in statusOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <small v-if="(touched.status || submitted) && !statusValid" class="error"
            >Select a valid status.</small
          >
        </label>

        <label class="form-row">
          <span>Due Date *</span>
          <input
            v-model="form.dueInput"
            type="date"
            required
            :class="{ invalid: (touched.due || submitted) && !dueValid }"
            @blur="touched.due = true"
            :aria-invalid="(touched.due || submitted) && !dueValid ? 'true' : 'false'"
          />
          <small v-if="(touched.due || submitted) && !dueValid" class="error"
            >Enter a valid due date.</small
          >
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
