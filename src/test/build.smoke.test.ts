import { describe, expect, it } from 'vitest'
import manifestExport from '../../manifest.config.ts'

type ResolvedManifest = {
  manifest_version: number
  permissions?: string[]
  host_permissions?: string[]
  action?: { default_popup?: string }
  content_scripts?: { matches?: string[]; js?: string[] }[]
}

async function resolveManifest(): Promise<ResolvedManifest> {
  return (await Promise.resolve(manifestExport)) as ResolvedManifest
}

describe('manifest smoke', () => {
  it('uses manifest v3 with required permissions and popup', async () => {
    const manifest = await resolveManifest()

    expect(manifest.manifest_version).toBe(3)
    expect(manifest.permissions).toContain('storage')
    expect(manifest.permissions).toContain('activeTab')
    expect(manifest.permissions).toContain('scripting')
    expect(manifest.action?.default_popup).toBe('index.html')
  })

  it('has content script configuration', async () => {
    const manifest = await resolveManifest()

    expect(manifest.content_scripts).toBeDefined()
    expect(manifest.content_scripts?.length).toBeGreaterThan(0)
    expect(manifest.content_scripts?.[0].matches).toContain('<all_urls>')
  })
})
