import { Request, Response } from 'express'
import { getSupabaseClient } from '../config/supabase'

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
  status: 'draft' | 'published' | 'scheduled'
  scheduled_at?: string
  published_at?: string
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
      const authHeader = req.headers.authorization
      const userId = (req as any).user?.id

      if (!userId || !authHeader) {
        return res.status(401).json({
          message: 'User not authenticated',
        })
      }

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

      const client = getSupabaseClient(authHeader)
      const { data, error } = await client
        .from('content_types')
        .insert({
          name: contentType.name,
          title: contentType.title,
          fields: contentType.fields,
          user_id: userId,
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
      const authHeader = req.headers.authorization
      const userId = (req as any).user?.id

      if (!userId || !authHeader) {
        return res.status(401).json({
          message: 'User not authenticated',
        })
      }

      const client = getSupabaseClient(authHeader)

      // First get all public content types and user's own content types
      const { data, error } = await client
        .from('content_types')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order('created_at', { ascending: false })

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
      const authHeader = req.headers.authorization
      const userId = (req as any).user?.id

      if (!userId || !authHeader) {
        return res.status(401).json({
          message: 'User not authenticated',
        })
      }

      const client = getSupabaseClient(authHeader)
      const { data, error } = await client
        .from('content_types')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (error) throw error

      if (!data) {
        return res.status(404).json({
          message: 'Content type not found or unauthorized',
        })
      }

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
      const authHeader = req.headers.authorization
      const userId = (req as any).user?.id

      if (!userId || !authHeader) {
        return res.status(401).json({
          message: 'User not authenticated',
        })
      }

      const client = getSupabaseClient(authHeader)
      const { data, error } = await client
        .from('content_types')
        .update(contentType)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      if (!data) {
        return res.status(404).json({
          message: 'Content type not found or unauthorized',
        })
      }

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
      const authHeader = req.headers.authorization
      const userId = (req as any).user?.id

      if (!userId || !authHeader) {
        return res.status(401).json({
          message: 'User not authenticated',
        })
      }

      const client = getSupabaseClient(authHeader)

      // First check if the content type exists and belongs to the user
      const { data: existingType, error: fetchError } = await client
        .from('content_types')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (fetchError || !existingType) {
        return res.status(404).json({
          message: 'Content type not found or unauthorized',
        })
      }

      const { error } = await client
        .from('content_types')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

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
    const userId = (req as any).user?.id
    const authHeader = req.headers.authorization

    if (!userId || !authHeader) {
      return res.status(401).json({
        message: 'User not authenticated',
      })
    }
    try {
      const client = getSupabaseClient(authHeader)
      const { status, scheduled_at, ...contentData } = req.body
      const now = new Date().toISOString()

      // Extract data from contentData if it exists to prevent double nesting
      const finalData = contentData.data || contentData

      const { data, error } = await client
        .from('contents')
        .insert({
          type_id: typeId,
          data: finalData,
          user_id: userId,
          status: status || 'draft',
          scheduled_at: status === 'scheduled' ? scheduled_at : null,
          published_at: status === 'published' ? now : null,
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
      const userId = (req as any).user?.id
      const authHeader = req.headers.authorization

      if (!userId || !authHeader) {
        return res.status(401).json({
          message: 'User not authenticated',
        })
      }

      const client = getSupabaseClient(authHeader)

      // Always fetch user's own contents with their content type information
      let query = client
        .from('contents')
        .select(
          `
          *,
          content_types (
            name,
            title,
            fields
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // If a specific typeId is provided (not 'all'), filter by that type
      if (typeId && typeId !== 'all') {
        query = query.eq('type_id', typeId)
      }
      const { data: rawContents, error } = await query

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      } // Ensure data is not double-nested and transform to consistent structure
      const contents = rawContents?.map((content) => {
        // If data is already nested properly, return as is
        if (content.data && !content.data.data) {
          return content
        }
        // If data is double nested, flatten it
        if (content.data && content.data.data) {
          return {
            ...content,
            data: content.data.data,
          }
        }
        // If data is spread at root level, nest it properly
        const {
          id,
          type_id,
          user_id,
          status,
          scheduled_at,
          published_at,
          created_at,
          updated_at,
          content_types,
          ...dataFields
        } = content
        return {
          id,
          type_id,
          user_id,
          status,
          scheduled_at,
          published_at,
          created_at,
          updated_at,
          content_types,
          data: dataFields,
        }
      })

      res.status(200).json({
        contents,
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
      const userId = (req as any).user?.id
      const authHeader = req.headers.authorization

      if (!userId || !authHeader) {
        return res.status(401).json({
          message: 'User not authenticated',
        })
      }

      const client = getSupabaseClient(authHeader)
      const { data: rawContent, error } = await client
        .from('contents')
        .select(
          `
          *,
          content_types (
            name,
            title,
            fields
          )
        `
        )
        .eq('type_id', typeId)
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      }

      if (!rawContent) {
        return res.status(404).json({
          message: 'Content not found or unauthorized',
        })
      }

      // Transform the data to maintain consistent structure
      let content = rawContent

      // If data is already nested properly, keep as is
      if (content.data && !content.data.data) {
        // Keep as is
      }
      // If data is double nested, flatten it
      else if (content.data && content.data.data) {
        content = {
          ...content,
          data: content.data.data,
        }
      }
      // If data is spread at root level, nest it properly
      else {
        const {
          id,
          type_id,
          user_id,
          status,
          scheduled_at,
          published_at,
          created_at,
          updated_at,
          content_types,
          ...dataFields
        } = content
        content = {
          id,
          type_id,
          user_id,
          status,
          scheduled_at,
          published_at,
          created_at,
          updated_at,
          content_types,
          data: dataFields,
        }
      }

      res.status(200).json({
        content,
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
      const contentData = req.body
      const userId = (req as any).user?.id
      const authHeader = req.headers.authorization

      if (!userId || !authHeader) {
        return res.status(401).json({
          message: 'User not authenticated',
        })
      }

      const client = getSupabaseClient(authHeader)

      // First check if the content exists and belongs to the user
      const { data: existingContent, error: fetchError } = await client
        .from('contents')
        .select('*')
        .eq('type_id', typeId)
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (fetchError || !existingContent) {
        return res.status(404).json({
          message: 'Content not found or unauthorized',
          details:
            fetchError?.message ||
            'No content found with the specified ID and type',
        })
      } // Extract data from contentData if it exists to prevent double nesting
      const finalData = contentData.data || contentData

      // Update the content with new data
      const { data, error } = await client
        .from('contents')
        .update({
          data: finalData,
          status: contentData.status || existingContent.status,
          scheduled_at:
            contentData.status === 'scheduled'
              ? contentData.scheduled_at
              : null,
          published_at:
            contentData.status === 'published'
              ? new Date().toISOString()
              : existingContent.published_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('type_id', typeId)
        .eq('user_id', userId)
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
    const userId = (req as any).user?.id
    const authHeader = req.headers.authorization

    if (!userId || !authHeader) {
      return res.status(401).json({
        message: 'User not authenticated',
      })
    }

    try {
      const client = getSupabaseClient(authHeader)
      const { data, error } = await client
        .from('contents')
        .select('*')
        .eq('type_id', typeId)
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
          query: { typeId, id },
        })
      }

      res.status(200).json({
        exists: data && data.length > 0,
        content: data,
        query: { typeId, id },
      })
    } catch (error: any) {
      console.error('Error verifying content:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
        query: { typeId, id },
      })
    }
  },

  deleteContent: async (req: Request, res: Response) => {
    try {
      const { typeId, id } = req.params
      const userId = (req as any).user?.id
      const authHeader = req.headers.authorization

      if (!userId || !authHeader) {
        return res.status(401).json({
          message: 'User not authenticated',
        })
      }

      const client = getSupabaseClient(authHeader)

      // First check if the content exists and belongs to the user
      const { data: existingContent, error: fetchError } = await client
        .from('contents')
        .select('*')
        .eq('type_id', typeId)
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (fetchError || !existingContent) {
        return res.status(404).json({
          message: 'Content not found or unauthorized',
          details:
            fetchError?.message ||
            'No content found with the specified ID and type',
        })
      }

      const { error } = await client
        .from('contents')
        .delete()
        .eq('id', id)
        .eq('type_id', typeId)
        .eq('user_id', userId)

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

  // Public methods for blog posts
  getPublishedContents: async (req: Request, res: Response) => {
    try {
      const client = getSupabaseClient()
      const now = new Date().toISOString()

      const { data, error } = await client
        .from('contents')
        .select(
          `
          *,
          content_types (
            name,
            title,
            fields
          )
        `
        )
        .or(
          `status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${now})`
        )
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      }

      // Update any scheduled posts that are now published
      const scheduledPosts = data?.filter(
        (post) => post.status === 'scheduled' && post.scheduled_at <= now
      )

      if (scheduledPosts?.length > 0) {
        const updates = scheduledPosts.map((post) => ({
          id: post.id,
          status: 'published',
          published_at: now,
        }))

        const { error: updateError } = await client
          .from('contents')
          .upsert(updates)

        if (updateError) {
          console.error('Error updating scheduled posts:', updateError)
        }
      }

      res.status(200).json({
        contents: data,
      })
    } catch (error: any) {
      console.error('Error getting published contents:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  getPublishedContent: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const client = getSupabaseClient()
      const now = new Date().toISOString()

      const { data, error } = await client
        .from('contents')
        .select(
          `
          *,
          content_types (
            name,
            title,
            fields
          )
        `
        )
        .or(
          `status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${now})`
        )
        .eq('id', id)
        .single()

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      }

      if (!data) {
        return res.status(404).json({
          message: 'Content not found',
        })
      }

      // Update status if it was scheduled and is now published
      if (data.status === 'scheduled' && data.scheduled_at <= now) {
        const { error: updateError } = await client
          .from('contents')
          .update({
            status: 'published',
            published_at: now,
          })
          .eq('id', id)

        if (updateError) {
          console.error('Error updating scheduled post:', updateError)
        }
      }

      res.status(200).json({
        content: data,
      })
    } catch (error: any) {
      console.error('Error getting published content:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },
}

export const getContentTypes = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    const userId = (req as any).user?.id

    if (!userId || !authHeader) {
      return res.status(401).json({
        message: 'User not authenticated',
      })
    }

    const client = getSupabaseClient(authHeader)
    const { data, error } = await client
      .from('content_types')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Supabase error:', error)
      return res.status(400).json({
        message: error.message,
        details: error.details,
      })
    }

    res.status(200).json({
      contentTypes: data,
    })
  } catch (error: any) {
    console.error('Error getting content types:', error)
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    })
  }
}
