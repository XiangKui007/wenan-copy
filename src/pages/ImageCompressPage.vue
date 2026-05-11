<script setup>
/**
 * 在线图片压缩 — 纯前端本地处理
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { saveAs } from 'file-saver'
import {
  compressImageFile,
  formatBytes,
  isSupportedImageMime,
  savingsMeta,
  supportsWebPEncode,
} from '@/utils/imageCompressor.js'

const ACCEPT = 'image/jpeg,image/png,image/webp'

const qualityPercent = ref(82)
const items = ref([])
const fileInputRef = ref(null)

/** 首批文件解析 / 压缩中 */
const isProcessing = ref(false)
/** 调节质量滑块后重新编码 */
const isRecompressing = ref(false)
const dragOver = ref(false)

const toastMessage = ref('')
const toastVisible = ref(false)
let toastTimer = null
let qualityDebounceTimer = null

function showToast(message, durationMs = 2200) {
  toastMessage.value = message
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, durationMs)
}

function revokeUrl(url) {
  if (url && String(url).startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    }
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const encodeHint = computed(() =>
  supportsWebPEncode()
    ? '输出 WebP（更小）；不支持 WebP 编码的环境将输出 JPEG。'
    : '当前浏览器将输出 JPEG；透明 PNG 将铺在白色背景上。',
)

const hasReadyItems = computed(() =>
  items.value.some((x) => x.status === 'done' && x.compressedBlob),
)

async function compressOne(item, q) {
  const ratio = Math.min(1, Math.max(0.1, q / 100))
  const out = await compressImageFile(item.file, ratio)
  revokeUrl(item.compressedPreviewUrl)
  item.compressedBlob = out.blob
  item.compressedPreviewUrl = URL.createObjectURL(out.blob)
  item.compressedSize = out.blob.size
  item.outputName = out.name
  item.meta = savingsMeta(item.originalSize, out.blob.size)
  item.status = 'done'
}

async function handleFiles(fileList) {
  const raw = Array.from(fileList || []).filter((f) => isSupportedImageMime(f.type))
  const skipped = Array.from(fileList || []).length - raw.length
  if (!raw.length) {
    if (fileList?.length) showToast('仅支持 JPG、PNG、WebP 格式')
    return
  }
  if (skipped > 0) {
    showToast(`已跳过 ${skipped} 个不支持的文件`)
  }

  isProcessing.value = true
  try {
    for (const file of raw) {
      const id = crypto.randomUUID()
      const originalPreviewUrl = URL.createObjectURL(file)
      const row = {
        id,
        file,
        originalSize: file.size,
        originalPreviewUrl,
        compressedBlob: null,
        compressedPreviewUrl: null,
        compressedSize: null,
        outputName: '',
        meta: null,
        status: 'compressing',
        errorMessage: '',
      }
      items.value.push(row)
      try {
        await compressOne(row, qualityPercent.value)
      } catch (e) {
        row.status = 'error'
        row.errorMessage = e?.message || '压缩失败'
        revokeUrl(row.compressedPreviewUrl)
        row.compressedPreviewUrl = null
      }
    }
  } finally {
    isProcessing.value = false
  }
}

function openPicker() {
  fileInputRef.value?.click()
}

function onInputChange(e) {
  const files = e.target.files
  if (files?.length) handleFiles(files)
  e.target.value = ''
}

function onDropZoneDrop(e) {
  e.preventDefault()
  dragOver.value = false
  const files = e.dataTransfer?.files
  if (files?.length) handleFiles(files)
}

function onDragOver(e) {
  e.preventDefault()
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}

async function recompressAll() {
  if (!items.value.length) return
  isRecompressing.value = true
  try {
    for (const row of items.value) {
      if (row.status === 'error') continue
      row.status = 'compressing'
      try {
        await compressOne(row, qualityPercent.value)
      } catch (e) {
        row.status = 'error'
        row.errorMessage = e?.message || '压缩失败'
        revokeUrl(row.compressedPreviewUrl)
        row.compressedPreviewUrl = null
      }
    }
  } finally {
    isRecompressing.value = false
  }
}

watch(qualityPercent, () => {
  if (!items.value.length) return
  clearTimeout(qualityDebounceTimer)
  qualityDebounceTimer = setTimeout(() => {
    recompressAll()
  }, 380)
})

function removeItem(id) {
  const i = items.value.findIndex((x) => x.id === id)
  if (i < 0) return
  const row = items.value[i]
  revokeUrl(row.originalPreviewUrl)
  revokeUrl(row.compressedPreviewUrl)
  items.value.splice(i, 1)
}

function clearAll() {
  for (const row of items.value) {
    revokeUrl(row.originalPreviewUrl)
    revokeUrl(row.compressedPreviewUrl)
  }
  items.value = []
}

function downloadOne(row) {
  if (!row.compressedBlob) return
  saveAs(row.compressedBlob, row.outputName || 'image.webp')
}

async function downloadAll() {
  const ready = items.value.filter((x) => x.status === 'done' && x.compressedBlob)
  if (!ready.length) return
  showToast(`开始下载 ${ready.length} 个文件…`, 1600)
  for (let i = 0; i < ready.length; i++) {
    saveAs(ready[i].compressedBlob, ready[i].outputName || `image-${i + 1}.webp`)
    if (i < ready.length - 1) await delay(220)
  }
}

onBeforeUnmount(() => {
  clearAll()
  if (toastTimer) clearTimeout(toastTimer)
  clearTimeout(qualityDebounceTimer)
})
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
      class="mx-auto flex w-full max-w-4xl flex-col px-4 pt-[max(1.75rem,env(safe-area-inset-top))] sm:px-6 sm:pb-10 sm:pt-10"
    >
      <header class="text-center">
        <h1 class="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          在线图片压缩
        </h1>
        <p class="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-[15px]">
          在浏览器内完成压缩，图片不会上传任何服务器。支持 JPG / PNG / WebP，可批量处理并对比体积。
        </p>
      </header>

      <!-- 上传 -->
      <section class="mt-8" aria-label="上传图片">
        <input
          ref="fileInputRef"
          type="file"
          class="hidden"
          :accept="ACCEPT"
          multiple
          @change="onInputChange"
        />
        <button
          type="button"
          class="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-12 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 enabled:cursor-pointer disabled:opacity-70 sm:py-14"
          :class="
            dragOver
              ? 'border-stone-500 bg-stone-100/80'
              : 'border-stone-300 bg-white/90 hover:border-stone-400 hover:bg-stone-50/90'
          "
          :disabled="isProcessing"
          @click="openPicker"
          @keydown.enter.prevent="openPicker"
          @dragover="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDropZoneDrop"
        >
          <span
            v-if="isProcessing"
            class="mb-3 inline-flex h-10 w-10 animate-spin rounded-full border-2 border-stone-200 border-t-stone-700"
            aria-hidden="true"
          />
          <span v-else class="mb-3 text-stone-500" aria-hidden="true">
            <svg class="mx-auto h-10 w-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M7 18a4 4 0 0 0 4-4 4 4 0 0 0 4 4M7 18H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2l2.5-3h5L17 5h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M7 18v-3m10 3v-3"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span class="text-sm font-medium text-stone-900">
            {{ isProcessing ? '正在读取并压缩…' : '点击选择或拖拽图片到此处' }}
          </span>
          <span class="mt-2 text-xs text-stone-500">支持 JPG、PNG、WebP · 可多选 · 单张建议不超过 40MB</span>
        </button>
      </section>

      <!-- 质量 -->
      <section
        v-if="items.length"
        class="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
        aria-label="压缩质量"
      >
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-stone-900">压缩质量</h2>
            <p class="mt-1 text-xs text-stone-500">
              {{ encodeHint }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span
              v-if="isRecompressing"
              class="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600"
            >
              <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-200 border-t-stone-700" />
              更新预览…
            </span>
            <span class="tabular-nums text-sm font-semibold text-stone-900">{{ qualityPercent }}%</span>
          </div>
        </div>
        <label class="mt-4 block">
          <span class="sr-only">压缩质量百分比</span>
          <input
            v-model.number="qualityPercent"
            type="range"
            min="10"
            max="100"
            step="1"
            class="h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-stone-900"
          />
          <div class="mt-2 flex justify-between text-[11px] text-stone-400">
            <span>更小体积</span>
            <span>更高画质</span>
          </div>
        </label>
      </section>

      <!-- 列表 -->
      <section v-if="items.length" class="mt-8 space-y-6" aria-label="压缩结果">
        <div
          v-for="row in items"
          :key="row.id"
          class="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm sm:p-6"
        >
          <div class="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-4">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-stone-900">{{ row.file.name }}</p>
              <dl class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
                <div>
                  <dt class="inline text-stone-400">原图</dt>
                  <dd class="inline tabular-nums">{{ formatBytes(row.originalSize) }}</dd>
                </div>
                <div v-if="row.status === 'done'">
                  <dt class="inline text-stone-400">压缩后</dt>
                  <dd class="inline tabular-nums">{{ formatBytes(row.compressedSize) }}</dd>
                </div>
                <div v-if="row.status === 'done' && row.meta">
                  <dt class="inline text-stone-400">对比</dt>
                  <dd
                    class="inline font-medium tabular-nums"
                    :class="row.meta.worse ? 'text-amber-700' : 'text-emerald-700'"
                  >
                    {{ row.meta.label }}
                  </dd>
                </div>
              </dl>
              <p v-if="row.status === 'error'" class="mt-2 text-xs text-red-600">
                {{ row.errorMessage }}
              </p>
            </div>
            <div class="flex shrink-0 gap-2">
              <button
                v-if="row.status === 'done'"
                type="button"
                class="rounded-xl bg-stone-900 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 sm:text-sm"
                @click="downloadOne(row)"
              >
                下载此张
              </button>
              <button
                type="button"
                class="rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 transition hover:bg-stone-50 sm:text-sm"
                @click="removeItem(row.id)"
              >
                移除
              </button>
            </div>
          </div>

          <div v-if="row.status === 'compressing'" class="mt-4 flex items-center gap-2 text-sm text-stone-600">
            <span class="h-4 w-4 animate-spin rounded-full border-2 border-stone-200 border-t-stone-800" />
            正在压缩…
          </div>

          <div
            v-else-if="row.status === 'done'"
            class="mt-4 grid gap-4 sm:grid-cols-2"
          >
            <figure class="overflow-hidden rounded-xl border border-stone-100 bg-stone-50">
              <figcaption class="border-b border-stone-100 bg-white px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-stone-400">
                原图预览
              </figcaption>
              <div class="relative aspect-[4/3] max-h-[min(52vh,320px)]">
                <img
                  :src="row.originalPreviewUrl"
                  :alt="`原图 ${row.file.name}`"
                  class="h-full w-full object-contain"
                  loading="lazy"
                />
              </div>
            </figure>
            <figure class="overflow-hidden rounded-xl border border-stone-100 bg-stone-50">
              <figcaption class="border-b border-stone-100 bg-white px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-stone-400">
                压缩后
              </figcaption>
              <div class="relative aspect-[4/3] max-h-[min(52vh,320px)]">
                <img
                  :src="row.compressedPreviewUrl"
                  alt="压缩后预览"
                  class="h-full w-full object-contain"
                  loading="lazy"
                />
              </div>
            </figure>
          </div>
        </div>
      </section>

      <!-- 批量下载 -->
      <section v-if="hasReadyItems" class="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          class="inline-flex w-full items-center justify-center rounded-xl bg-stone-900 px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 sm:w-auto sm:min-w-[12rem]"
          @click="downloadAll"
        >
          下载全部
        </button>
        <button
          type="button"
          class="text-center text-sm text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline sm:text-left"
          @click="clearAll"
        >
          清空列表
        </button>
      </section>
    </div>
  </div>
</template>
