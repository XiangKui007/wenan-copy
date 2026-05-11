<script setup>
import AppTopNav from '@/components/AppTopNav.vue'
import AppFooter from '@/components/AppFooter.vue'
import AppAdSlot from '@/components/AppAdSlot.vue'
</script>

<template>
  <div
    class="flex min-h-dvh flex-col bg-stone-50 text-stone-800 antialiased selection:bg-stone-200 selection:text-stone-900"
  >
    <AppTopNav />
    <AppAdSlot position="top" />
    <main class="flex min-h-0 flex-1 flex-col">
      <router-view />
    </main>
    <AppAdSlot position="bottom" />
    <AppFooter />
  </div>
</template>
