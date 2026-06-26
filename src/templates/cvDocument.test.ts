import { describe, expect, it } from 'vitest'
import {
  buildCvExportBasename,
  buildCvExportFilename,
  renderCvDocumentHtml,
} from './cvDocument'

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

  it('builds export filenames as CV-First_Name-Last_Name-dd-mm-yyyy', () => {
    const date = new Date(2026, 5, 26)

    expect(buildCvExportBasename('Jane', 'Doe', date)).toBe('CV-Jane-Doe-26-06-2026')
    expect(buildCvExportFilename('Jane', 'Doe', 'pdf', date)).toBe(
      'CV-Jane-Doe-26-06-2026.pdf',
    )
    expect(buildCvExportFilename('Jane', 'Doe', 'md', date)).toBe(
      'CV-Jane-Doe-26-06-2026.md',
    )
    expect(buildCvExportBasename('  Mary Ann ', " O'Brien ", date)).toBe(
      "CV-Mary_Ann-O'Brien-26-06-2026",
    )
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
