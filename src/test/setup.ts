import { beforeEach, vi } from 'vitest'

const storageData: Record<string, unknown> = {}

function resetStorage() {
  for (const key of Object.keys(storageData)) {
    delete storageData[key]
  }
}

beforeEach(() => {
  resetStorage()
})

globalThis.chrome = {
  storage: {
    local: {
      get: vi.fn(async (keys: string | string[] | Record<string, unknown>) => {
        if (typeof keys === 'string') {
          return { [keys]: storageData[keys] }
        }

        if (Array.isArray(keys)) {
          return Object.fromEntries(
            keys.map((key) => [key, storageData[key]]),
          )
        }

        return { ...storageData, ...keys }
      }),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(storageData, items)
      }),
      remove: vi.fn(async (keys: string | string[]) => {
        const list = Array.isArray(keys) ? keys : [keys]
        for (const key of list) {
          delete storageData[key]
        }
      }),
      clear: vi.fn(async () => {
        resetStorage()
      }),
    },
  },
  tabs: {
    query: vi.fn(async () => [{ id: 1 }]),
    sendMessage: vi.fn(async (_tabId: number, message: { action?: string }) => {
      if (message.action === 'getJobTextSelection') {
        return { source: null, charCount: 0, pickerActive: false }
      }
      return { text: 'Mock job text', source: 'auto' }
    }),
  },
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
  },
} as unknown as typeof chrome

export { storageData }
