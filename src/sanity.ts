import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: 'eu9o3lpb',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2023-05-03',
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

export async function getPortfolioItems() {
  try {
    const items = await client.fetch(`*[_type == "portfolioItem"]{
      title,
      location,
      "imageUrl": image.asset->url
    }`)
    return items
  } catch (err) {
    console.warn('Failed to fetch portfolio items:', err)
    return []
  }
}

export async function getAboutPage() {
  try {
    const about = await client.fetch(`*[_type == "aboutPage"][0]{
      bio,
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
      "logoImageUrl": logoImage.asset->url
    }`)
    return settings
  } catch (err) {
    console.warn('Failed to fetch site settings:', err)
    return null
  }
}
