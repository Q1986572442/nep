import { ref, watchEffect } from 'vue'

const MODE_KEY = 'nep-theme-mode'
const saved = localStorage.getItem(MODE_KEY) || 'light'
const themeMode = ref(saved)

function apply(mode) {
  const root = document.documentElement
  const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

// 初始应用
apply(themeMode.value)

// 监听系统主题变化（仅 system 模式时生效）
const sysQuery = window.matchMedia('(prefers-color-scheme: dark)')
sysQuery.addEventListener('change', () => {
  if (themeMode.value === 'system') apply('system')
})

export function useDarkMode() {
  const isDark = ref(document.documentElement.classList.contains('dark'))

  function setMode(mode) {
    themeMode.value = mode
    localStorage.setItem(MODE_KEY, mode)
    apply(mode)
    isDark.value = document.documentElement.classList.contains('dark')
  }

  return {
    isDark,
    mode: themeMode,
    setMode
  }
}
