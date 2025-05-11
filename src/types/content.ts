export interface ContentType {
  id?: string
  title: string
  slug: string
  description: string
  fields: ContentTypeField[]
  user_id: string
  created_at?: string
  updated_at?: string
}

export interface ContentTypeField {
  name: string
  type: string
  title: string
  required?: boolean
  options?: any
}

export interface CoverImage {
  alt: string
  url: string
}

export interface ContentData {
  title: string
  slug: string
  content: string
  author: string
  cover_image: CoverImage
  reading_time: number
  tags: string[]
  meta_title?: string
  meta_keywords?: string[]
}

export interface Content {
  id?: string
  type_id: string
  user_id: string
  status: 'draft' | 'published' | 'scheduled'
  scheduled_at?: string
  published_at?: string
  data: ContentData
  created_at?: string
  updated_at?: string
}

export interface ContentCreateInput {
  title: string
  slug: string
  content: string
  author: string
  cover_image: CoverImage
  reading_time: number
  tags: string[]
  meta_title?: string
  meta_keywords?: string[]
}

export interface ContentUpdateInput extends Partial<ContentCreateInput> {
  // All fields are optional for updates
}
