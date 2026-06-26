<p align="center">
  <img src="public/CV-Match-Logo.svg" alt="CV Match" width="220">
</p>

<p align="center">
  <a href="https://github.com/rah-emil/cv-match/actions/workflows/ci.yml"><img src="https://github.com/rah-emil/cv-match/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/rah-emil/cv-match/blob/master/LICENSE"><img src="https://img.shields.io/github/license/rah-emil/cv-match" alt="License"></a>
  <a href="https://chromewebstore.google.com/detail/cv-match/jpkafdnjcidnbclhfdjmfgjkmphidicm"><img src="https://img.shields.io/chrome-web-store/users/jpkafdnjcidnbclhfdjmfgjkmphidicm?label=installs" alt="Chrome Web Store installs"></a>
  <a href="https://chromewebstore.google.com/detail/cv-match/jpkafdnjcidnbclhfdjmfgjkmphidicm"><img src="https://img.shields.io/chrome-web-store/rating/jpkafdnjcidnbclhfdjmfgjkmphidicm?label=rating" alt="Chrome Web Store rating"></a>
</p>

Chrome MV3 extension: job posting analysis, tailored CV/cover letter generation via OpenAI, form autofill.

## How it works

```
Popup (Vue 3)                    Content scripts (job page)
├─ Home                          ├─ extractJobText.ts — auto JD / manual picker
│  ├─ Evaluate match             └─ autoFillForm.ts — fill empty inputs
│  ├─ Generate CV + cover letter
│  ├─ Auto-fill form
│  └─ PDF / MD export
├─ Profile — CV upload, avatar, contacts
└─ Settings — API key, models, prompts
         ↕ chrome.storage + tabs.sendMessage
```

1. **Profile** — upload CV (PDF/DOCX) → AI builds `cvContext` and fills contact fields.
2. **Settings** — OpenAI API key (BYOK), model, prompts.
3. Open a job posting → popup reads the JD (auto-detect or **Select block on page**).
4. **Evaluate match** — score 0–10. **Generate CV** — CV + cover letter + fit notes. **Auto-fill** — empty form fields from profile.

Match and generation use `cvContext` only; raw CV text is not stored after analysis.

## Development

```bash
pnpm install
pnpm dev         # HMR, outputs to dist/
pnpm build       # production → dist/
```

## Tests

```bash
pnpm test        # vitest
pnpm check       # tsc + tests + build
```

## Load in Chrome (manual)

1. `pnpm build` (or `pnpm dev` while developing)
2. `chrome://extensions` → **Developer mode** → **Load unpacked**
3. Select the **`dist/`** folder in the repo root
4. Click the CV Match toolbar icon to open the popup

> Reload the job page after content script changes.  
> Open the popup via the extension icon only — otherwise `chrome.storage` is unavailable.

## Chrome Web Store

Only manual flow at the moment
