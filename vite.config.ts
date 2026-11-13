import { defineConfig, type Plugin } from 'vite'
import { heroSrc, heroSrcset, pickHeroUrl } from './src/lib/heroImage'
import { buildStaticSections, buildStructuredData } from './src/lib/staticContent'
import { translations } from './src/translations'

const SANITY_QUERY_URL = 'https://eu9o3lpb.apicdn.sanity.io/v2023-05-03/data/query/production'
const HERO_QUERY = `{
  "hero": *[_type == "siteSettings"][0].heroImage.asset->url,
  "items": *[_type == "portfolioItem" && showOnHome == true]{
    title, location, "slug": slug.current, "imageUrl": image.asset->url
  },
  "bio": *[_type == "aboutPage"][0].bio[]{ style, "text": array::join(children[].text, "") }
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
    name: 'kuczewska-static-html',
    apply: 'build',
    async transformIndexHtml(html) {
      let preload = ''
      let image = ''
      // Text and schema.org data for crawlers that do not run JavaScript.
      // Built from the Polish copy; filled with CMS data when it is reachable.
      const tr = translations.pl
      let projects: Array<{ title: string; location?: string | null; slug: string }> = []
      let bio: string[] = []
      let heroUrl: string | null = null
      try {
        const response = await fetch(`${SANITY_QUERY_URL}?query=${encodeURIComponent(HERO_QUERY)}`, {
          signal: AbortSignal.timeout(10_000),
        })
        const { result } = (await response.json()) as {
          result: {
            hero: string | null
            items: Array<{ title: string; location: string | null; slug: string; imageUrl: string | null }>
            bio: Array<{ style: string; text: string }> | null
          }
        }
        projects = (result.items ?? []).filter((item) => item.title && item.slug)
        bio = (result.bio ?? [])
          .filter((block) => block.style === 'normal' && block.text?.trim())
          .map((block) => block.text.trim())
        const url = pickHeroUrl(result.hero, result.items ?? [])
        heroUrl = url
        if (url) {
          const srcset = heroSrcset(url)
          preload = `<link rel="preload" as="image" fetchpriority="high" href="${heroSrc(url)}" imagesrcset="${srcset}" imagesizes="100vw">`
          image = `<img id="hero-img" class="loaded" data-source="${url}" src="${heroSrc(url)}" srcset="${srcset}" sizes="100vw" alt="Wnętrze sfotografowane przez Ankę Kuczewską" fetchpriority="high">`
        }
      } catch (error) {
        console.warn('[hero-in-html] CMS not reachable, building without a preloaded hero:', error)
      }
      return html
        .replace('<!--hero-preload-->', preload)
        .replace('<!--hero-img-->', image)
        .replace('<!--structured-data-->', buildStructuredData({ tr, imageUrl: heroUrl }))
        .replace('<!--static-content-->', buildStaticSections({ tr, projects, bio }))
    },
  }
}

export default defineConfig({
  plugins: [heroInHtml()],
})
