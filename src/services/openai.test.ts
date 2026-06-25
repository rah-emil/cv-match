import { describe, expect, it, vi, beforeEach } from 'vitest'
import { DEFAULT_SETTINGS, DEFAULT_COVER_LETTER_PROMPT, DEFAULT_MATCH_ASSESSMENT_PROMPT, DEFAULT_SYSTEM_PROMPT } from '../types/settings'
import {
  generateCv,
  evaluateMatch,
  generateCoverLetter,
  buildUserMessage,
  buildMatchAssessmentUserMessage,
  buildCoverLetterUserMessage,
  buildCompletionBody,
  usesMaxCompletionTokens,
} from './openai'

describe('openai service', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('buildUserMessage', () => {
    it('includes job text and cv content', () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        cvContent: 'Senior engineer with 10 years experience',
        coverLetter: 'Extra context',
      }

      const msg = buildUserMessage(settings, 'Looking for a React developer')

      expect(msg).toContain('=== JOB DESCRIPTION ===')
      expect(msg).toContain('=== CONTACT DETAILS ===')
      expect(msg).toContain('Looking for a React developer')
      expect(msg).toContain('=== MY CV ===')
      expect(msg).toContain('Senior engineer with 10 years experience')
      expect(msg).toContain('=== ADDITIONAL CONTEXT ===')
      expect(msg).toContain('Extra context')
    })

    it('omits additional context section when cover letter is empty', () => {
      const settings = { ...DEFAULT_SETTINGS, cvContent: 'My CV text' }
      const msg = buildUserMessage(settings, 'Job text')

      expect(msg).not.toContain('ADDITIONAL CONTEXT')
    })

    it('includes output format instructions', () => {
      const msg = buildUserMessage(DEFAULT_SETTINGS, 'Job text')

      expect(msg).toContain('=== OUTPUT FORMAT ===')
      expect(msg).toContain('Markdown')
    })

    it('shows placeholder when no cv content', () => {
      const msg = buildUserMessage(DEFAULT_SETTINGS, 'Job text')

      expect(msg).toContain('no CV uploaded')
    })
  })

  describe('buildMatchAssessmentUserMessage', () => {
    it('requests score in Overall Match Score format', () => {
      const msg = buildMatchAssessmentUserMessage(
        { ...DEFAULT_SETTINGS, cvContent: 'My CV' },
        'Job text',
      )

      expect(msg).toContain('Overall Match Score: X/10')
      expect(msg).toContain('=== JOB DESCRIPTION ===')
      expect(msg).toContain('=== MY CV ===')
    })
  })

  describe('usesMaxCompletionTokens', () => {
    it('returns true for gpt-5 models', () => {
      expect(usesMaxCompletionTokens('gpt-5.5')).toBe(true)
      expect(usesMaxCompletionTokens('gpt-5.4-mini')).toBe(true)
    })

    it('returns false for gpt-4o', () => {
      expect(usesMaxCompletionTokens('gpt-4o')).toBe(false)
    })
  })

  describe('buildCompletionBody', () => {
    it('uses max_completion_tokens for gpt-5 models', () => {
      const body = buildCompletionBody(
        { ...DEFAULT_SETTINGS, model: 'gpt-5.5' },
        [{ role: 'user', content: 'hi' }],
      )
      expect(body).toHaveProperty('max_completion_tokens', 4096)
      expect(body).not.toHaveProperty('max_tokens')
      expect(body).not.toHaveProperty('temperature')
    })

    it('uses max_tokens for gpt-4o', () => {
      const body = buildCompletionBody(
        { ...DEFAULT_SETTINGS, model: 'gpt-4o' },
        [{ role: 'user', content: 'hi' }],
      )
      expect(body).toHaveProperty('max_tokens', 4096)
      expect(body).toHaveProperty('temperature', 0.4)
      expect(body).not.toHaveProperty('max_completion_tokens')
    })

    it('uses custom maxOutputTokens from settings', () => {
      const body = buildCompletionBody(
        { ...DEFAULT_SETTINGS, model: 'gpt-4o', maxOutputTokens: 8192 },
        [{ role: 'user', content: 'hi' }],
      )
      expect(body).toHaveProperty('max_tokens', 8192)
    })
  })

  describe('generateCv', () => {
    it('uses systemPrompt from settings as system message', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Generated CV text' } }],
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      globalThis.fetch = fetchMock

      const settings = {
        ...DEFAULT_SETTINGS,
        openAiApiKey: 'sk-test-key',
        systemPrompt: 'Custom system prompt',
        cvContent: 'My CV',
      }

      await generateCv({ settings, jobText: 'Need a developer' })

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
        messages: { role: string; content: string }[]
      }
      expect(body.messages[0].role).toBe('system')
      expect(body.messages[0].content).toBe('Custom system prompt')
    })

    it('uses DEFAULT_SYSTEM_PROMPT when settings has default', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'ok' } }] }),
      })
      globalThis.fetch = fetchMock

      await generateCv({ settings: DEFAULT_SETTINGS, jobText: 'Job' })

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
        messages: { role: string; content: string }[]
      }
      expect(body.messages[0].content).toBe(DEFAULT_SYSTEM_PROMPT)
    })

    it('calls OpenAI API with correct parameters', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Generated CV text' } }],
          }),
      })
      globalThis.fetch = fetchMock

      const settings = {
        ...DEFAULT_SETTINGS,
        openAiApiKey: 'sk-test-key',
        openAiApiUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
      }

      const result = await generateCv({ settings, jobText: 'Need a developer' })

      expect(result).toBe('Generated CV text')
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-test-key',
          }),
        }),
      )
    })

    it('throws on API error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      })

      await expect(
        generateCv({ settings: DEFAULT_SETTINGS, jobText: 'Job' }),
      ).rejects.toThrow('OpenAI API error 401')
    })

    it('throws on empty response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [] }),
      })

      await expect(
        generateCv({ settings: DEFAULT_SETTINGS, jobText: 'Job' }),
      ).rejects.toThrow('OpenAI returned an empty response')
    })
  })

  describe('evaluateMatch', () => {
    it('uses matchAssessmentModel instead of CV model', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Overall Match Score: 8/10' } }],
          }),
      })
      globalThis.fetch = fetchMock

      const settings = {
        ...DEFAULT_SETTINGS,
        openAiApiKey: 'sk-test-key',
        model: 'gpt-5.5',
        matchAssessmentModel: 'gpt-4o-mini-2024-07-18',
        matchAssessmentPrompt: 'Custom match prompt',
        cvContent: 'My CV',
      }

      await evaluateMatch({ settings, jobText: 'Need a developer' })

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
        model: string
        messages: { role: string; content: string }[]
      }
      expect(body.model).toBe('gpt-4o-mini-2024-07-18')
      expect(body.messages[0].content).toBe('Custom match prompt')
    })

    it('uses DEFAULT_MATCH_ASSESSMENT_PROMPT when settings has default', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'ok' } }] }),
      })
      globalThis.fetch = fetchMock

      await evaluateMatch({
        settings: { ...DEFAULT_SETTINGS, openAiApiKey: 'sk-test' },
        jobText: 'Job',
      })

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
        messages: { role: string; content: string }[]
      }
      expect(body.messages[0].content).toBe(DEFAULT_MATCH_ASSESSMENT_PROMPT)
    })
  })

  describe('buildCoverLetterUserMessage', () => {
    it('includes contact details and plain prose output format', () => {
      const msg = buildCoverLetterUserMessage(
        {
          ...DEFAULT_SETTINGS,
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          cvContent: 'My CV',
        },
        'Job text',
      )

      expect(msg).toContain('=== CONTACT DETAILS ===')
      expect(msg).toContain('Name: Jane Doe')
      expect(msg).toContain('cover letter text as plain prose')
    })
  })

  describe('generateCoverLetter', () => {
    it('uses coverLetterPrompt as system message', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Dear hiring manager...' } }],
          }),
      })
      globalThis.fetch = fetchMock

      const settings = {
        ...DEFAULT_SETTINGS,
        openAiApiKey: 'sk-test-key',
        coverLetterPrompt: 'Custom cover letter prompt',
        cvContent: 'My CV',
      }

      const result = await generateCoverLetter({ settings, jobText: 'Need a developer' })

      expect(result).toBe('Dear hiring manager...')
      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
        messages: { role: string; content: string }[]
      }
      expect(body.messages[0].content).toBe('Custom cover letter prompt')
    })

    it('uses DEFAULT_COVER_LETTER_PROMPT when settings has default', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'ok' } }] }),
      })
      globalThis.fetch = fetchMock

      await generateCoverLetter({
        settings: { ...DEFAULT_SETTINGS, openAiApiKey: 'sk-test', cvContent: 'CV' },
        jobText: 'Job',
      })

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
        messages: { role: string; content: string }[]
      }
      expect(body.messages[0].content).toBe(DEFAULT_COVER_LETTER_PROMPT)
    })
  })
})
