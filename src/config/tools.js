/** 站点品牌（导航与页脚） */
export const SITE_BRAND = 'ThinkingStorm 工具箱'

/**
 * 扩展新工具时：在此新增一项，并在 router/index.js 增加对应路由，
 * 页面文件放在 src/pages/ 下即可。
 */
export const TOOL_NAV_LINKS = [
  { path: '/tools/wenan', label: '文案生成器' },
  { path: '/tools/teacher-activity', label: '教师图文' },
  { path: '/tools/image-compress', label: '图片压缩' },
  { path: '/tools/json-format', label: 'JSON 格式化' },
]

export const HOME_TOOL_CARDS = [
  {
    path: '/tools/wenan',
    title: '朋友圈文案生成器',
    description:
      '按心情与风格挑选分类，随机生成朋友圈短句，一键复制即可发布。纯前端本地运行。',
    cta: '进入工具',
    accent: 'from-amber-50 to-stone-100 ring-stone-200/80',
  },
  {
    path: '/tools/teacher-activity',
    title: '教师活动图文',
    description:
      '上传活动照、选场景，一键生成标题与正文；支持 AI 润色与导出（专业版）。照片仅在本机处理。',
    cta: '进入工具',
    accent: 'from-emerald-50 to-teal-50 ring-emerald-200/80',
  },
  {
    path: '/tools/image-compress',
    title: '在线图片压缩',
    description:
      '批量压缩 JPG / PNG / WebP，可调质量并对比体积；纯本地处理，隐私不外传。',
    cta: '进入工具',
    accent: 'from-stone-50 to-amber-50/40 ring-stone-200/80',
  },
  {
    path: '/tools/json-format',
    title: 'JSON 在线格式化',
    description:
      '粘贴即排版、一键压缩单行、实时语法校验与错误提示；支持深浅编辑区主题，纯前端本地处理。',
    cta: '进入工具',
    accent: 'from-stone-50 to-sky-50/50 ring-stone-200/80',
  },
]
