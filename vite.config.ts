import { defineConfig, type Plugin } from 'vite'
import { HERO_WIDTHS, heroSrc, heroSrcset, pickHeroUrl } from './src/lib/heroImage'
import { buildStaticSections, buildStructuredData } from './src/lib/staticContent'
import { translations } from './src/translations'

const SANITY_QUERY_URL = 'https://eu9o3lpb.apicdn.sanity.io/v2023-05-03/data/query/production'
const BUILD_QUERY = `{
  "hero": *[_type == "siteSettings"][0].heroImage.asset->url,
  "items": *[_type == "portfolioItem" && showOnHome == true]{
    title, location, "slug": slug.current, "imageUrl": image.asset->url
  },
  "bio": *[_type == "aboutPage"][0].bio[]{ style, "text": array::join(children[].text, "") }
}`

type CmsData = {
  hero: string | null
  items: Array<{ title: string; location: string | null; slug: string; imageUrl: string | null }>
  bio: Array<{ style: string; text: string }> | null
}

type HeroFile = { width: number; fileName: string; source: Uint8Array }

/**
 * Makes the built index.html complete on its own:
 *
 * 1. The hero photo is downloaded from the CMS at build time and served from
 *    our own domain, already referenced in the HTML (preload + <img>). A phone
 *    starts fetching it with the page itself — no waiting for the app to
 *    start, and no second connection to the image CDN.
 * 2. The stylesheet is inlined, removing the one render-blocking request.
 * 3. The page's facts and schema.org data are written as plain HTML for
 *    crawlers that do not run JavaScript (see src/lib/staticContent.ts).
 *
 * If the CMS cannot be reached, the build still succeeds: the hero is filled
 * in by the app at runtime and the static text falls back to built-in copy.
 */
function staticHtml(): Plugin {
  let cms: CmsData | null = null
  let heroUrl: string | null = null
  let heroFiles: HeroFile[] = []

  return {
    name: 'kuczewska-static-html',
    apply: 'build',

    async buildStart() {
      try {
        const response = await fetch(`${SANITY_QUERY_URL}?query=${encodeURIComponent(BUILD_QUERY)}`, {
          signal: AbortSignal.timeout(10_000),
        })
        cms = ((await response.json()) as { result: CmsData }).result
        heroUrl = pickHeroUrl(cms.hero, cms.items ?? [])
      } catch (error) {
        this.warn(`CMS not reachable, building without CMS content: ${error}`)
        return
      }

      if (!heroUrl || !heroUrl.startsWith('https://cdn.sanity.io/')) return
      // Content-addressed name: a new hero photo gets a new file name, so the
      // long cache lifetime on /assets/* can never serve a stale picture.
      const assetId = /\/([0-9a-f]{10})[0-9a-f]*-\d+x\d+\.\w+$/.exec(heroUrl)?.[1] ?? 'hero'
      try {
        heroFiles = await Promise.all(
          HERO_WIDTHS.map(async (width) => {
            const response = await fetch(`${heroUrl}?fm=webp&q=70&w=${width}`, {
              signal: AbortSignal.timeout(20_000),
            })
            if (!response.ok) throw new Error(`hero ${width}w: HTTP ${response.status}`)
            return {
              width,
              fileName: `assets/hero-${assetId}-${width}.webp`,
              source: new Uint8Array(await response.arrayBuffer()),
            }
          }),
        )
      } catch (error) {
        heroFiles = []
        this.warn(`Hero photo could not be downloaded, it will load from the CMS instead: ${error}`)
      }
    },

    generateBundle() {
      for (const file of heroFiles) {
        this.emitFile({ type: 'asset', fileName: file.fileName, source: file.source })
      }
    },

    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const tr = translations.pl

        let preload = ''
        let image = ''
        if (heroUrl) {
          const local = heroFiles.length > 0
          const srcset = local
            ? heroFiles.map((file) => `/${file.fileName} ${file.width}w`).join(', ')
            : heroSrcset(heroUrl)
          const src = local ? `/${heroFiles.find((file) => file.width === 960)!.fileName}` : heroSrc(heroUrl)
          preload = `<link rel="preload" as="image" fetchpriority="high" href="${src}" imagesrcset="${srcset}" imagesizes="100vw">`
          // data-source tells the app which CMS photo this is, so it leaves it in place.
          image = `<img id="hero-img" class="loaded" data-source="${heroUrl}" src="${src}" srcset="${srcset}" sizes="100vw" alt="Wnętrze sfotografowane przez Ankę Kuczewską" fetchpriority="high">`
        }

        const projects = (cms?.items ?? []).filter((item) => item.title && item.slug)
        const bio = (cms?.bio ?? [])
          .filter((block) => block.style === 'normal' && block.text?.trim())
          .map((block) => block.text.trim())

        let result = html
          .replace('<!--hero-preload-->', preload)
          .replace('<!--hero-img-->', image)
          .replace('<!--structured-data-->', buildStructuredData({ tr, imageUrl: heroUrl }))
          .replace('<!--static-content-->', buildStaticSections({ tr, projects, bio }))

        // Inline the page stylesheet (small) instead of a blocking request.
        for (const [key, chunk] of Object.entries(ctx.bundle ?? {})) {
          if (chunk.type !== 'asset' || !key.endsWith('.css')) continue
          const tag = new RegExp(`<link rel="stylesheet"[^>]*href="/${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`)
          if (!tag.test(result)) continue
          const css = String(chunk.source).replace(/<\/style/gi, '<\\/style')
          result = result.replace(tag, () => `<style>${css}</style>`)
          delete ctx.bundle![key]
        }

        return result
      },
    },
  }
}

export default defineConfig({
  plugins: [staticHtml()],
})
