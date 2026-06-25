<script setup lang="ts">
import type { ThemeMode } from '../types/settings'
import { THEME_MODE_LABELS } from '../types/settings'

const themeMode = defineModel<ThemeMode>('value', { required: true })

const emit = defineEmits<{
  change: [mode: ThemeMode]
}>()

const options: { mode: ThemeMode; hint: string }[] = [
  { mode: 'auto', hint: 'Follow system' },
  { mode: 'light', hint: 'Always light' },
  { mode: 'dark', hint: 'Always dark' },
]

function select(mode: ThemeMode) {
  themeMode.value = mode
  emit('change', mode)
}
</script>

<template>
  <div class="theme-picker">
    <button
      v-for="option in options"
      :key="option.mode"
      type="button"
      class="theme-picker__option"
      :class="{ 'theme-picker__option--active': themeMode === option.mode }"
      :title="option.hint"
      @click="select(option.mode)"
    >
      <span class="theme-picker__icon">
        <svg
          v-if="option.mode === 'auto'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>

        <svg
          v-else-if="option.mode === 'light'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          />
        </svg>

        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
      <span class="theme-picker__label">{{ THEME_MODE_LABELS[option.mode] }}</span>
    </button>
  </div>
</template>

<style scoped>
.theme-picker {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.theme-picker__option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border: 1.5px solid var(--theme-picker-border, #d9d9d9);
  border-radius: 10px;
  background: var(--theme-picker-bg, #fafafa);
  color: var(--theme-picker-text, rgba(0, 0, 0, 0.65));
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s,
    box-shadow 0.2s,
    color 0.2s;
}

.theme-picker__option:hover {
  border-color: #597ef7;
  color: #2f54eb;
}

.theme-picker__option--active {
  border-color: #2f54eb;
  background: var(--theme-picker-active-bg, #f0f5ff);
  color: #2f54eb;
  box-shadow: 0 4px 12px rgba(47, 84, 235, 0.15);
}

.theme-picker__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
}

.theme-picker__icon svg {
  width: 22px;
  height: 22px;
}

.theme-picker__label {
  font-size: 12px;
  font-weight: 500;
}
</style>
