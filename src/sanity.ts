/**
 * Read-only content queries against the Sanity HTTP API. Plain fetch on
 * purpose: the official client library is far larger than these four
 * queries need, and it was slowing down the first load on phones.
 */
const QUERY_URL = 'https://eu9o3lpb.apicdn.sanity.io/v2023-05-03/data/query/production'

async function query(groq: string, params: Record<string, unknown> = {}): Promise<any> {
  const url = new URL(QUERY_URL)
  url.searchParams.set('query', groq)
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(`$${name}`, JSON.stringify(value))
  }
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Sanity query failed: ${response.status}`)
  return (await response.json()).result
}

export async function getPortfolioItems() {
  try {
    const items = await query(`*[_type == "portfolioItem" && showOnHome == true]{
      title, title_en, title_es,
      location,
      "slug": slug.current,
      "imageUrl": image.asset->url,
      "count": count(gallery),
      "preview": gallery[0...4]{ "url": asset->url }
    }`)
    return items
  } catch (err) {
    console.warn('Failed to fetch portfolio items:', err)
    return []
  }
}

export async function getProjectBySlug(slug: string) {
  try {
    const project = await query(`*[_type == "portfolioItem" && slug.current == $slug][0]{
      title, title_en, title_es,
      location,
      description,
      "mainImageUrl": image.asset->url,
      "gallery": gallery[]{
        "url": asset->url,
        alt
      }
    }`, { slug })
    return project
  } catch (err) {
    console.warn(`Failed to fetch project with slug ${slug}:`, err)
    return null
  }
}

export async function getAboutPage() {
  try {
    const about = await query(`*[_type == "aboutPage"][0]{
      bio, bio_en, bio_es,
      "imageUrl": profileImage.asset->url,
      stats
    }`)
    return about
  } catch (err) {
    console.warn('Failed to fetch about page:', err)
    return null
  }
}

export async function getSiteSettings() {
  try {
    const settings = await query(`*[_type == "siteSettings"][0]{
      logoText,
      "logoImageUrl": logoImage.asset->url,
      heroTitle, heroTitle_en, heroTitle_es,
      heroSubtitle, heroSubtitle_en, heroSubtitle_es,
      "heroImageUrl": heroImage.asset->url
    }`)
    return settings
  } catch (err) {
    console.warn('Failed to fetch site settings:', err)
    return null
  }
}
