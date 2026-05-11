<script setup>
import { SITE_BRAND } from '@/config/tools.js'
</script>

<template>
  <footer class="border-t border-stone-200/80 bg-stone-50/90 py-8 text-center text-xs text-stone-400">
    <p>
      © {{ new Date().getFullYear() }}
      {{ SITE_BRAND }}
      · 仅供学习与交流使用
    </p>
  </footer>
</template>
