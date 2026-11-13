/**
 * Project titles come from the CMS in Polish ("Apartament w Centrum").
 * For English and Spanish visitors we translate the generic words — the kind
 * of property and a few common phrases — and leave proper names (streets,
 * places, hotel and brand names) exactly as written.
 *
 * A title_en / title_es set in the CMS always wins over this glossary.
 */
type Lang = 'en' | 'es'

// Longer phrases first, so "lokal usługowy" is matched before "lokal".
const GLOSSARY: Array<[string, Record<Lang, string>]> = [
  ['lokal usługowy', { en: 'Commercial space', es: 'Local comercial' }],
  ['w centrum', { en: 'in the City Centre', es: 'en el Centro' }],
  ['nad jeziorem', { en: 'by the Lake', es: 'junto al Lago' }],
  ['nad morzem', { en: 'by the Sea', es: 'junto al Mar' }],
  ['apartament', { en: 'Apartment', es: 'Apartamento' }],
  ['mieszkanie', { en: 'Flat', es: 'Piso' }],
  ['kawalerka', { en: 'Studio flat', es: 'Estudio' }],
  ['rezydencja', { en: 'Residence', es: 'Residencia' }],
  ['pensjonat', { en: 'Guesthouse', es: 'Pensión' }],
  ['restauracja', { en: 'Restaurant', es: 'Restaurante' }],
  ['biuro', { en: 'Office', es: 'Oficina' }],
  ['willa', { en: 'Villa', es: 'Villa' }],
  ['dom', { en: 'House', es: 'Casa' }],
]

function matchCase(source: string, replacement: string): string {
  const first = source.charAt(0)
  const startsUpper = first !== first.toLowerCase()
  const head = replacement.charAt(0)
  return (startsUpper ? head.toUpperCase() : head.toLowerCase()) + replacement.slice(1)
}

export function translateTitle(title: string, lang: string): string {
  if (lang !== 'en' && lang !== 'es') return title

  let result = title
  for (const [polish, translations] of GLOSSARY) {
    // Whole words only: "dom" must not touch "Domaniewska".
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${polish.replace(/ /g, '\\s+')}(?![\\p{L}\\p{N}])`, 'giu')
    result = result.replace(pattern, (found) => matchCase(found, translations[lang]))
  }
  return result
}

/** Title to show for a CMS item in the given language. */
export function localizedTitle(
  item: { title?: string; title_en?: string | null; title_es?: string | null },
  lang: string,
): string {
  const title = item.title ?? ''
  if (lang === 'en' && item.title_en) return item.title_en
  if (lang === 'es' && item.title_es) return item.title_es
  return translateTitle(title, lang)
}
