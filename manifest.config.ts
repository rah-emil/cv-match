import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'CV Match',
  description: 'Generate tailored CV and fill job application forms',
  version: '1.0.0',
  icons: {
    16: 'public/icon-16.png',
    48: 'public/icon-48.png',
    128: 'public/icon-128.png',
  },
  action: {
    default_title: 'CV Match',
    default_popup: 'index.html',
    default_icon: {
      16: 'public/icon-16.png',
      32: 'public/icon-32.png',
      48: 'public/icon-48.png',
    },
  },
  permissions: ['storage', 'activeTab', 'scripting'],
  host_permissions: ['<all_urls>'],
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/extractJobText.ts'],
      run_at: 'document_idle',
    },
  ],
})
