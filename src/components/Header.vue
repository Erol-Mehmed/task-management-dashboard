<script setup lang="ts">
defineOptions({ name: 'AppHeader' })
</script>

<template>
  <header class="header">
    <h1>Task Management Dashboard</h1>
  </header>
</template>

<style lang="scss" scoped>
@use '../assets/variables' as vars;

.header {
  background-color: vars.$header-bg;
  color: vars.$header-color;
  padding: 1rem;
  text-align: center;
}
</style>
