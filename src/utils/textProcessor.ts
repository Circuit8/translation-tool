const ABBREVIATIONS = [
  'Mr.',
  'Mrs.',
  'Ms.',
  'Dr.',
  'Prof.',
  'Sr.',
  'Jr.',
  'etc.',
  'vs.',
  'e.g.',
  'i.e.',
  'Inc.',
  'Ltd.',
  'Co.',
  'St.',
  'Ave.',
  'Blvd.',
  'Rd.',
  'No.',
  'Vol.',
  'Rev.',
  'Gen.',
  'Col.',
  'Lt.',
  'Sgt.',
  'Capt.',
  'Maj.',
]

export function splitIntoSentences(text: string): string[] {
  if (!text.trim()) {
    return []
  }

  // Replace abbreviations with placeholders
  let processed = text
  const placeholders: Map<string, string> = new Map()

  ABBREVIATIONS.forEach((abbr, i) => {
    const placeholder = `__ABBR_${i}__`
    placeholders.set(placeholder, abbr)
    // Case-insensitive replacement
    const regex = new RegExp(abbr.replace('.', '\\.'), 'gi')
    processed = processed.replace(regex, placeholder)
  })

  // Split on sentence-ending punctuation followed by space, or on newlines
  const rawSentences = processed
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  // Restore abbreviations and clean up
  const sentences = rawSentences.map((sentence) => {
    let restored = sentence
    placeholders.forEach((abbr, placeholder) => {
      restored = restored.replaceAll(placeholder, abbr)
    })
    return restored
  })

  return sentences
}
