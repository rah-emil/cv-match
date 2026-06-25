<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  source: string
}>()

marked.setOptions({ breaks: true, gfm: true })

const html = computed(() => marked.parse(props.source, { async: false }) as string)
</script>

<template>
  <div class="markdown-content" v-html="html" />
</template>

<style scoped>
.markdown-content {
  font-size: 13px;
  line-height: 1.65;
  color: var(--result-text, rgba(0, 0, 0, 0.85));
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin: 14px 0 6px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--panel-title, rgba(0, 0, 0, 0.88));
}

.markdown-content :deep(h1) {
  font-size: 16px;
}

.markdown-content :deep(h2) {
  font-size: 14px;
}

.markdown-content :deep(h3) {
  font-size: 13px;
}

.markdown-content :deep(h1:first-child),
.markdown-content :deep(h2:first-child),
.markdown-content :deep(h3:first-child),
.markdown-content :deep(p:first-child) {
  margin-top: 0;
}

.markdown-content :deep(p) {
  margin: 0 0 10px;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0 0 10px;
  padding-left: 20px;
}

.markdown-content :deep(li) {
  margin-bottom: 4px;
}

.markdown-content :deep(li:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: var(--panel-title, rgba(0, 0, 0, 0.88));
}

.markdown-content :deep(code) {
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
  background: var(--md-code-bg, rgba(0, 0, 0, 0.06));
}
</style>
