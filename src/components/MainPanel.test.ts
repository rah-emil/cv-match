import { mount } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Antd from 'ant-design-vue'
import { DEFAULT_SETTINGS } from '../types/settings'
import MainPanel from './MainPanel.vue'

const messageWarning = vi.fn()
const messageInfo = vi.fn()

vi.mock('ant-design-vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ant-design-vue')>()
  return {
    ...actual,
    message: {
      ...actual.message,
      warning: (...args: unknown[]) => messageWarning(...args),
      info: (...args: unknown[]) => messageInfo(...args),
    },
  }
})

vi.mock('../services/openai', () => ({
  generateCv: vi.fn(),
}))

function mountMainPanel(settings = DEFAULT_SETTINGS) {
  return mount(MainPanel, {
    props: { settings },
    global: {
      plugins: [Antd],
    },
  })
}

describe('MainPanel', () => {
  beforeEach(() => {
    messageWarning.mockClear()
    messageInfo.mockClear()
  })

  it('renders primary and secondary action buttons', () => {
    const wrapper = mountMainPanel()

    expect(wrapper.text()).toContain('Generate CV')
    expect(wrapper.text()).toContain('Fill form')
  })

  it('warns when Generate CV is clicked without API key', async () => {
    const wrapper = mountMainPanel({
      ...DEFAULT_SETTINGS,
      coverLetter: 'My experience...',
    })

    await wrapper.get('button.ant-btn-primary').trigger('click')

    expect(messageWarning).toHaveBeenCalledWith(
      'Add your OpenAI API key in Settings',
    )
  })

  it('warns when Generate CV is clicked without cover letter', async () => {
    const wrapper = mountMainPanel({
      ...DEFAULT_SETTINGS,
      openAiApiKey: 'sk-test',
    })

    await wrapper.get('button.ant-btn-primary').trigger('click')

    expect(messageWarning).toHaveBeenCalledWith(
      'Add your experience in the Profile tab',
    )
  })
})
