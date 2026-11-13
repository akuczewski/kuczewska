import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: 'eu9o3lpb',
  dataset: 'production',
  useCdn: false, // Set to false to see changes immediately
  apiVersion: '2023-05-03',
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

export async function getPortfolioItems() {
  try {
    const items = await client.fetch(`*[_type == "portfolioItem" && showOnHome == true]{
      title,
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
    const project = await client.fetch(`*[_type == "portfolioItem" && slug.current == $slug][0]{
      title,
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
    const about = await client.fetch(`*[_type == "aboutPage"][0]{
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
    const settings = await client.fetch(`*[_type == "siteSettings"][0]{
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
