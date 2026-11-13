/**
 * Which photo opens the home page, and in which sizes to request it.
 * Shared by the browser code and by the build step (vite.config.ts) that
 * puts the hero photo into the HTML, so the phone can start downloading it
 * before any JavaScript has run.
 */
export const HERO_WIDTHS = [640, 960, 1280, 1920]

/** Sanity file names end in -WIDTHxHEIGHT.ext */
export function isLandscape(url: string | null | undefined): boolean {
  const match = /-(\d+)x(\d+)\.\w+$/.exec(url ?? '')
  return match ? Number(match[1]) > Number(match[2]) : false
}

/** Hero set in the CMS, else the first landscape cover, else the first cover. */
export function pickHeroUrl(
  settingsHeroUrl: string | null | undefined,
  items: Array<{ imageUrl?: string | null }>,
): string | null {
  if (settingsHeroUrl) return settingsHeroUrl
  const covers = items.map((item) => item.imageUrl).filter((url): url is string => Boolean(url))
  return covers.find((url) => isLandscape(url)) ?? covers[0] ?? null
}

function isSanityImage(url: string): boolean {
  return url.startsWith('https://cdn.sanity.io/')
}

/** Default source for browsers that ignore srcset. */
export function heroSrc(url: string): string {
  return isSanityImage(url) ? `${url}?auto=format&q=70&w=1280` : url
}

/** Width candidates, so a phone does not download the desktop-sized file. */
export function heroSrcset(url: string): string {
  if (!isSanityImage(url)) return ''
  return HERO_WIDTHS.map((width) => `${url}?auto=format&q=70&w=${width} ${width}w`).join(', ')
}
