import { Request, Response } from 'express'
import { supabase } from '../config/supabase'

interface ContentTypeField {
  name: string
  type:
    | 'string'
    | 'text'
    | 'richText'
    | 'image'
    | 'reference'
    | 'array'
    | 'datetime'
    | 'slug'
  title: string
  required?: boolean
  options?: {
    source?: string
    maxLength?: number
    hotspot?: boolean
    referenceType?: string
  }
}

interface ContentType {
  id?: string
  name: string
  title: string
  fields: ContentTypeField[]
}

interface Content {
  id?: string
  type_id: string
  data: {
    title: string
    slug: string
    author: string
    content: string
    cover_image: {
      url: string
      alt: string
      caption?: string
    }
    featured_image?: string
    excerpt: string
    status: 'draft' | 'published' | 'archived'
    published_at?: string
    tags: string[]
    meta_description: string
    meta_title?: string
    meta_keywords?: string[]
    reading_time?: number
    category?: string
    last_modified?: string
    is_featured?: boolean
    related_posts?: string[]
    social_image?: {
      url: string
      alt: string
    }
    canonical_url?: string
    language?: string
    translations?: {
      [key: string]: string // language code -> content ID mapping
    }
    [key: string]: any
  }
  user_id?: string
  created_at?: string
  updated_at?: string
}

// Utility functions for content processing
const autoGenerateMetadata = (content: any) => {
  // Generate meta title if not provided
  if (!content.meta_title && content.title) {
    content.meta_title = content.title
  }

  // Generate meta description from excerpt if not provided
  if (!content.meta_description && content.excerpt) {
    content.meta_description =
      content.excerpt.length > 160
        ? `${content.excerpt.substring(0, 157)}...`
        : content.excerpt
  }

  // Generate keywords from title, excerpt, and tags
  if (!content.meta_keywords && content.tags) {
    const keywordSources = [
      content.title,
      content.excerpt,
      ...(content.tags || []),
    ].filter(Boolean)

    const keywords = new Set(
      keywordSources
        .join(' ')
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((word) => word.length > 2)
    )
    content.meta_keywords = Array.from(keywords)
  }

  // Calculate reading time if not provided
  if (!content.reading_time && content.content) {
    const wordsPerMinute = 200
    const wordCount = content.content.trim().split(/\s+/).length
    content.reading_time = Math.ceil(wordCount / wordsPerMinute)
  }

  // Use cover image for social image if not provided
  if (!content.social_image && content.cover_image) {
    content.social_image = {
      url: content.cover_image.url,
      alt: content.cover_image.alt || content.title,
    }
  }

  // Set last_modified
  content.last_modified = new Date().toISOString()

  return content
}

export const contentController = {
  // Content Type Methods
  createContentType: async (req: Request, res: Response) => {
    try {
      console.log('Received request body:', req.body)

      const contentType: ContentType = req.body

      // Validate required fields
      if (!contentType.name || !contentType.title || !contentType.fields) {
        return res.status(400).json({
          message:
            'Missing required fields: name, title, and fields are required',
        })
      }

      // Validate fields array
      if (!Array.isArray(contentType.fields)) {
        return res.status(400).json({
          message: 'Fields must be an array',
        })
      }

      const { data, error } = await supabase
        .from('content_types')
        .insert({
          name: contentType.name,
          title: contentType.title,
          fields: contentType.fields,
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      }

      res.status(201).json({
        message: 'Content type created successfully',
        contentType: data,
      })
    } catch (error: any) {
      console.error('Error creating content type:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  getContentTypes: async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase.from('content_types').select('*')

      if (error) throw error

      res.status(200).json({
        contentTypes: data,
      })
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      })
    }
  },

  getContentType: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { data, error } = await supabase
        .from('content_types')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      res.status(200).json({
        contentType: data,
      })
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      })
    }
  },

  updateContentType: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const contentType: ContentType = req.body
      const { data, error } = await supabase
        .from('content_types')
        .update(contentType)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      res.status(200).json({
        message: 'Content type updated successfully',
        contentType: data,
      })
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      })
    }
  },

  deleteContentType: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { error } = await supabase
        .from('content_types')
        .delete()
        .eq('id', id)

      if (error) throw error

      res.status(200).json({
        message: 'Content type deleted successfully',
      })
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      })
    }
  },

  // Content Methods
  createContent: async (req: Request, res: Response) => {
    const { typeId } = req.params
    try {
      // Auto-generate metadata before saving
      const contentData = autoGenerateMetadata(req.body)

      const { data, error } = await supabase
        .from('contents')
        .insert({
          type_id: typeId,
          data: contentData,
          user_id: (req as any).user?.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      }

      res.status(201).json({
        message: 'Content created successfully',
        content: data,
      })
    } catch (error: any) {
      console.error('Error creating content:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  getContents: async (req: Request, res: Response) => {
    try {
      const { typeId } = req.params
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('type_id', typeId)

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      }

      res.status(200).json({
        contents: data,
      })
    } catch (error: any) {
      console.error('Error getting contents:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  getContent: async (req: Request, res: Response) => {
    try {
      const { typeId, id } = req.params
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('type_id', typeId)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      }

      res.status(200).json({
        content: data,
      })
    } catch (error: any) {
      console.error('Error getting content:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  updateContent: async (req: Request, res: Response) => {
    try {
      const { typeId, id } = req.params

      // Auto-generate metadata before updating
      const contentData = autoGenerateMetadata(req.body)

      // First check if the content exists
      const { data: existingContent, error: fetchError } = await supabase
        .from('contents')
        .select('*')
        .eq('type_id', typeId)
        .eq('id', id)

      if (fetchError || !existingContent || existingContent.length === 0) {
        return res.status(404).json({
          message: 'Content not found',
          details:
            fetchError?.message ||
            'No content found with the specified ID and type',
        })
      }

      // Merge existing data with updates to preserve any fields not included in the update
      const mergedData = {
        ...existingContent[0].data,
        ...contentData,
      }

      // Update the content
      const { data, error } = await supabase
        .from('contents')
        .update({
          data: mergedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('type_id', typeId)
        .select()

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      }

      if (!data || data.length === 0) {
        return res.status(404).json({
          message: 'Content was not updated',
          details: 'No content was affected by the update operation',
        })
      }

      res.status(200).json({
        message: 'Content updated successfully',
        content: data[0],
      })
    } catch (error: any) {
      console.error('Error updating content:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  // Debug method to verify content
  verifyContent: async (req: Request, res: Response) => {
    const { typeId, id } = req.params

    try {
      // Do a raw select to see exactly what's in the database
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('type_id', typeId)
        .eq('id', id)

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
          query: { typeId: typeId, id: id },
        })
      }

      res.status(200).json({
        exists: data && data.length > 0,
        content: data,
        query: { typeId: typeId, id: id },
      })
    } catch (error: any) {
      console.error('Error verifying content:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
        query: { typeId: typeId, id: id },
      })
    }
  },

  deleteContent: async (req: Request, res: Response) => {
    try {
      const { typeId, id } = req.params
      const { error } = await supabase
        .from('contents')
        .delete()
        .eq('id', id)
        .eq('type_id', typeId)

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      }

      res.status(200).json({
        message: 'Content deleted successfully',
      })
    } catch (error: any) {
      console.error('Error deleting content:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },
}

export const getContentTypes = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('content_types').select('*')

    if (error) {
      console.error('Error fetching content types:', error)
      return res.status(500).json({ error: error.message })
    }

    console.log('Retrieved content types:', data) // Add this for debugging
    return res.json(data)
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
