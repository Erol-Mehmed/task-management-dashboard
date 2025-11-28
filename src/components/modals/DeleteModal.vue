<template>
  <div
    v-if="visible"
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div class="modal" role="document">
      <h3 id="modal-title" class="modal-title">{{ title }}</h3>
      <p class="modal-body">{{ message }}</p>
      <div class="modal-actions">
        <button class="btn" @click="onCancel" :disabled="loading">Cancel</button>
        <button
          class="btn danger"
          @click="onConfirm"
          :disabled="loading"
          aria-label="Confirm delete"
        >
          <span v-if="loading">Deleting…</span>
          <span v-else>Delete</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  visible: { type: Boolean, required: true },
  title: { type: String, default: 'Delete task' },
  message: {
    type: String,
    default: 'Are you sure you want to delete this task? This action cannot be undone.',
  },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

function onConfirm() {
  if (!props.loading) emit('confirm')
}
function onCancel() {
  if (!props.loading) emit('cancel')
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  z-index: 50;
}

.modal {
  background: var(--color-bg);
  padding: 1rem;
  border-radius: 8px;
  width: min(420px, 90%);
  box-shadow: var(--shadow-active);
}

.modal-title {
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.modal-body {
  margin: 0 0 1rem 0;
  color: var(--color-subtle);
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.4rem 0.7rem;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  background: transparent;
}

.btn.danger {
  background: var(--color-error);
  color: var(--color-white);
}

.btn[disabled] {
  opacity: 0.6;
  cursor: default;
}
</style>
