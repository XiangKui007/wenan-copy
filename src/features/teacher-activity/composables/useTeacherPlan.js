import { ref, watch } from 'vue'

const LS_PRO = 'teacher_plan_is_pro_demo_v1'

export function useTeacherPlan() {
  const isPro = ref(false)
  try {
    isPro.value = localStorage.getItem(LS_PRO) === '1'
  } catch {
    isPro.value = false
  }

  watch(isPro, (v) => {
    try {
      if (v) localStorage.setItem(LS_PRO, '1')
      else localStorage.removeItem(LS_PRO)
    } catch {
      /* ignore */
    }
  })

  return { isPro }
}
