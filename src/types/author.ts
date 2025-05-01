export interface Author {
  id: string
  name: string
  slug: string
  image_url?: string
  bio?: string
  post_count: number
  social_links: {
    instagram?: string
    twitter?: string
    linkedin?: string
  }
  created_at: Date
  updated_at: Date
}
