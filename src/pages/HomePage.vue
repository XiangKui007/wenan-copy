<script setup>
import { RouterLink } from 'vue-router'
import { HOME_TOOL_CARDS } from '@/config/tools.js'
</script>

<template>
  <div class="flex flex-1 flex-col">
    <section
      class="border-b border-stone-200/80 bg-gradient-to-b from-white to-stone-50 px-4 py-12 sm:px-6 sm:py-16"
    >
      <div class="mx-auto max-w-3xl text-center">
        <h1 class="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          实用工具一站聚合
        </h1>
        <p class="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-[15px]">
          文案灵感、校园图文、图片处理等工具持续扩充；纯前端本地处理，无需注册，打开即用。
        </p>
      </div>
    </section>

    <section class="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <h2 class="sr-only">工具列表</h2>
      <ul
        class="grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 xl:gap-8"
      >
        <li v-for="card in HOME_TOOL_CARDS" :key="card.path">
          <article
            class="flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm ring-1 transition hover:shadow-md"
            :class="card.accent"
          >
            <div class="flex flex-1 flex-col">
              <h3 class="text-lg font-semibold text-stone-900">
                {{ card.title }}
                <span
                  v-if="card.wip"
                  class="ml-2 align-middle text-xs font-normal text-amber-700"
                >
                  筹备中
                </span>
              </h3>
              <p class="mt-3 flex-1 text-sm leading-relaxed text-stone-600">
                {{ card.description }}
              </p>
              <RouterLink
                :to="card.path"
                class="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 sm:w-auto sm:self-start"
              >
                {{ card.cta }}
              </RouterLink>
            </div>
          </article>
        </li>
      </ul>
    </section>
  </div>
</template>
