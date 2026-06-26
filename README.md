<p align="center">
  <img src="public/CV-Match-Logo.svg" alt="CV Match" width="220">
</p>

<p align="center">
  <a href="https://github.com/rah-emil/cv-match/actions/workflows/ci.yml"><img src="https://github.com/rah-emil/cv-match/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/rah-emil/cv-match/blob/master/LICENSE"><img src="https://img.shields.io/github/license/rah-emil/cv-match" alt="License"></a>
  <a href="https://chromewebstore.google.com/detail/cv-match/jpkafdnjcidnbclhfdjmfgjkmphidicm"><img src="https://img.shields.io/chrome-web-store/users/jpkafdnjcidnbclhfdjmfgjkmphidicm?label=installs" alt="Chrome Web Store installs"></a>
  <a href="https://chromewebstore.google.com/detail/cv-match/jpkafdnjcidnbclhfdjmfgjkmphidicm"><img src="https://img.shields.io/chrome-web-store/rating/jpkafdnjcidnbclhfdjmfgjkmphidicm?label=rating" alt="Chrome Web Store rating"></a>
</p>

Chrome MV3-расширение: анализ вакансии, генерация CV/cover letter через OpenAI, автозаполнение форм.

## Как работает

```
Popup (Vue 3)                    Content scripts (на странице вакансии)
├─ Home                          ├─ extractJobText.ts — JD auto / ручной picker
│  ├─ Evaluate match             └─ autoFillForm.ts — заполнение input/textarea
│  ├─ Generate CV + cover letter
│  ├─ Auto-fill form
│  └─ PDF / MD export
├─ Profile — CV, аватар, контакты
└─ Settings — API key, модели, промпты
         ↕ chrome.storage + tabs.sendMessage
```

1. **Profile** — загрузка CV (PDF/DOCX) → AI строит `cvContext` и подтягивает контакты.
2. **Settings** — OpenAI API key (BYOK), модель, промпты.
3. Открыть страницу вакансии → popup читает JD (авто или «Select block on page»).
4. **Evaluate match** — оценка 0–10. **Generate CV** — CV + cover letter + fit notes. **Auto-fill** — пустые поля формы по профилю.

## Запуск

```bash
pnpm install
pnpm dev         # HMR, сборка в dist/
pnpm build       # production → dist/
```

## Тесты

```bash
pnpm test        # vitest
pnpm check       # tsc + tests + build
```

## Установка в Chrome (вручную)

1. `pnpm build` (или `pnpm dev` для разработки)
2. `chrome://extensions` → **Developer mode** → **Load unpacked**
3. Папка **`dist/`** из корня репозитория
4. Иконка CV Match в toolbar → popup

> После изменений content scripts перезагрузите страницу вакансии.  
> Popup открывать только через иконку расширения — иначе `chrome.storage` недоступен.

## Store

[Chrome Web Store](https://chromewebstore.google.com/detail/cv-match/jpkafdnjcidnbclhfdjmfgjkmphidicm)
