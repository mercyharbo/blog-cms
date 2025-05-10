export interface Content {
  id?: string
  type_id: string
  user_id: string
  status: 'draft' | 'published' | 'scheduled'
  scheduled_at?: string
  published_at?: string
  title: string
  slug: string
  description: string
  created_at?: string
  updated_at?: string
}

export interface ContentCreateInput {
  title: string
  slug: string
  description: string
}
