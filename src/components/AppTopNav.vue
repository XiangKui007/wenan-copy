<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { SITE_BRAND, TOOL_NAV_LINKS } from '@/config/tools.js'

const route = useRoute()
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-stone-200/90 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75"
  >
    <div
      class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5"
    >
      <RouterLink
        to="/"
        class="flex min-w-0 items-center gap-2 font-semibold tracking-tight text-stone-900 transition hover:text-stone-600"
      >
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-stone-800 to-stone-600 text-sm text-white shadow-sm"
          aria-hidden="true"
        >
          TS
        </span>
        <span class="truncate text-sm sm:text-base">{{ SITE_BRAND }}</span>
      </RouterLink>

      <nav
        class="flex max-w-full flex-1 flex-wrap items-center justify-end gap-x-1 gap-y-2 sm:justify-end sm:gap-x-2"
        aria-label="主导航"
      >
        <RouterLink
          to="/"
          class="rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm"
          :class="
            route.path === '/'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          "
        >
          首页
        </RouterLink>

        <RouterLink
          v-for="item in TOOL_NAV_LINKS"
          :key="item.path"
          :to="item.path"
          class="rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm"
          :class="
            route.path === item.path
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          "
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
