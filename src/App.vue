<script setup lang="ts">
import { RouterView } from 'vue-router'
import Header from './components/Header.vue'
</script>

<template>
  <div class="header-wrapper">
    <Header />
  </div>

  <main class="main-content">
    <RouterView />
  </main>
</template>

<style lang="scss" scoped>
$header-height: 64px;

.header-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: $header-height;
  background: var(--header-bg, #fff);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.main-content {
}
</style>
