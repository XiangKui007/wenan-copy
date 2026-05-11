<script setup>
/**
 * 教师活动图文自动生成 — 工作台分栏、本地隐私强调（全局导航与广告由布局承载）
 */
import { computed, ref, watch } from 'vue'
import { SCENES, getArticlePool } from '@/features/teacher-activity/data/teacherCopyLibrary.js'
import { pickRandomFromList } from '@/utils/randomPick.js'
import { copyRichToClipboard, copyTextToClipboard } from '@/utils/clipboard.js'
import { useActivityPhotos } from '@/features/teacher-activity/composables/useActivityPhotos.js'
import { useTeacherPlan } from '@/features/teacher-activity/composables/useTeacherPlan.js'
import {
  optimizeArticle,
  getAiSettings,
  setAiSettings,
} from '@/features/teacher-activity/utils/aiClient.js'
import { exportArticleDocx } from '@/features/teacher-activity/utils/exportDocx.js'
import { exportElementPdf } from '@/features/teacher-activity/utils/exportPdf.js'
import { loadHistory, pushHistory } from '@/features/teacher-activity/utils/historyStorage.js'

const GENERATE_MIN_MS = 320

const { isPro } = useTeacherPlan()
const { photos, addFiles, remove, move, reorderDrag } = useActivityPhotos(() =>
  isPro.value ? 9 : 3,
)

const sceneQuery = ref('')
const activeSceneId = ref('banhui')
const articleTitle = ref('')
const articleBody = ref('')
const isGenerating = ref(false)
const isOptimizing = ref(false)
const isExporting = ref(false)
const textTransitionKey = ref(0)

const toastMessage = ref('')
const toastVisible = ref(false)
let toastTimer = null

const showAiSettings = ref(false)
const aiKeyInput = ref('')
const aiBaseInput = ref('')
const aiModelInput = ref('')
const historyOpen = ref(false)
const historyItems = ref(loadHistory())

const articleExportRoot = ref(null)
const fileInputRef = ref(null)
const dragFromId = ref(null)

const filteredScenes = computed(() => {
  const q = sceneQuery.value.trim().toLowerCase()
  if (!q) return SCENES
  return SCENES.filter((s) => {
    const hay = `${s.label} ${s.keywords}`.toLowerCase()
    return hay.includes(q)
  })
})

const activeSceneLabel = computed(
  () => SCENES.find((s) => s.id === activeSceneId.value)?.label ?? '活动',
)

watch(isPro, (v) => {
  if (!v) {
    if (photos.value.length > 3) photos.value = photos.value.slice(0, 3)
    const s = SCENES.find((x) => x.id === activeSceneId.value)
    if (s?.paid) activeSceneId.value = 'banhui'
  }
})

watch(showAiSettings, (open) => {
  if (open) {
    const s = getAiSettings()
    aiKeyInput.value = s.apiKey
    aiBaseInput.value = s.baseUrl
    aiModelInput.value = s.model
  }
})

watch(historyOpen, (open) => {
  if (open) historyItems.value = loadHistory()
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

function selectScene(s) {
  if (s.paid && !isPro.value) {
    showToast('该场景为专业版专享，可先开启「专业版（演示）」体验')
    return
  }
  activeSceneId.value = s.id
}

function attachPhotoLayout(body) {
  const slots = photos.value.length
  const slotText = slots
    ? `\n\n【配图建议（按上传顺序）】\n${photos.value.map((_, i) => `图${i + 1}`).join(' → ')}`
    : '\n\n（建议：可根据实际上传照片数量，在文末穿插配图说明。）'
  return `${body}${slotText}`
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildPlainCopy() {
  const t = articleTitle.value.trim()
  const b = articleBody.value.trim()
  if (!t && !b) return ''
  return `${t}\n\n${b}`
}

function buildRichHtml() {
  const t = escapeHtml(articleTitle.value.trim())
  const chunks = articleBody.value.trim().split(/\n{2,}/)
  const ps = chunks
    .filter(Boolean)
    .map(
      (c) =>
        `<p style="margin:.55em 0;line-height:1.75">${escapeHtml(c).replace(/\n/g, '<br/>')}</p>`,
    )
    .join('')
  return `<article><h2 style="font-size:1.25em;margin:0 0 .5em">${t}</h2>${ps}</article>`
}

async function onGenerate() {
  if (isGenerating.value) return
  if (photos.value.length < 1) {
    showToast('请先上传至少 1 张活动照片（仅本地处理，不会上传）')
    return
  }
  const pool = getArticlePool(activeSceneId.value)
  if (!pool.length) {
    showToast('该场景暂无可用文案，请稍后再试')
    return
  }
  isGenerating.value = true
  const started = Date.now()
  try {
    const item = pickRandomFromList(pool)
    const elapsed = Date.now() - started
    if (elapsed < GENERATE_MIN_MS) await delay(GENERATE_MIN_MS - elapsed)
    articleTitle.value = item.title
    articleBody.value = attachPhotoLayout(item.body)
    textTransitionKey.value += 1
    if (isPro.value) {
      pushHistory({
        sceneLabel: activeSceneLabel.value,
        title: articleTitle.value,
        plain: buildPlainCopy(),
      })
      historyItems.value = loadHistory()
    }
  } finally {
    isGenerating.value = false
  }
}

async function onCopy() {
  const plain = buildPlainCopy()
  if (!plain) {
    showToast('请先生成图文，或填写标题与正文')
    return
  }
  let ok = await copyRichToClipboard({ plain, html: buildRichHtml() })
  if (!ok) ok = await copyTextToClipboard(plain)
  showToast(ok ? '✅ 复制成功（含基础排版）' : '复制失败，请长按正文手动复制')
}

async function onOptimize() {
  const t = articleTitle.value.trim()
  const b = articleBody.value.trim()
  if (!t || !b) {
    showToast('请先生成或填写完整标题与正文')
    return
  }
  if (isOptimizing.value) return
  isOptimizing.value = true
  try {
    const out = await optimizeArticle({
      title: t,
      body: b,
      sceneLabel: activeSceneLabel.value,
    })
    articleTitle.value = out.title
    articleBody.value = out.body
    textTransitionKey.value += 1
    showToast(
      out.via === 'remote'
        ? '✅ AI 优化完成（已调用在线接口）'
        : '已应用本地润色（未检测到有效 API Key 时自动降级）',
    )
  } finally {
    isOptimizing.value = false
  }
}

function saveAiSettings() {
  setAiSettings({
    apiKey: aiKeyInput.value.trim(),
    baseUrl: aiBaseInput.value.trim(),
    model: aiModelInput.value.trim(),
  })
  showToast('AI 配置已保存到本机浏览器')
}

async function onExportDocx() {
  if (!isPro.value) {
    showToast('导出 Word 为专业版功能，请先开启「专业版（演示）」')
    return
  }
  const t = articleTitle.value.trim()
  const b = articleBody.value.trim()
  if (!t || !b) {
    showToast('请先生成图文')
    return
  }
  if (isExporting.value) return
  isExporting.value = true
  try {
    const paragraphs = b.split(/\n+/).filter(Boolean)
    const imgs = photos.value.map((p) => ({
      dataUrl: p.dataUrl,
      width: 520,
      height: 360,
    }))
    await exportArticleDocx({ title: t, paragraphs, images: imgs })
    showToast('Word 已导出')
  } catch {
    showToast('导出失败，请重试或改用复制')
  } finally {
    isExporting.value = false
  }
}

async function onExportPdf() {
  if (!isPro.value) {
    showToast('导出 PDF 为专业版功能，请先开启「专业版（演示）」')
    return
  }
  const el = articleExportRoot.value
  if (!el) {
    showToast('导出区域未就绪')
    return
  }
  if (isExporting.value) return
  isExporting.value = true
  try {
    await exportElementPdf(el, `教师活动图文_${Date.now()}.pdf`)
    showToast('PDF 已导出')
  } catch {
    showToast('PDF 导出失败，可尝试缩小正文或更换浏览器')
  } finally {
    isExporting.value = false
  }
}

function onPickFiles(e) {
  const files = e.target.files
  if (files) addFiles(Array.from(files), showToast)
  e.target.value = ''
}

function onDropZone(e) {
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (files?.length) addFiles(Array.from(files), showToast)
}

function applyHistoryItem(h) {
  const plain = String(h.plain || '')
  const i = plain.indexOf('\n\n')
  if (i > -1) {
    articleTitle.value = plain.slice(0, i).trim() || h.title
    articleBody.value = plain.slice(i + 2)
  } else {
    articleTitle.value = h.title
    articleBody.value = plain
  }
  historyOpen.value = false
  textTransitionKey.value += 1
  showToast('已载入历史记录')
}

function onDragStart(id, ev) {
  dragFromId.value = id
  try {
    ev.dataTransfer.effectAllowed = 'move'
    ev.dataTransfer.setData('text/plain', id)
  } catch {
    /* ignore */
  }
}

function onDragOver(ev) {
  ev.preventDefault()
}

function onDropOn(id) {
  if (dragFromId.value) reorderDrag(dragFromId.value, id)
  dragFromId.value = null
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function togglePro() {
  isPro.value = !isPro.value
}
</script>

<template>
  <div
    class="relative min-h-dvh overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-emerald-50/50 pb-28 text-slate-800 antialiased selection:bg-emerald-200/70 selection:text-slate-900 md:pb-10"
  >
    <div
      class="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgb(203_213_225)_1px,transparent_0)] opacity-[0.45] [background-size:22px_22px]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[min(42vh,28rem)] bg-gradient-to-b from-emerald-100/35 via-transparent to-transparent"
      aria-hidden="true"
    />

    <div
      class="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 md:bottom-auto md:top-5 md:justify-end md:px-6"
      role="status"
      aria-live="polite"
    >
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-y-3 opacity-0 md:translate-y-0 md:-translate-y-2"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="toastVisible"
          class="pointer-events-auto max-w-md rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-3 text-center text-sm text-slate-700 shadow-lift backdrop-blur-md"
        >
          {{ toastMessage }}
        </div>
      </transition>
    </div>

    <header
      class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/65"
    >
      <div
        class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-3.5"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-glow sm:h-11 sm:w-11"
            aria-hidden="true"
          >
            <svg class="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M7 4h10a2 2 0 0 1 2 2v14l-7-3-7 3V6a2 2 0 0 1 2-2Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
              <path d="M9 9h6M9 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
              教师活动图文
            </p>
            <p class="hidden truncate text-xs text-slate-500 sm:block">
              本地成稿 · 照片不出浏览器
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2 sm:gap-3">
          <span
            class="hidden items-center gap-1 rounded-full border border-emerald-200/90 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-medium text-emerald-900 shadow-sm sm:inline-flex"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            隐私优先
          </span>

          <button
            v-if="isPro"
            type="button"
            class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800 sm:text-sm"
            @click="historyOpen = true"
          >
            历史
          </button>

          <div class="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 py-1 pl-3 pr-1 shadow-sm">
            <span class="text-[11px] font-medium text-slate-600 sm:text-xs">专业版</span>
            <button
              type="button"
              role="switch"
              :aria-checked="isPro"
              class="relative flex h-8 w-[3.25rem] items-center rounded-full p-1 transition-colors duration-200"
              :class="isPro ? 'justify-end bg-emerald-600' : 'justify-start bg-slate-300'"
              @click="togglePro"
            >
              <span class="h-6 w-6 rounded-full bg-white shadow-md ring-1 ring-black/5" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <p
        class="mb-8 max-w-2xl text-sm leading-relaxed text-slate-600 motion-safe:animate-fade-up sm:text-[15px]"
      >
        上传活动照 → 选场景 → 一键生成标题与正文，并自动带上配图顺序说明。适合发公众号、美篇、学校订阅号；所有照片仅在您本机处理。
      </p>

      <div class="grid gap-8 xl:grid-cols-12 xl:gap-10">
        <div class="space-y-6 xl:col-span-5">
          <section
            class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lift sm:p-6"
            aria-label="活动照片"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-sm font-semibold text-slate-900">活动照片</h2>
                <p class="mt-0.5 text-xs text-slate-500">
                  已选 {{ photos.length }} / {{ isPro ? 9 : 3 }} · JPG / PNG
                </p>
              </div>
              <span
                class="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-500"
              >
                本地
              </span>
            </div>

            <input
              ref="fileInputRef"
              type="file"
              accept="image/jpeg,image/png"
              multiple
              class="hidden"
              @change="onPickFiles"
            />

            <div
              class="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200/90 bg-gradient-to-br from-white to-emerald-50/40 px-4 py-10 text-center transition hover:border-emerald-400 hover:shadow-md"
              role="button"
              tabindex="0"
              @click="openFilePicker"
              @keydown.enter.prevent="openFilePicker"
              @dragover.prevent="onDragOver"
              @drop.prevent="onDropZone"
            >
              <p class="text-sm font-medium text-slate-800">点击或拖拽到此处上传</p>
              <p class="mt-1 text-xs text-slate-500">自动压缩，数据不离开本页</p>
            </div>

            <ul
              v-if="photos.length"
              class="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-3"
            >
              <li
                v-for="(p, idx) in photos"
                :key="p.id"
                class="group relative aspect-square overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 shadow-sm"
                draggable="true"
                @dragstart="onDragStart(p.id, $event)"
                @dragover="onDragOver"
                @drop.prevent="onDropOn(p.id)"
              >
                <img :src="p.dataUrl" :alt="`预览${idx + 1}`" class="h-full w-full object-cover" />
                <div
                  class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-0.5 bg-gradient-to-t from-slate-900/85 to-transparent px-1 pb-1 pt-6 text-[10px] text-white opacity-0 transition group-hover:opacity-100 sm:opacity-100"
                >
                  <button
                    type="button"
                    class="rounded-md bg-white/15 px-1.5 py-0.5 hover:bg-white/25"
                    @click.stop="move(p.id, -1)"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    class="rounded-md bg-rose-500/90 px-1.5 py-0.5 hover:bg-rose-500"
                    @click.stop="remove(p.id)"
                  >
                    删除
                  </button>
                  <button
                    type="button"
                    class="rounded-md bg-white/15 px-1.5 py-0.5 hover:bg-white/25"
                    @click.stop="move(p.id, 1)"
                  >
                    →
                  </button>
                </div>
                <span
                  class="pointer-events-none absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-[11px] font-semibold text-white backdrop-blur-sm"
                >
                  {{ idx + 1 }}
                </span>
              </li>
            </ul>
          </section>

          <section
            class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lift sm:p-6"
            aria-label="活动场景"
          >
            <h2 class="text-sm font-semibold text-slate-900">活动场景</h2>
            <p class="mt-0.5 text-xs text-slate-500">支持搜索；带「专业」标签的场景需开启专业版</p>
            <div class="mt-4">
              <div class="relative">
                <svg
                  class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  v-model="sceneQuery"
                  type="search"
                  placeholder="例如：研学、班会、文艺…"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none ring-emerald-500/0 transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
            <div class="-mx-1 mt-4 flex max-h-[min(40vh,16rem)] flex-wrap gap-2 overflow-y-auto px-1 pb-1 sm:max-h-none">
              <button
                v-for="s in filteredScenes"
                :key="s.id"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                :class="[
                  activeSceneId === s.id
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-900/15'
                    : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-white',
                  s.paid && !isPro ? 'opacity-55' : '',
                ]"
                :aria-pressed="activeSceneId === s.id"
                @click="selectScene(s)"
              >
                {{ s.label }}
                <span
                  v-if="s.paid"
                  class="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  :class="
                    activeSceneId === s.id
                      ? 'bg-white/20 text-emerald-50'
                      : 'bg-amber-100 text-amber-900'
                  "
                >
                  专业
                </span>
              </button>
            </div>
          </section>
        </div>

        <div class="space-y-6 xl:col-span-7">
          <section class="xl:sticky xl:top-[4.5rem] xl:space-y-5" aria-label="图文预览与操作">
            <div
              class="rounded-2xl border border-slate-200/90 bg-white p-1 shadow-lift sm:p-1.5"
              aria-label="成稿预览"
            >
              <div
                class="rounded-[0.875rem] border border-slate-100 bg-gradient-to-b from-slate-50/80 to-white px-4 py-4 sm:px-6 sm:py-5"
              >
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span
                    class="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-white"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {{ activeSceneLabel }}
                  </span>
                  <span class="text-[11px] font-medium text-slate-400">可编辑</span>
                </div>

                <div class="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-inner">
                  <div
                    v-if="!isPro"
                    class="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-white/0"
                    aria-hidden="true"
                  >
                    <span
                      class="-rotate-12 select-none text-2xl font-bold tracking-[0.35em] text-slate-300/90 mix-blend-multiply sm:text-3xl"
                    >
                      免费版预览
                    </span>
                  </div>

                  <div ref="articleExportRoot" class="relative z-0 p-4 sm:p-6">
                    <transition
                      mode="out-in"
                      enter-active-class="transition duration-300 ease-out"
                      enter-from-class="opacity-0 translate-y-1"
                      enter-to-class="opacity-100 translate-y-0"
                      leave-active-class="transition duration-200 ease-in"
                      leave-from-class="opacity-100 translate-y-0"
                      leave-to-class="opacity-0 -translate-y-0.5"
                    >
                      <div :key="textTransitionKey" class="space-y-4">
                        <input
                          v-model="articleTitle"
                          type="text"
                          placeholder="标题"
                          class="w-full border-0 border-b border-slate-200 bg-transparent text-lg font-semibold tracking-tight text-slate-900 outline-none transition focus:border-emerald-500 sm:text-xl"
                        />
                        <textarea
                          v-model="articleBody"
                          rows="12"
                          placeholder="生成后在此编辑正文；空状态可先上传照片并点击「生成图文」。"
                          class="min-h-[12rem] w-full resize-y rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-emerald-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 sm:text-[15px]"
                        />
                        <div
                          v-if="photos.length"
                          class="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-4"
                        >
                          <img
                            v-for="(p, i) in photos"
                            :key="p.id"
                            :src="p.dataUrl"
                            class="aspect-square w-full rounded-lg object-cover ring-1 ring-slate-200/80"
                            :alt="`配图${i + 1}`"
                          />
                        </div>
                      </div>
                    </transition>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="hidden flex-wrap gap-3 md:flex"
              aria-label="图文操作（桌面）"
            >
              <button
                type="button"
                class="inline-flex min-h-[2.75rem] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-65 sm:flex-none sm:min-w-[9.5rem]"
                :disabled="isGenerating"
                @click="onGenerate"
              >
                <svg
                  v-if="isGenerating"
                  class="h-4 w-4 shrink-0 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>{{ isGenerating ? '生成中…' : '生成图文' }}</span>
              </button>
              <button
                type="button"
                class="inline-flex min-h-[2.75rem] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:opacity-60 sm:flex-none"
                :disabled="isOptimizing"
                @click="onOptimize"
              >
                <span
                  v-if="isOptimizing"
                  class="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600"
                />
                <span>{{ isOptimizing ? '优化中…' : 'AI 优化' }}</span>
              </button>
              <button
                type="button"
                class="inline-flex min-h-[2.75rem] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:flex-none"
                @click="onCopy"
              >
                复制
              </button>
              <button
                type="button"
                class="inline-flex min-h-[2.75rem] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-45 sm:flex-none"
                :disabled="isExporting || !isPro"
                @click="onExportDocx"
              >
                Word
              </button>
              <button
                type="button"
                class="inline-flex min-h-[2.75rem] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-45 sm:flex-none"
                :disabled="isExporting || !isPro"
                @click="onExportPdf"
              >
                PDF
              </button>
            </div>
          </section>
        </div>
      </div>

      <section
        class="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lift sm:p-6"
        aria-label="AI 配置"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 text-left"
          @click="showAiSettings = !showAiSettings"
        >
          <div>
            <h2 class="text-sm font-semibold text-slate-900">AI 接口（可选）</h2>
            <p class="mt-0.5 text-xs text-slate-500">兼容 OpenAI Chat 格式；未配置时使用本地润色</p>
          </div>
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500"
          >
            {{ showAiSettings ? '−' : '+' }}
          </span>
        </button>
        <div v-if="showAiSettings" class="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm">
          <p class="text-xs leading-relaxed text-slate-500">
            Key 仅存本机。Base URL 需包含
            <code class="rounded bg-slate-100 px-1 py-0.5 text-[11px] text-slate-700">/v1</code>
            路径前缀（与所用网关文档一致）。
          </p>
          <input
            v-model="aiBaseInput"
            type="url"
            placeholder="https://api.openai.com/v1"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15"
          />
          <input
            v-model="aiModelInput"
            type="text"
            placeholder="模型 id"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15"
          />
          <input
            v-model="aiKeyInput"
            type="password"
            autocomplete="off"
            placeholder="API Key"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15"
          />
          <button
            type="button"
            class="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            @click="saveAiSettings"
          >
            保存到本机
          </button>
        </div>
      </section>
    </main>

    <div
      class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/90 bg-white/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-lg md:hidden"
      aria-label="快捷操作"
    >
      <div class="mx-auto flex max-w-lg gap-2">
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
          :disabled="isGenerating"
          @click="onGenerate"
        >
          <svg
            v-if="isGenerating"
            class="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{{ isGenerating ? '生成中' : '生成' }}</span>
        </button>
        <button
          type="button"
          class="flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-800 shadow-sm"
          @click="onCopy"
        >
          复制
        </button>
      </div>
      <p class="mt-2 text-center text-[10px] text-slate-400">更多操作请上滑：AI 优化、导出等</p>
    </div>

    <teleport to="body">
      <div
        v-if="historyOpen"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
        role="dialog"
        aria-modal="true"
        @click.self="historyOpen = false"
      >
        <div
          class="max-h-[78vh] w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          @click.stop
        >
          <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <h2 class="text-sm font-semibold text-slate-900">历史记录</h2>
            <button
              type="button"
              class="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              @click="historyOpen = false"
            >
              关闭
            </button>
          </div>
          <ul class="max-h-[60vh] overflow-y-auto p-2">
            <li v-if="!historyItems.length" class="px-3 py-10 text-center text-sm text-slate-500">
              暂无记录；生成成功后会自动保存到本机
            </li>
            <li
              v-for="h in historyItems"
              :key="h.id"
              class="mb-1.5 rounded-xl border border-slate-100 transition hover:border-emerald-200 hover:bg-emerald-50/30"
            >
              <button type="button" class="w-full px-3 py-3 text-left" @click="applyHistoryItem(h)">
                <p class="font-medium text-slate-900">{{ h.title }}</p>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ h.sceneLabel }} · {{ new Date(h.ts).toLocaleString() }}
                </p>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </teleport>
  </div>
</template>
