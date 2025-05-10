import { Request, Response } from 'express'
import { getSupabaseClient } from '../config/supabase'

interface ContentType {
  id?: string
  title: string
  slug: string
  description: string
}

interface Content {
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

export const contentController = {
  // Content Type Methods
  createContentType: async (req: Request, res: Response) => {
    try {
      console.log('Received request body:', req.body)

      const simpleContentType = req.body as ContentType
      const authHeader = req.headers.authorization
      const userId = (req as any).user?.id

      if (!userId || !authHeader) {
        return res.status(401).json({
          message: 'User not authenticated',
        })
      }

      // Validate required fields
      if (
        !simpleContentType.title ||
        !simpleContentType.slug ||
        !simpleContentType.description
      ) {
        return res.status(400).json({
          message:
            'Missing required fields: title, slug, and description are required',
        })
      } // Transform the simple payload into the required database format
      const contentTypeData = {
        title: simpleContentType.title,
        name: simpleContentType.slug,
        description: simpleContentType.description,
        user_id: userId,
        fields: [
          {
            name: 'title',
            type: 'string',
            title: 'Title',
            required: true,
          },
          {
            name: 'slug',
            type: 'string',
            title: 'Slug',
            required: true,
          },
          {
            name: 'description',
            type: 'text',
            title: 'Description',
            required: false,
          },
          {
            name: 'created_at',
            type: 'datetime',
            title: 'Created At',
            required: true,
          },
          {
            name: 'updated_at',
            type: 'datetime',
            title: 'Updated At',
            required: true,
          },
        ],
      }

      const client = getSupabaseClient(authHeader)
      const { data, error } = await client
        .from('content_types')
        .insert(contentTypeData)
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
      console.error('Error fetching content types:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
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

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      }

      if (!data) {
        return res.status(404).json({
          message: 'Content type not found',
        })
      }

      res.status(200).json({
        contentType: data,
      })
    } catch (error: any) {
      console.error('Error fetching content type:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  updateContentType: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const simpleContentType = req.body as ContentType
      const authHeader = req.headers.authorization
      const userId = (req as any).user?.id

      if (!userId || !authHeader) {
        return res.status(401).json({
          message: 'User not authenticated',
        })
      }

      // Validate required fields
      if (
        !simpleContentType.title ||
        !simpleContentType.slug ||
        !simpleContentType.description
      ) {
        return res.status(400).json({
          message: 'Missing required fields',
        })
      }

      const client = getSupabaseClient(authHeader)
      const { data, error } = await client
        .from('content_types')
        .update({
          title: simpleContentType.title,
          name: simpleContentType.slug,
          description: simpleContentType.description,
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
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
          message: 'Content type not found',
        })
      }

      res.status(200).json({
        message: 'Content type updated successfully',
        contentType: data,
      })
    } catch (error: any) {
      console.error('Error updating content type:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
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
      const { error } = await client
        .from('content_types')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      }

      res.status(200).json({
        message: 'Content type deleted successfully',
      })
    } catch (error: any) {
      console.error('Error deleting content type:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  // Content Methods
  createContent: async (req: Request, res: Response) => {
    try {
      const typeId = req.params.id
      const content = req.body
      const authHeader = req.headers.authorization
      const userId = (req as any).user?.id

      if (!userId || !authHeader) {
        return res.status(401).json({
          message: 'User not authenticated',
        })
      }

      const client = getSupabaseClient(authHeader)

      // First verify the content type exists and belongs to the user
      const { data: contentType, error: contentTypeError } = await client
        .from('content_types')
        .select('*')
        .eq('id', typeId)
        .eq('user_id', userId)
        .single()

      if (contentTypeError || !contentType) {
        return res.status(404).json({
          message: 'Content type not found',
        })
      }

      // Create the content with nested data structure
      const { data, error } = await client
        .from('contents')
        .insert({
          type_id: typeId,
          user_id: userId,
          status: 'draft',
          data: {
            title: content.title,
            slug: content.slug,
            description: content.description,
          },
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

      // Transform the response to merge the nested data
      const transformedContent = {
        ...data,
        ...data.data,
      }

      res.status(201).json({
        message: 'Content created successfully',
        content: transformedContent,
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
      const typeId = req.query.typeId as string
      const authHeader = req.headers.authorization
      const userId = (req as any).user?.id

      if (!userId || !authHeader) {
        return res.status(401).json({
          message: 'User not authenticated',
        })
      }

      const client = getSupabaseClient(authHeader)
      let query = client
        .from('contents')
        .select(
          'id, type_id, user_id, status, scheduled_at, published_at, data, created_at, updated_at'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (typeId) {
        query = query.eq('type_id', typeId)
      }

      const { data: contents, error } = await query

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      }

      // Transform the response to merge the nested data
      const transformedContents = contents.map((content) => ({
        ...content,
        ...content.data,
      }))

      res.status(200).json({
        contents: transformedContents,
      })
    } catch (error: any) {
      console.error('Error fetching contents:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  getContent: async (req: Request, res: Response) => {
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
        .from('contents')
        .select(
          'id, type_id, user_id, status, scheduled_at, published_at, data, created_at, updated_at, content_type:content_types(*)'
        )
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

      if (!data) {
        return res.status(404).json({
          message: 'Content not found',
        })
      }

      // Transform the response to merge the nested data
      const transformedContent = {
        ...data,
        ...data.data,
      }

      res.status(200).json({
        content: transformedContent,
      })
    } catch (error: any) {
      console.error('Error fetching content:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  updateContent: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const content = req.body
      const authHeader = req.headers.authorization
      const userId = (req as any).user?.id

      if (!userId || !authHeader) {
        return res.status(401).json({
          message: 'User not authenticated',
        })
      }

      const client = getSupabaseClient(authHeader)
      const { data, error } = await client
        .from('contents')
        .update({
          data: {
            title: content.title,
            slug: content.slug,
            description: content.description,
          },
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
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

      // Transform the response to merge the nested data
      const transformedContent = {
        ...data,
        ...data.data,
      }

      res.status(200).json({
        message: 'Content updated successfully',
        content: transformedContent,
      })
    } catch (error: any) {
      console.error('Error updating content:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  verifyContent: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const status = req.body.status as 'draft' | 'published' | 'scheduled'
      const scheduled_at = req.body.scheduled_at as string | undefined
      const authHeader = req.headers.authorization
      const userId = (req as any).user?.id

      if (!userId || !authHeader) {
        return res.status(401).json({
          message: 'User not authenticated',
        })
      }

      if (!['draft', 'published', 'scheduled'].includes(status)) {
        return res.status(400).json({
          message: 'Invalid status. Must be draft, published, or scheduled',
        })
      }

      if (status === 'scheduled' && !scheduled_at) {
        return res.status(400).json({
          message: 'scheduled_at is required for scheduled status',
        })
      }

      const client = getSupabaseClient(authHeader)
      const updateData: any = {
        status,
        scheduled_at: null,
        published_at: null,
      }

      if (status === 'scheduled') {
        updateData.scheduled_at = scheduled_at
      } else if (status === 'published') {
        updateData.published_at = new Date().toISOString()
      }

      const { data, error } = await client
        .from('contents')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
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

      res.status(200).json({
        message: `Content ${status} successfully`,
        content: data,
      })
    } catch (error: any) {
      console.error('Error verifying content:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  deleteContent: async (req: Request, res: Response) => {
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
      const { error } = await client
        .from('contents')
        .delete()
        .eq('id', id)
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

  // Public Methods
  getAllContentTypes: async (req: Request, res: Response) => {
    try {
      const client = getSupabaseClient(process.env.SUPABASE_SERVICE_KEY || '')
      const { data, error } = await client.from('content_types').select('*')

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
      console.error('Error fetching all content types:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  getPublishedContents: async (req: Request, res: Response) => {
    try {
      const { type_id } = req.params
      const authHeader = req.headers.authorization

      if (!authHeader) {
        return res.status(401).json({
          message: 'API key required',
        })
      }

      const client = getSupabaseClient(authHeader)
      const { data: contents, error } = await client
        .from('contents')
        .select(
          'id, type_id, user_id, status, scheduled_at, published_at, data, created_at, updated_at, content_type:content_types(*)'
        )
        .eq('type_id', type_id)
        .eq('status', 'published')

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      }

      // Transform the response to merge the nested data
      const transformedContents = contents.map((content) => ({
        ...content,
        ...content.data,
      }))

      res.status(200).json({
        contents: transformedContents,
      })
    } catch (error: any) {
      console.error('Error fetching published contents:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  getPublishedContent: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const authHeader = req.headers.authorization

      if (!authHeader) {
        return res.status(401).json({
          message: 'API key required',
        })
      }

      const client = getSupabaseClient(authHeader)
      const { data, error } = await client
        .from('contents')
        .select(
          'id, type_id, user_id, status, scheduled_at, published_at, data, created_at, updated_at, content_type:content_types(*)'
        )
        .eq('id', id)
        .eq('status', 'published')
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
          message: 'Published content not found',
        })
      }

      // Transform the response to merge the nested data
      const transformedContent = {
        ...data,
        ...data.data,
      }

      res.status(200).json({
        content: transformedContent,
      })
    } catch (error: any) {
      console.error('Error fetching published content:', error)
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  getAllUserContents: async (req: Request, res: Response) => {
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
        .from('contents')
        .select(
          `
          *,
          content_type:content_types(*)
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

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
      console.error('Error fetching all contents:', error)
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
