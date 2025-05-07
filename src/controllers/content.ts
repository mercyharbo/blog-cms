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
    title?: string
    slug?: string
    author?: string
    mainImage?: string
    categories?: string[]
    publishedAt?: string
    body?: any // For rich text content
    [key: string]: any
  }
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
      const { data, error } = await supabase
        .from('contents')
        .insert({
          ...req.body,
          type_id: typeId,
          user_id: req.user?.id, // Add user_id from authenticated user
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

      // First check if content exists
      const { data: existingContent } = await supabase
        .from('contents')
        .select('*')
        .eq('id', id)
        .eq('type_id', typeId)
        .single()

      if (!existingContent) {
        return res.status(404).json({
          message: 'Content not found',
        })
      }

      // Destructure fields from request body
      const {
        title,
        slug,
        content,
        featured_image,
        excerpt,
        status,
        published_at,
        tags,
        ...otherData
      } = req.body

      // Perform the update with spread operator to include all fields
      const { data, error } = await supabase
        .from('contents')
        .update({
          ...existingContent, // Keep existing data
          ...req.body, // Override with new data
          type_id: typeId, // Ensure type_id stays the same
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      }

      res.status(200).json({
        message: 'Content updated successfully',
        content: data,
      })
    } catch (error: any) {
      console.error('Error updating content:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
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
