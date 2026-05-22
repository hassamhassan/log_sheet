/** Arabic / Urdu script ranges for display splitting (no translation) */
const ARABIC_SCRIPT =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
const LATIN_LETTERS = /[A-Za-z\u00C0-\u024F]/

/**
 * Split a geocoder display_name into display lines by script / separator.
 * Supports future locale toggle via data-locale on each line.
 */
export function parseStopLocation(location) {
  const raw = (location ?? '').trim()
  if (!raw) return { lines: [], raw: '' }

  const segments = raw
    .split(/\n+|(?:\s*\|\s*)|(?:\s*\/\s*)/)
    .map((part) => part.trim())
    .filter(Boolean)

  const pieces = segments.length > 1 ? segments : [raw]
  const lines = []
  const seen = new Set()

  for (const piece of pieces) {
    const hasArabic = ARABIC_SCRIPT.test(piece)
    const hasLatin = LATIN_LETTERS.test(piece)

    let locale = 'und'
    let dir = 'auto'
    if (hasArabic && !hasLatin) {
      locale = 'ur'
      dir = 'rtl'
    } else if (hasLatin && !hasArabic) {
      locale = 'en'
      dir = 'ltr'
    }

    const key = `${locale}:${piece}`
    if (seen.has(key)) continue
    seen.add(key)
    lines.push({ text: piece, locale, dir })
  }

  return { lines, raw }
}
