import { defineConfig, type Plugin } from 'vite'
import { heroSrc, heroSrcset, pickHeroUrl } from './src/lib/heroImage'

const SANITY_QUERY_URL = 'https://eu9o3lpb.apicdn.sanity.io/v2023-05-03/data/query/production'
const HERO_QUERY = `{
  "hero": *[_type == "siteSettings"][0].heroImage.asset->url,
  "items": *[_type == "portfolioItem" && showOnHome == true]{ "imageUrl": image.asset->url }
}`

/**
 * Puts the hero photo straight into index.html at build time (a preload hint
 * plus the <img> itself). Without it the browser only learns which photo to
 * fetch after downloading and running the whole app — seconds later on a phone.
 * If the CMS cannot be reached the page is built without it and the app fills
 * the photo in at runtime, as before.
 */
function heroInHtml(): Plugin {
  return {
    name: 'kuczewska-hero-in-html',
    apply: 'build',
    async transformIndexHtml(html) {
      let preload = ''
      let image = ''
      try {
        const response = await fetch(`${SANITY_QUERY_URL}?query=${encodeURIComponent(HERO_QUERY)}`, {
          signal: AbortSignal.timeout(10_000),
        })
        const { result } = (await response.json()) as {
          result: { hero: string | null; items: Array<{ imageUrl: string | null }> }
        }
        const url = pickHeroUrl(result.hero, result.items ?? [])
        if (url) {
          const srcset = heroSrcset(url)
          preload = `<link rel="preload" as="image" fetchpriority="high" href="${heroSrc(url)}" imagesrcset="${srcset}" imagesizes="100vw">`
          image = `<img id="hero-img" class="loaded" data-source="${url}" src="${heroSrc(url)}" srcset="${srcset}" sizes="100vw" alt="Wnętrze sfotografowane przez Ankę Kuczewską" fetchpriority="high">`
        }
      } catch (error) {
        console.warn('[hero-in-html] CMS not reachable, building without a preloaded hero:', error)
      }
      return html.replace('<!--hero-preload-->', preload).replace('<!--hero-img-->', image)
    },
  }
}

export default defineConfig({
  plugins: [heroInHtml()],
})
