import { describe, expect, it } from 'vitest'
import { renderCvDocumentHtml } from './cvDocument'

describe('cvDocument template', () => {
  it('wraps markdown content in the CV document layout', () => {
    const html = renderCvDocumentHtml('# Jane Doe\n\n## Summary\n- Engineer')

    expect(html).toContain('class="cv-doc"')
    expect(html).toContain('class="cv-doc__accent"')
    expect(html).toContain('class="cv-doc__body"')
    expect(html).toContain('<h1>Jane Doe</h1>')
    expect(html).toContain('<h2>Summary</h2>')
    expect(html).toContain('<li>Engineer</li>')
  })

  it('renders avatar as a cover background to avoid distortion', () => {
    const html = renderCvDocumentHtml('# Jane Doe', {
      avatarDataUrl: 'data:image/png;base64,abc',
    })

    expect(html).toContain('class="cv-doc__avatar"')
    expect(html).toContain("background-image: url('data:image/png;base64,abc')")
    expect(html).not.toContain('<img class="cv-doc__avatar"')
  })
})
