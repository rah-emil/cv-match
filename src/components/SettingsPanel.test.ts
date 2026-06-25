import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Antd from 'ant-design-vue'
import {
  DEFAULT_COVER_LETTER_PROMPT,
  DEFAULT_MATCH_ASSESSMENT_PROMPT,
  DEFAULT_SETTINGS,
  DEFAULT_SYSTEM_PROMPT,
  MAX_OUTPUT_TOKENS_HINT,
} from '../types/settings'
import SettingsPanel from './SettingsPanel.vue'

function mountSettingsPanel(onSave = vi.fn()) {
  return mount(SettingsPanel, {
    props: {
      settings: DEFAULT_SETTINGS,
      saving: false,
      onSave,
    },
    global: {
      plugins: [Antd],
    },
  })
}

describe('SettingsPanel', () => {
  it('renders appearance, OpenAI connection and CV generation prompt sections', () => {
    const wrapper = mountSettingsPanel()

    expect(wrapper.text()).toContain('Appearance')
    expect(wrapper.text()).toContain('System')
    expect(wrapper.text()).toContain('Light')
    expect(wrapper.text()).toContain('Dark')
    expect(wrapper.text()).toContain('OpenAI connection')
    expect(wrapper.text()).toContain('Get token')
    expect(wrapper.text()).toContain('CV generation prompt')
    expect(wrapper.text()).toContain('Match assessment prompt')
    expect(wrapper.text()).toContain('Cover letter prompt')
    expect(wrapper.find('input[placeholder="sk-..."]').exists()).toBe(true)
    expect(
      wrapper.find('input[placeholder="https://api.openai.com/v1"]').exists(),
    ).toBe(true)
    expect(wrapper.text()).toContain('CV generation model')
    expect(wrapper.text()).toContain('Match evaluation model')
    expect(wrapper.text()).toContain('Save settings')
  })

  it('does not show max tokens hint at default value', () => {
    const wrapper = mountSettingsPanel()

    expect(wrapper.text()).not.toContain(MAX_OUTPUT_TOKENS_HINT)
  })

  it('shows max tokens hint when value is changed', async () => {
    const wrapper = mountSettingsPanel()

    const input = wrapper.find('.ant-input-number-input')
    await input.setValue('8192')
    await input.trigger('change')
    await flushPromises()

    expect(wrapper.text()).toContain(MAX_OUTPUT_TOKENS_HINT)
  })

  it('shows max tokens hint when loaded with non-default value', () => {
    const wrapper = mount(SettingsPanel, {
      props: {
        settings: { ...DEFAULT_SETTINGS, maxOutputTokens: 8192 },
        saving: false,
      },
      global: { plugins: [Antd] },
    })

    expect(wrapper.text()).toContain(MAX_OUTPUT_TOKENS_HINT)
  })

  it('renders Get token as a link to platform.openai.com', () => {
    const wrapper = mountSettingsPanel()
    const link = wrapper.find('a.settings-panel__get-token')

    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://platform.openai.com/')
  })

  it('shows CV generation prompt textarea as disabled by default', () => {
    const wrapper = mountSettingsPanel()
    const textareas = wrapper.findAll('textarea.settings-panel__prompt-textarea')

    expect(textareas).toHaveLength(3)
    expect(textareas[0].attributes('disabled')).toBeDefined()
    expect(textareas[1].attributes('disabled')).toBeDefined()
  })

  it('shows warning and enables textarea when switch is toggled', async () => {
    const wrapper = mountSettingsPanel()

    await wrapper.find('.ant-switch').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Editing this prompt may affect')
    const textarea = wrapper.find('textarea.settings-panel__prompt-textarea')
    expect(textarea.attributes('disabled')).toBeUndefined()
  })

  it('emits save with form values on form submit', async () => {
    const onSave = vi.fn()
    const wrapper = mountSettingsPanel(onSave)

    await wrapper.get('input[placeholder="sk-..."]').setValue('sk-test-key')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(onSave).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      openAiApiKey: 'sk-test-key',
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      matchAssessmentPrompt: DEFAULT_MATCH_ASSESSMENT_PROMPT,
      coverLetterPrompt: DEFAULT_COVER_LETTER_PROMPT,
    })
  })

  it('saves theme silently when theme option is selected', async () => {
    const onSave = vi.fn()
    const wrapper = mountSettingsPanel(onSave)

    const darkButton = wrapper
      .findAll('.theme-picker__option')
      .find((btn) => btn.text().includes('Dark'))

    await darkButton!.trigger('click')
    await flushPromises()

    expect(onSave).toHaveBeenCalledWith(
      {
        ...DEFAULT_SETTINGS,
        themeMode: 'dark',
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        matchAssessmentPrompt: DEFAULT_MATCH_ASSESSMENT_PROMPT,
        coverLetterPrompt: DEFAULT_COVER_LETTER_PROMPT,
      },
      true,
    )
  })
})
