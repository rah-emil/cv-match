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
  evaluateMatch: vi.fn(),
  generateCoverLetter: vi.fn(),
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

    expect(wrapper.text()).toContain('Select on page')
    expect(wrapper.text()).toContain('Evaluate match')
    expect(wrapper.text()).toContain('Generate CV')
    expect(wrapper.text()).toContain('Generate cover letter')
    expect(wrapper.text()).toContain('Auto-fill form')
  })

  it('warns when Evaluate match is clicked without API key', async () => {
    const wrapper = mountMainPanel({
      ...DEFAULT_SETTINGS,
      cvContent: 'My CV content',
    })

    await wrapper.get('button.main-panel__button--evaluate').trigger('click')

    expect(messageWarning).toHaveBeenCalledWith(
      'Add your OpenAI API key in Settings',
    )
  })

  it('warns when Generate CV is clicked without API key', async () => {
    const wrapper = mountMainPanel({
      ...DEFAULT_SETTINGS,
      cvContent: 'My CV content',
    })

    await wrapper.get('button.ant-btn-primary').trigger('click')

    expect(messageWarning).toHaveBeenCalledWith(
      'Add your OpenAI API key in Settings',
    )
  })

  it('warns when Generate CV is clicked without CV content', async () => {
    const wrapper = mountMainPanel({
      ...DEFAULT_SETTINGS,
      openAiApiKey: 'sk-test',
      cvContent: '',
    })

    await wrapper.get('button.ant-btn-primary').trigger('click')

    expect(messageWarning).toHaveBeenCalledWith(
      'Upload your CV in the Profile tab first',
    )
  })

  it('warns when Auto-fill form is clicked without required profile fields', async () => {
    const wrapper = mountMainPanel({
      ...DEFAULT_SETTINGS,
      firstName: '',
      lastName: 'Doe',
      email: 'jane@example.com',
    })

    await wrapper.get('button.main-panel__button--secondary').trigger('click')

    expect(messageWarning).toHaveBeenCalledWith('Fill in Profile: First name')
  })
})
