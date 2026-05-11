<script setup>
/**
 * JSON 在线格式化 — 纯前端本地处理
 */
import { nextTick, onMounted, ref, watch } from 'vue'
import { copyTextToClipboard } from '@/utils/clipboard.js'

const LS_THEME = 'json_format_theme_dark'

const inputText = ref('')
const outputText = ref('')
const inputRef = ref(null)

const parseError = ref('')
const errorIndex = ref(null)

const isDark = ref(false)

const toastMessage = ref('')
const toastVisible = ref(false)
let toastTimer = null

let validateTimer = null

function showToast(message, durationMs = 2000) {
  toastMessage.value = message
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, durationMs)
}

/** @param {unknown} err */
function extractErrorPosition(err) {
  const msg = String(err?.message || err || '')
  let m = msg.match(/position\s+(\d+)/i)
  if (m) return Number(m[1])
  m = msg.match(/column\s+(\d+)/i)
  if (m) return Number(m[1])
  return null
}

function validateJson(text) {
  const raw = String(text ?? '')
  if (!raw.trim()) {
    parseError.value = ''
    errorIndex.value = null
    return { ok: true, data: null }
  }
  try {
    const data = JSON.parse(raw)
    parseError.value = ''
    errorIndex.value = null
    return { ok: true, data }
  } catch (e) {
    parseError.value = e.message || 'JSON 语法错误'
    errorIndex.value = extractErrorPosition(e)
    return { ok: false, data: null }
  }
}

function scheduleValidate() {
  clearTimeout(validateTimer)
  validateTimer = setTimeout(() => {
    validateJson(inputText.value)
    focusErrorCaret()
  }, 220)
}

function focusErrorCaret() {
  if (errorIndex.value == null || !inputRef.value) return
  nextTick(() => {
    try {
      const el = inputRef.value
      const i = Math.min(errorIndex.value, inputText.value.length)
      el.focus()
      el.setSelectionRange(i, Math.min(i + 1, inputText.value.length))
    } catch {
      /* ignore */
    }
  })
}

watch(inputText, () => {
  scheduleValidate()
})

function applyPrettyToOutput(data) {
  outputText.value = JSON.stringify(data, null, 2)
}

function onFormat() {
  const r = validateJson(inputText.value)
  if (!r.ok) {
    showToast('请先修正 JSON 语法错误')
    focusErrorCaret()
    return
  }
  if (r.data === null && !inputText.value.trim()) {
    outputText.value = ''
    return
  }
  applyPrettyToOutput(r.data)
  inputText.value = outputText.value
  showToast('已格式化')
}

function onMinify() {
  const r = validateJson(inputText.value)
  if (!r.ok) {
    showToast('请先修正 JSON 语法错误')
    focusErrorCaret()
    return
  }
  if (r.data === null && !inputText.value.trim()) {
    outputText.value = ''
    return
  }
  outputText.value = JSON.stringify(r.data)
  showToast('已压缩为单行')
}

function onPaste() {
  setTimeout(() => {
    const t = inputText.value.trim()
    if (!t) return
    try {
      const data = JSON.parse(t)
      const pretty = JSON.stringify(data, null, 2)
      inputText.value = pretty
      outputText.value = pretty
      parseError.value = ''
      errorIndex.value = null
      showToast('已识别 JSON 并格式化')
    } catch {
      validateJson(inputText.value)
    }
  }, 0)
}

function onClear() {
  inputText.value = ''
  outputText.value = ''
  parseError.value = ''
  errorIndex.value = null
}

async function onCopy() {
  const t = outputText.value.trim()
  if (!t) {
    showToast('右侧暂无内容可复制')
    return
  }
  const ok = await copyTextToClipboard(t)
  showToast(ok ? '✅ 已复制到剪贴板' : '复制失败，请手动选择复制')
}

function toggleTheme() {
  isDark.value = !isDark.value
  try {
    localStorage.setItem(LS_THEME, isDark.value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

onMounted(() => {
  try {
    isDark.value = localStorage.getItem(LS_THEME) === '1'
  } catch {
    isDark.value = false
  }
})

const panelClass = () =>
  isDark.value
    ? 'border-stone-600 bg-stone-900 text-stone-100 placeholder:text-stone-500'
    : 'border-stone-200 bg-white text-stone-800 placeholder:text-stone-400'

const labelClass = () => (isDark.value ? 'text-stone-300' : 'text-stone-600')
</script>

<template>
  <div
    class="relative min-h-full overflow-x-hidden bg-stone-50 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-stone-800 antialiased selection:bg-stone-200 selection:text-stone-900"
  >
    <div
      class="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-stone-100 via-amber-50/25 to-sky-100/30 bg-[length:200%_200%] motion-safe:animate-mesh-shift"
      aria-hidden="true"
    />

    <!-- Toast -->
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
      class="mx-auto w-full max-w-6xl px-4 pt-[max(1.75rem,env(safe-area-inset-top))] sm:px-6 sm:pb-10 sm:pt-10"
    >
      <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="text-center sm:text-left">
          <h1 class="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            JSON 在线格式化
          </h1>
          <p class="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 sm:mx-0 sm:text-[15px]">
            粘贴或输入 JSON，本地校验与格式化，数据不会上传。中间为常用操作，右侧为结果预览。
          </p>
        </div>
        <button
          type="button"
          class="inline-flex shrink-0 items-center justify-center gap-2 self-center rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 sm:self-start"
          :aria-pressed="isDark"
          @click="toggleTheme"
        >
          <span class="text-base" aria-hidden="true">{{ isDark ? '☀️' : '🌙' }}</span>
          {{ isDark ? '浅色编辑区' : '深色编辑区' }}
        </button>
      </header>

      <!-- 三栏：输入 | 按钮 | 输出 -->
      <div
        class="mt-8 flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-6"
      >
        <!-- 左：输入 -->
        <section class="flex min-h-[min(42vh,22rem)] flex-1 flex-col lg:min-h-[420px]">
          <label :class="['mb-2 block text-sm font-medium', labelClass()]">JSON 输入</label>
          <textarea
            ref="inputRef"
            v-model="inputText"
            spellcheck="false"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            class="min-h-[min(42vh,22rem)] w-full flex-1 resize-y rounded-2xl border p-4 font-mono text-sm leading-relaxed outline-none ring-stone-400/0 transition focus:border-stone-500 focus:ring-2 focus:ring-stone-400/30 lg:min-h-[380px]"
            :class="[
              panelClass(),
              parseError ? 'border-red-400 ring-2 ring-red-200/80' : '',
            ]"
            placeholder='例如 {"name":"demo","ok":true}'
            @paste="onPaste"
          />
          <div
            v-if="parseError"
            class="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-800"
            role="alert"
          >
            <p class="font-medium">语法错误</p>
            <p class="mt-1 font-mono text-[11px] opacity-90">{{ parseError }}</p>
            <p v-if="errorIndex != null" class="mt-1 text-[11px] text-red-700">
              约位于第 {{ errorIndex }} 个字符附近（已尝试将光标移至该处）
            </p>
          </div>
          <p v-else class="mt-2 text-xs text-stone-500">实时校验输入内容；粘贴合法 JSON 后将自动排版。</p>
        </section>

        <!-- 中：操作 -->
        <div
          class="flex shrink-0 flex-row flex-wrap items-center justify-center gap-2 lg:w-[8.5rem] lg:flex-col lg:justify-start lg:pt-9"
          aria-label="JSON 操作"
        >
          <button
            type="button"
            class="w-full min-w-[6.5rem] rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2"
            @click="onFormat"
          >
            格式化
          </button>
          <button
            type="button"
            class="w-full min-w-[6.5rem] rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
            @click="onMinify"
          >
            压缩单行
          </button>
          <button
            type="button"
            class="w-full min-w-[6.5rem] rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
            @click="onCopy"
          >
            复制结果
          </button>
          <button
            type="button"
            class="w-full min-w-[6.5rem] rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-600 shadow-sm transition hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
            @click="onClear"
          >
            清空
          </button>
        </div>

        <!-- 右：输出 -->
        <section class="flex min-h-[min(42vh,22rem)] flex-1 flex-col lg:min-h-[420px]">
          <label :class="['mb-2 block text-sm font-medium', labelClass()]">结果预览</label>
          <textarea
            readonly
            :value="outputText"
            spellcheck="false"
            class="min-h-[min(42vh,22rem)] w-full flex-1 resize-y rounded-2xl border p-4 font-mono text-sm leading-relaxed outline-none lg:min-h-[380px]"
            :class="[panelClass(), 'cursor-default']"
            placeholder="格式化或压缩后的结果将显示在这里"
          />
        </section>
      </div>
    </div>
  </div>
</template>
