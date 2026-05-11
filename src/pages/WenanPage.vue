<script setup>
/**
 * 朋友圈高级文案生成器（工具页）
 */
import { computed, ref, watch } from 'vue'
import { CATEGORY_META, COPY_BY_CATEGORY } from '@/features/moments-copy/data/copywritingData.js'
import { pickRandomFromList } from '@/utils/randomPick.js'
import { copyTextToClipboard } from '@/utils/clipboard.js'

/** 生成按钮最短「加载」展示时间（ms），避免闪烁看不清且防止连点 */
const GENERATE_MIN_MS = 320

const activeCategoryId = ref(CATEGORY_META[0].id)
const displayedText = ref('')
const isGenerating = ref(false)
/** 用于 Transition 切换时触发动画 */
const textTransitionKey = ref(0)

const toastMessage = ref('')
const toastVisible = ref(false)
let toastTimer = null

const currentPool = computed(() => COPY_BY_CATEGORY[activeCategoryId.value] ?? [])

watch(activeCategoryId, () => {
  displayedText.value = ''
  textTransitionKey.value += 1
})

function showToast(message, durationMs = 2000) {
  toastMessage.value = message
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, durationMs)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function onGenerate() {
  if (isGenerating.value) return
  isGenerating.value = true
  const started = Date.now()
  const pool = currentPool.value
  try {
    const next = pickRandomFromList(pool) || '暂无可生成文案'
    const elapsed = Date.now() - started
    if (elapsed < GENERATE_MIN_MS) {
      await delay(GENERATE_MIN_MS - elapsed)
    }
    displayedText.value = next
    textTransitionKey.value += 1
  } finally {
    isGenerating.value = false
  }
}

async function onCopy() {
  const text = displayedText.value.trim()
  if (!text) {
    showToast('请先生成一条文案')
    return
  }
  const ok = await copyTextToClipboard(text)
  showToast(ok ? '✅ 复制成功！' : '复制失败，请长按文案手动复制')
}
</script>

<template>
  <div
    class="relative min-h-dvh overflow-x-hidden bg-stone-50 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-stone-800 antialiased selection:bg-stone-200 selection:text-stone-900"
  >
    <!-- 背景：极淡渐变缓慢位移，打破纯色单调 -->
    <div
      class="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-stone-100 via-amber-50/25 to-sky-100/30 bg-[length:200%_200%] motion-safe:animate-mesh-shift"
      aria-hidden="true"
    />
    <!-- Toast：全局轻提示（复制 / 引导） -->
    <div
      class="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-6"
      role="status"
      aria-live="polite"
    >
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-1 opacity-0"
      >
        <div
          v-if="toastVisible"
          class="pointer-events-auto max-w-md rounded-2xl border border-stone-200/90 bg-white/95 px-4 py-2.5 text-center text-sm text-stone-600 shadow-sm backdrop-blur-sm"
        >
          {{ toastMessage }}
        </div>
      </transition>
    </div>

    <div
      class="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pt-[max(1.75rem,env(safe-area-inset-top))] sm:px-6 sm:pb-14 sm:pt-12"
    >
      <!-- 站点标题 + 功能介绍（利于理解与收录） -->
      <header class="text-center">
        <!-- 品牌图形：SVG + 浮动 / 光晕 / 装饰环，无外链资源 -->
        <div
          class="relative mx-auto mb-6 flex h-[5.25rem] w-[5.25rem] items-center justify-center sm:mb-7 sm:h-[5.75rem] sm:w-[5.75rem]"
          aria-hidden="true"
        >
          <div
            class="absolute inset-[-6px] rounded-[1.35rem] bg-gradient-to-br from-amber-200/50 via-stone-200/40 to-sky-200/50 blur-md motion-safe:animate-logo-glow"
          />
          <div
            class="pointer-events-none absolute -inset-3 flex items-center justify-center motion-safe:animate-orbit-slow"
          >
            <div
              class="h-[6.25rem] w-[6.25rem] rounded-full border border-dashed border-stone-300/35 sm:h-[6.5rem] sm:w-[6.5rem]"
            />
          </div>
          <div
            class="relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-stone-200/90 motion-safe:animate-logo-float sm:h-[4.5rem] sm:w-[4.5rem]"
          >
            <svg
              class="h-11 w-11 text-stone-800 sm:h-12 sm:w-12"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 10h20a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3Z"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linejoin="round"
              />
              <path
                d="M17 18h14M17 24h10M17 30h12"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
              />
              <path
                d="M30 8v6M27 11h6"
                stroke-width="1.5"
                stroke-linecap="round"
                class="stroke-amber-600"
              />
            </svg>
          </div>
          <span
            class="absolute -right-0.5 top-1 h-2 w-2 rounded-full bg-amber-400/90 shadow-sm motion-safe:animate-sparkle"
          />
          <span
            class="absolute -left-0.5 bottom-2 h-1.5 w-1.5 rounded-full bg-sky-400/80 motion-safe:animate-sparkle [animation-delay:0.5s]"
          />
        </div>
        <h1
          class="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
        >
          朋友圈高级文案生成器
        </h1>
        <p
          class="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-[15px]"
        >
          面向微信朋友圈、状态签名等场景的免费在线文案工具：按心情与风格挑选分类，一键随机出句，再一键复制即可发布。无需注册、数据不上传，全部在浏览器本地完成。
        </p>
        <p
          class="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-stone-500 sm:text-sm"
        >
          内置治愈、高冷、emo、旅行、极简签名、励志、恋爱、沙雕、抖音热梗、职场梗、综艺名场面、古风、深夜等多类短句库，适合发动态、换签名、玩梗找灵感。
        </p>

        <!-- 分类导航 -->
        <nav
          class="mt-7 -mx-1 flex gap-2 overflow-x-auto pb-1 sm:mx-0 sm:mt-8 sm:flex-wrap sm:justify-center"
          aria-label="文案分类"
        >
          <button
            v-for="cat in CATEGORY_META"
            :key="cat.id"
            type="button"
            class="shrink-0 rounded-full border px-4 py-2.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 sm:py-2"
            :class="
              activeCategoryId === cat.id
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
            "
            :aria-pressed="activeCategoryId === cat.id"
            @click="activeCategoryId = cat.id"
          >
            {{ cat.label }}
          </button>
        </nav>
      </header>

      <main class="mt-6 flex flex-1 flex-col sm:mt-8">
        <!-- 文案卡片：垂直居中主文案，aria-live 便于读屏与动态摘要 -->
        <section
          class="mt-6 flex min-h-[min(52vh,22rem)] flex-1 flex-col rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:mt-8 sm:min-h-[min(48vh,26rem)] sm:p-8"
          aria-label="当前生成的朋友圈文案"
          aria-live="polite"
        >
          <p
            class="shrink-0 text-left text-xs font-medium uppercase tracking-wider text-stone-400"
          >
            {{
              CATEGORY_META.find((c) => c.id === activeCategoryId)?.label ??
              '文案'
            }}
          </p>

          <div
            class="flex flex-1 flex-col items-center justify-center py-6 sm:py-10"
          >
            <transition
              mode="out-in"
              enter-active-class="transition duration-300 ease-out"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-200 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-0.5"
            >
              <p
                :key="textTransitionKey"
                class="w-full max-w-prose text-center text-lg leading-relaxed text-stone-800 sm:text-xl sm:leading-relaxed"
                :class="{ 'text-stone-400': !displayedText }"
              >
                {{
                  displayedText ||
                  '选择分类后，点击下方「随机生成文案」开始。'
                }}
              </p>
            </transition>
          </div>
        </section>

        <!-- 操作区：按钮间距加大，降低误触 -->
        <section
          class="mt-8 flex flex-col gap-5 sm:mt-10 sm:flex-row sm:items-stretch sm:justify-center sm:gap-8"
          aria-label="文案操作"
        >
          <button
            type="button"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-4 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[13rem] sm:py-3.5"
            :disabled="isGenerating"
            @click="onGenerate"
          >
            <svg
              v-if="isGenerating"
              class="h-4 w-4 shrink-0 animate-spin text-white/90"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{{ isGenerating ? '生成中…' : '随机生成文案' }}</span>
          </button>
          <button
            type="button"
            class="w-full rounded-xl border border-stone-200 bg-white px-6 py-4 text-sm font-medium text-stone-800 transition hover:border-stone-300 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 sm:w-auto sm:min-w-[13rem] sm:py-3.5"
            @click="onCopy"
          >
            一键复制
          </button>
        </section>
      </main>
    </div>
  </div>
</template>
