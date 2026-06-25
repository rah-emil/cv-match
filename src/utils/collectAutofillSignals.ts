export function collectAutofillSignalTexts(element: HTMLElement): string[] {
  const parts: string[] = []

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    if (element.name) parts.push(element.name)
    if (element.id) parts.push(element.id)
    if (element.autocomplete) parts.push(element.autocomplete)
    if (element.placeholder) parts.push(element.placeholder)
  }

  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) parts.push(ariaLabel)

  const ariaLabelledBy = element.getAttribute('aria-labelledby')
  if (ariaLabelledBy) {
    for (const id of ariaLabelledBy.split(/\s+/)) {
      const labelEl = element.ownerDocument.getElementById(id)
      if (labelEl?.textContent) parts.push(labelEl.textContent)
    }
  }

  const dataTestId = element.getAttribute('data-testid')
  if (dataTestId) parts.push(dataTestId)

  if (element.id) {
    const linkedLabel = element.ownerDocument.querySelector(
      `label[for="${CSS.escape(element.id)}"]`,
    )
    if (linkedLabel?.textContent) parts.push(linkedLabel.textContent)
  }

  const wrappingLabel = element.closest('label')
  if (wrappingLabel?.textContent) parts.push(wrappingLabel.textContent)

  parts.push(...findNearbyLabelTexts(element))

  return parts
}

function findNearbyLabelTexts(element: HTMLElement): string[] {
  const texts = new Set<string>()
  let node: HTMLElement | null = element

  for (let depth = 0; depth < 6 && node; depth++) {
    const parent: HTMLElement | null = node.parentElement
    if (!parent) break

    for (const child of parent.children) {
      if (child === node) continue

      if (child.tagName === 'LABEL') {
        addLabelText(texts, child.textContent)
        continue
      }

      if (
        child instanceof HTMLElement &&
        child.matches('[role="label"], [class*="label" i], [class*="Label"]')
      ) {
        addLabelText(texts, child.textContent)
      }
    }

    parent.querySelectorAll(':scope > label').forEach((label: Element) => {
      addLabelText(texts, label.textContent)
    })

    node = parent
  }

  return [...texts]
}

function addLabelText(target: Set<string>, raw: string | null | undefined) {
  const text = raw?.replace(/\s+/g, ' ').trim()
  if (!text || text.length > 120) return
  target.add(text)
}
