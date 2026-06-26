import { describe, expect, it, vi, beforeEach } from 'vitest'
import { DEFAULT_SETTINGS, DEFAULT_COVER_LETTER_PROMPT, DEFAULT_MATCH_ASSESSMENT_PROMPT, DEFAULT_SYSTEM_PROMPT } from '../types/settings'
import {
  generateCv,
  evaluateMatch,
  analyzeCv,
  buildUserMessage,
  buildMatchAssessmentUserMessage,
  buildCvSystemMessage,
  parseGeneratedCv,
  parseCvAnalysis,
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
      expect(msg).toContain('JSON')
      expect(msg).toContain('cvContent')
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
    it('embeds systemPrompt from settings into the system message', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                cvContent: '# CV',
                coverLetter: 'Letter',
                matchComment: 'Strong fit',
              }),
            },
          },
        ],
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
        response_format?: { type: string }
      }
      expect(body.messages[0].role).toBe('system')
      expect(body.messages[0].content).toContain('Custom system prompt')
      expect(body.messages[0].content).toContain('cvContent')
      expect(body.response_format).toEqual({ type: 'json_object' })
    })

    it('embeds DEFAULT_SYSTEM_PROMPT when settings has default', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: '{"cvContent":"x","coverLetter":"","matchComment":""}' } }],
          }),
      })
      globalThis.fetch = fetchMock

      await generateCv({ settings: DEFAULT_SETTINGS, jobText: 'Job' })

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
        messages: { role: string; content: string }[]
      }
      expect(body.messages[0].content).toContain(DEFAULT_SYSTEM_PROMPT)
    })

    it('parses the JSON response into cvContent, coverLetter and matchComment', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    cvContent: '# Jane Doe',
                    coverLetter: 'Dear hiring manager...',
                    matchComment: 'Solid match with minor gaps.',
                  }),
                },
              },
            ],
          }),
      })
      globalThis.fetch = fetchMock

      const settings = {
        ...DEFAULT_SETTINGS,
        openAiApiKey: 'sk-test-key',
        model: 'gpt-4o',
      }

      const result = await generateCv({ settings, jobText: 'Need a developer' })

      expect(result.cvContent).toBe('# Jane Doe')
      expect(result.coverLetter).toBe('Dear hiring manager...')
      expect(result.matchComment).toBe('Solid match with minor gaps.')
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

    it('calls Anthropic messages API when anthropic provider is selected', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ type: 'text', text: 'Overall Match Score: 8/10' }],
          }),
      })
      globalThis.fetch = fetchMock

      await evaluateMatch({
        settings: {
          ...DEFAULT_SETTINGS,
          aiProvider: 'anthropic',
          openAiApiKey: 'sk-ant-test',
          openAiApiUrl: 'https://api.anthropic.com/v1',
          matchAssessmentModel: 'claude-3-5-haiku-20241022',
        },
        jobText: 'Need a developer',
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant-test',
            'anthropic-version': '2023-06-01',
          }),
        }),
      )

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
        model: string
        system: string
        messages: { role: string; content: string }[]
      }
      expect(body.model).toBe('claude-3-5-haiku-20241022')
      expect(body.system).toBe(DEFAULT_MATCH_ASSESSMENT_PROMPT)
      expect(body.messages[0].role).toBe('user')
    })
  })

  describe('analyzeCv', () => {
    it('uses the default (match assessment) model and requests JSON', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    cvContext: 'Senior engineer. Skills: React, Node, English',
                    notes: 'No quantified results',
                  }),
                },
              },
            ],
          }),
      })
      globalThis.fetch = fetchMock

      const settings = {
        ...DEFAULT_SETTINGS,
        openAiApiKey: 'sk-test-key',
        model: 'gpt-5.5',
        matchAssessmentModel: 'gpt-4o-mini-2024-07-18',
      }

      const result = await analyzeCv({ settings, cvText: 'My raw CV text' })

      expect(result.cvContext).toContain('Senior engineer')
      expect(result.notes).toBe('No quantified results')

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
        model: string
        response_format?: { type: string }
        messages: { role: string; content: string }[]
      }
      expect(body.model).toBe('gpt-4o-mini-2024-07-18')
      expect(body.response_format).toEqual({ type: 'json_object' })
      expect(body.messages[1].content).toContain('My raw CV text')
    })

    it('falls back to settings.model when no default model is set', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: '{"cvContext":"x","notes":""}' } }],
          }),
      })
      globalThis.fetch = fetchMock

      await analyzeCv({
        settings: {
          ...DEFAULT_SETTINGS,
          openAiApiKey: 'sk-test',
          model: 'gpt-4o',
          matchAssessmentModel: '',
        },
        cvText: 'CV',
      })

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
        model: string
      }
      expect(body.model).toBe('gpt-4o')
    })
  })

  describe('parseCvAnalysis', () => {
    const emptyProfile = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      linkedIn: '',
      telegram: '',
      website: '',
    }

    it('parses a clean JSON object', () => {
      const result = parseCvAnalysis('{"cvContext":"Summary","notes":"Gaps"}')
      expect(result).toEqual({
        cvContext: 'Summary',
        notes: 'Gaps',
        profile: emptyProfile,
      })
    })

    it('extracts profile contact fields and trims them', () => {
      const result = parseCvAnalysis(
        JSON.stringify({
          cvContext: 'Summary',
          notes: '',
          profile: {
            firstName: ' Jane ',
            lastName: 'Doe',
            email: 'jane@example.com',
            phone: '+1 555',
            linkedIn: 'linkedin.com/in/jane',
            telegram: '@jane',
            website: 'jane.dev',
            unexpected: 'ignored',
          },
        }),
      )

      expect(result.profile).toEqual({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '+1 555',
        linkedIn: 'linkedin.com/in/jane',
        telegram: '@jane',
        website: 'jane.dev',
      })
    })

    it('stringifies an object cvContext returned by the model', () => {
      const result = parseCvAnalysis(
        '{"cvContext":{"summary":"x","skills":["a","b"]},"notes":""}',
      )
      expect(result.cvContext).toContain('skills')
      expect(result.cvContext).toContain('"a"')
      expect(result.notes).toBe('')
    })

    it('defaults notes to an empty string when missing', () => {
      const result = parseCvAnalysis('{"cvContext":"Summary"}')
      expect(result.cvContext).toBe('Summary')
      expect(result.notes).toBe('')
    })

    it('falls back to the raw response when JSON parsing fails', () => {
      const result = parseCvAnalysis('Just plain text, not JSON')
      expect(result.cvContext).toBe('Just plain text, not JSON')
      expect(result.notes).toBe('')
    })
  })

  describe('buildCvSystemMessage', () => {
    it('combines the CV prompt, cover letter prompt and JSON contract', () => {
      const msg = buildCvSystemMessage({
        ...DEFAULT_SETTINGS,
        systemPrompt: 'CV rules here',
        coverLetterPrompt: 'Cover letter rules here',
      })

      expect(msg).toContain('CV rules here')
      expect(msg).toContain('Cover letter rules here')
      expect(msg).toContain('cvContent')
      expect(msg).toContain('coverLetter')
      expect(msg).toContain('matchComment')
    })

    it('uses the default prompts when settings are unchanged', () => {
      const msg = buildCvSystemMessage(DEFAULT_SETTINGS)

      expect(msg).toContain(DEFAULT_SYSTEM_PROMPT)
      expect(msg).toContain(DEFAULT_COVER_LETTER_PROMPT)
    })
  })

  describe('parseGeneratedCv', () => {
    it('parses a clean JSON object', () => {
      const result = parseGeneratedCv(
        '{"cvContent":"# CV","coverLetter":"Letter","matchComment":"Note"}',
      )

      expect(result).toEqual({
        cvContent: '# CV',
        coverLetter: 'Letter',
        matchComment: 'Note',
      })
    })

    it('strips code fences and trailing prose around the JSON', () => {
      const raw = 'Here you go:\n```json\n{"cvContent":"# CV","coverLetter":"L","matchComment":"M"}\n```'
      const result = parseGeneratedCv(raw)

      expect(result.cvContent).toBe('# CV')
      expect(result.coverLetter).toBe('L')
      expect(result.matchComment).toBe('M')
    })

    it('falls back to treating the whole response as the CV body', () => {
      const result = parseGeneratedCv('Just a plain CV with no JSON')

      expect(result.cvContent).toBe('Just a plain CV with no JSON')
      expect(result.coverLetter).toBe('')
      expect(result.matchComment).toBe('')
    })

    it('defaults missing optional fields to empty strings', () => {
      const result = parseGeneratedCv('{"cvContent":"# CV"}')

      expect(result.cvContent).toBe('# CV')
      expect(result.coverLetter).toBe('')
      expect(result.matchComment).toBe('')
    })
  })
})
