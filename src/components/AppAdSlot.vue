<script setup>
defineProps({
  /** @type {'top' | 'bottom'} */
  position: {
    type: String,
    required: true,
    validator: (v) => v === 'top' || v === 'bottom',
  },
})
</script>

<template>
  <section
    v-if="position === 'top'"
    class="ad-slot-top mx-auto flex h-[100px] w-full max-w-6xl shrink-0 flex-col justify-center px-4 pt-4 sm:px-6"
    aria-label="顶部全局广告位"
  >
    <div
      class="flex h-full w-full flex-col justify-center rounded-2xl border border-dashed border-stone-300/80 bg-stone-200/60 p-3"
    >
      <p class="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
        广告位 · 预留
      </p>
      <p class="mt-1 text-center text-[10px] text-stone-400">全站统一尺寸，可替换为联盟脚本</p>
    </div>
  </section>

  <section
    v-else
    class="ad-slot-bottom mx-auto flex h-[150px] w-full max-w-6xl shrink-0 flex-col justify-center px-4 pb-6 sm:px-6"
    aria-label="底部全局广告位"
  >
    <div
      class="flex h-full w-full flex-col justify-center rounded-2xl border border-dashed border-stone-300/80 bg-stone-200/60 p-3"
    >
      <p class="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
        广告位 · 预留
      </p>
      <p class="mt-1 text-center text-[10px] text-stone-400">底部通栏，便于后续变现接入</p>
    </div>
  </section>
</template>
