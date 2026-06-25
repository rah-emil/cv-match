import { ref } from 'vue'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { useTheme } from './useTheme'

function createMatchMedia(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()

  return {
    matches,
    addEventListener: vi.fn(
      (_: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener)
      },
    ),
    removeEventListener: vi.fn(
      (_: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener)
      },
    ),
    dispatch(change: boolean) {
      this.matches = change
      for (const listener of listeners) {
        listener({ matches: change } as MediaQueryListEvent)
      }
    },
  }
}

describe('useTheme', () => {
  let mediaQuery: ReturnType<typeof createMatchMedia>

  beforeEach(() => {
    mediaQuery = createMatchMedia(false)
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => mediaQuery),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses system preference in auto mode', () => {
    mediaQuery.matches = true
    const themeMode = ref<'auto' | 'light' | 'dark'>('auto')
    const { isDark } = useTheme(themeMode)

    expect(isDark.value).toBe(true)
  })

  it('forces light mode regardless of system', () => {
    mediaQuery.matches = true
    const themeMode = ref<'auto' | 'light' | 'dark'>('light')
    const { isDark } = useTheme(themeMode)

    expect(isDark.value).toBe(false)
  })

  it('forces dark mode regardless of system', () => {
    mediaQuery.matches = false
    const themeMode = ref<'auto' | 'light' | 'dark'>('dark')
    const { isDark } = useTheme(themeMode)

    expect(isDark.value).toBe(true)
  })

  it('provides dark algorithm when dark', () => {
    const themeMode = ref<'auto' | 'light' | 'dark'>('dark')
    const { antTheme } = useTheme(themeMode)

    expect(antTheme.value.algorithm).toBeDefined()
  })
})
