<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: string
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'default',
    disabled: false,
    type: 'button',
  },
)

const emit = defineEmits<{
  (e: 'click', ev: MouseEvent): void
}>()

const variantClass = computed(() => `btn--${props.variant}`)
</script>

<template>
  <button
    :class="['btn', variantClass]"
    :disabled="props.disabled"
    :type="props.type"
    @click="(e) => emit('click', e)"
  >
    <slot />
  </button>
</template>

<style scoped lang="scss">
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font: inherit;
}

.btn--default {
  background: var(--btn-bg);
  color: var(--btn-color);
}
.btn--primary {
  background: var(--link-color);
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
