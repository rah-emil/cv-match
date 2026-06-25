import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue'
import { theme } from 'ant-design-vue'
import type { ThemeMode } from '../types/settings'

export function useTheme(themeMode: Ref<ThemeMode>) {
  const systemDark = ref(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  let mediaQuery: MediaQueryList | null = null

  const onChange = (event: MediaQueryListEvent) => {
    systemDark.value = event.matches
  }

  onMounted(() => {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = mediaQuery.matches
    mediaQuery.addEventListener('change', onChange)
  })

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', onChange)
  })

  const isDark = computed(() => {
    if (themeMode.value === 'dark') return true
    if (themeMode.value === 'light') return false
    return systemDark.value
  })

  const antTheme = computed(() => ({
    algorithm: isDark.value ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#2f54eb',
      borderRadius: 8,
    },
  }))

  return { isDark, antTheme }
}
