import { computed, ref, toValue } from 'vue'
import { compressImageFile } from '../utils/imageCompress.js'

/**
 * @param {import('vue').MaybeRefOrGetter<number>} maxSource
 */
export function useActivityPhotos(maxSource) {
  /** @type {import('vue').Ref<{ id: string; dataUrl: string; name: string }[]>} */
  const photos = ref([])

  const max = computed(() => Number(toValue(maxSource)))

  function remove(id) {
    photos.value = photos.value.filter((p) => p.id !== id)
  }

  function move(id, dir) {
    const i = photos.value.findIndex((p) => p.id === id)
    if (i < 0) return
    const j = i + dir
    if (j < 0 || j >= photos.value.length) return
    const arr = photos.value.slice()
    const t = arr[i]
    arr[i] = arr[j]
    arr[j] = t
    photos.value = arr
  }

  function reorderDrag(fromId, toId) {
    if (fromId === toId) return
    const arr = photos.value.slice()
    const fi = arr.findIndex((p) => p.id === fromId)
    const ti = arr.findIndex((p) => p.id === toId)
    if (fi < 0 || ti < 0) return
    const [item] = arr.splice(fi, 1)
    arr.splice(ti, 0, item)
    photos.value = arr
  }

  /**
   * @param {File[]} files
   * @param {(msg: string) => void} onToast
   */
  async function addFiles(files, onToast) {
    const list = Array.from(files || []).filter((f) =>
      /image\/(jpeg|png)/i.test(f.type),
    )
    if (!list.length) {
      onToast('请上传 JPG 或 PNG 图片')
      return
    }
    for (const file of list) {
      if (photos.value.length >= max.value) {
        onToast(
          max.value <= 3
            ? '免费版最多 3 张照片，开启专业版演示可上传 9 张'
            : '已达到 9 张上限',
        )
        break
      }
      try {
        const out = await compressImageFile(file)
        photos.value = [
          ...photos.value,
          { id: crypto.randomUUID(), dataUrl: out.dataUrl, name: out.name },
        ]
      } catch {
        onToast('图片处理失败，请换一张试试')
      }
    }
  }

  return { photos, max, addFiles, remove, move, reorderDrag }
}
