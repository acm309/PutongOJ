import { useLocalStorage, useMediaQuery } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, watch } from 'vue'

const DARK_CLASS = 'ptoj-dark'
type ThemeMode = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore('theme', () => {
  const userMode = useLocalStorage<ThemeMode>('ptoj-theme-mode', 'system')

  // Detect system preference
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const systemMode = computed(() => prefersDark.value ? 'dark' : 'light')

  const effectiveTheme = computed(() => {
    return userMode.value === 'system' ? systemMode.value : userMode.value
  })

  // Auto-switch to system when user mode matches new system mode
  function updateSystemMode (newSystemMode: 'light' | 'dark') {
    if (userMode.value !== 'system' && userMode.value === newSystemMode) {
      userMode.value = 'system'
    }
  }

  function updateHtmlClass () {
    const html = document.documentElement
    if (effectiveTheme.value === 'dark') {
      html.classList.add(DARK_CLASS)
    } else {
      html.classList.remove(DARK_CLASS)
    }
  }

  function setTheme (mode: ThemeMode) {
    userMode.value = mode
  }

  updateSystemMode(systemMode.value)
  watch(systemMode, updateSystemMode)
  watch([ effectiveTheme, userMode ], updateHtmlClass, { immediate: true })

  return {
    userMode: computed(() => userMode.value),
    systemMode,
    effectiveTheme,
    setTheme,
  }
})
