import { describe, expect, it, vi, beforeEach } from 'vitest'
import { DEFAULT_SETTINGS } from '../types/settings'
import { generateCv, buildUserMessage, SYSTEM_PROMPT } from './openai'

describe('openai service', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('buildUserMessage', () => {
    it('includes job text and cover letter', () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        coverLetter: 'Senior engineer with 10 years experience',
        cvFilePath: '/path/to/cv.pdf',
      }

      const msg = buildUserMessage(settings, 'Looking for a React developer')

      expect(msg).toContain('=== JOB POSTING ===')
      expect(msg).toContain('Looking for a React developer')
      expect(msg).toContain('=== CANDIDATE BACKGROUND / COVER LETTER ===')
      expect(msg).toContain('Senior engineer with 10 years experience')
      expect(msg).toContain('/path/to/cv.pdf')
      expect(msg).toContain('Do NOT invent any experience')
    })

    it('omits cv path section when empty', () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        coverLetter: 'Some experience',
      }

      const msg = buildUserMessage(settings, 'Job text')

      expect(msg).not.toContain('CV FILE PATH')
    })
  })

  describe('SYSTEM_PROMPT', () => {
    it('emphasizes truthfulness', () => {
      expect(SYSTEM_PROMPT).toContain('NEVER fabricate')
      expect(SYSTEM_PROMPT).toContain('100% truthful')
    })
  })

  describe('generateCv', () => {
    it('calls OpenAI API with correct parameters', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Generated CV text' } }],
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const settings = {
        ...DEFAULT_SETTINGS,
        openAiApiKey: 'sk-test-key',
        openAiApiUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        coverLetter: 'My experience',
      }

      const result = await generateCv({
        settings,
        jobText: 'Need a developer',
      })

      expect(result).toBe('Generated CV text')
      expect(fetch).toHaveBeenCalledWith(
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

      const settings = {
        ...DEFAULT_SETTINGS,
        openAiApiKey: 'bad-key',
        coverLetter: 'My experience',
      }

      await expect(
        generateCv({ settings, jobText: 'Job' }),
      ).rejects.toThrow('OpenAI API error 401')
    })

    it('throws on empty response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [] }),
      })

      const settings = {
        ...DEFAULT_SETTINGS,
        openAiApiKey: 'sk-key',
        coverLetter: 'My experience',
      }

      await expect(
        generateCv({ settings, jobText: 'Job' }),
      ).rejects.toThrow('OpenAI returned an empty response')
    })
  })
})
