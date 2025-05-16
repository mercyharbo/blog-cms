import { Request, Response } from 'express'
import { getSupabaseClient } from '../config/supabase'
import type { ContentCreateInput, ContentType } from '../types/content'

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

      const client = getSupabaseClient(authHeader)

      // Fetch user profile to check role
      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      if (profileError || !profile) {
        return res.status(403).json({
          message: 'Unable to verify user role',
          error: profileError?.message || 'No profile found',
        })
      }

      // Deny access if not admin
      if (profile.role !== 'admin') {
        return res.status(403).json({
          message: 'Access denied: Admins only',
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
      }

      const contentTypeData = {
        title: simpleContentType.title,
        name: simpleContentType.slug,
        description: simpleContentType.description,
        user_id: userId,
        fields: [
          { name: 'title', type: 'string', title: 'Title', required: true },
          { name: 'slug', type: 'string', title: 'Slug', required: true },
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

      const { data, error } = await client
        .from('content_types')
        .insert(contentTypeData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          status: false,
          message: error.message,
          details: error.details,
          contentType: null,
        })
      }

      res.status(201).json({
        status: true,
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

      // Fetch all content types (no user_id filter)
      const { data, error } = await client.from('content_types').select('*')

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          status: false,
          message: error.message,
          details: error.details,
          contentTypes: null,
        })
      }

      res.status(200).json({
        status: true,
        message: 'Content types retrieved successfully',
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
          status: false,
          message: 'Content type not found',
          contentType: null,
        })
      }

      res.status(200).json({
        status: true,
        message: 'Content type retrieved successfully',
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

      const client = getSupabaseClient(authHeader)

      // Fetch user role
      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      if (profileError || !profile) {
        return res.status(403).json({
          message: 'Unable to verify user role',
          error: profileError?.message || 'No profile found',
        })
      }

      if (profile.role !== 'admin') {
        return res.status(403).json({
          message: 'Access denied: Only admins can update content types',
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

      const { data, error } = await client
        .from('content_types')
        .update({
          title: simpleContentType.title,
          name: simpleContentType.slug,
          description: simpleContentType.description,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          status: false,
          message: error.message,
          details: error.details,
          contentType: null,
        })
      }

      if (!data) {
        return res.status(404).json({
          status: false,
          message: 'Content type not found',
          contentType: null,
        })
      }

      res.status(200).json({
        status: true,
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
          status: false,
          message: 'User not authenticated',
        })
      }

      const client = getSupabaseClient(authHeader)

      // Check user role
      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      if (profileError || !profile) {
        return res.status(403).json({
          message: 'Unable to verify user role',
          error: profileError?.message || 'No profile found',
        })
      }

      if (profile.role !== 'admin') {
        return res.status(403).json({
          message: 'Access denied: Only admins can delete content types',
        })
      }

      // Proceed with deletion
      const { error } = await client.from('content_types').delete().eq('id', id)

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          status: false,
          message: error.message,
          details: error.details,
        })
      }

      res.status(200).json({
        status: true,
        message: 'Content type deleted successfully',
      })
    } catch (error: any) {
      console.error('Error deleting content type:', error)
      res.status(500).json({
        status: false,
        message: 'Internal server error',
        error: error.message,
      })
    }
  },

  // Content Methods
  createContent: async (req: Request, res: Response) => {
    try {
      const typeId = req.params.id
      const contentInput = req.body as ContentCreateInput
      const authHeader = req.headers.authorization
      const userId = (req as any).user?.id

      if (!userId || !authHeader) {
        return res.status(401).json({
          status: false,
          message: 'User not authenticated',
          content: null,
        })
      }

      const client = getSupabaseClient(authHeader)

      // Validate required fields
      const missingFields = []
      if (!contentInput.title) missingFields.push('title')
      if (!contentInput.slug) missingFields.push('slug')
      if (!contentInput.content) missingFields.push('content')
      if (!contentInput.author) missingFields.push('author')
      if (!contentInput.reading_time) missingFields.push('reading_time')
      if (!contentInput.tags || !contentInput.tags.length)
        missingFields.push('tags')

      if (missingFields.length > 0) {
        return res.status(400).json({
          status: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
          content: null,
        })
      }

      // Validate cover_image structure
      if (
        !contentInput.cover_image ||
        !contentInput.cover_image.url ||
        !contentInput.cover_image.alt
      ) {
        return res.status(400).json({
          status: false,
          message: 'Cover image must include both url and alt text',
          content: null,
        })
      }

      // Verify content type exists and belongs to the user
      const { data: contentType, error: contentTypeError } = await client
        .from('content_types')
        .select('*')
        .eq('id', typeId)
        .eq('user_id', userId)
        .single()

      if (contentTypeError || !contentType) {
        return res.status(404).json({
          status: false,
          message: 'Content type not found',
          content: null,
        })
      }

      // Structure the content data properly
      const contentData = {
        title: contentInput.title,
        slug: contentInput.slug,
        content: contentInput.content,
        author: contentInput.author,
        cover_image: contentInput.cover_image,
        reading_time: contentInput.reading_time,
        tags: contentInput.tags,
        meta_title: contentInput.meta_title,
        meta_keywords: contentInput.meta_keywords,
      }

      // Create the content with proper data structure
      const { data, error } = await client
        .from('contents')
        .insert({
          type_id: typeId,
          user_id: userId,
          status: 'draft',
          data: contentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          status: false,
          message: error.message,
          content: null,
        })
      }

      // Transform the response to include flattened data
      const transformedContent = {
        ...data,
        ...data.data,
      }

      res.status(201).json({
        status: true,
        message: 'Content created successfully',
        content: transformedContent,
      })
    } catch (error: any) {
      console.error('Error creating content:', error)
      res.status(500).json({
        status: false,
        message: 'Internal server error',
        content: null,
      })
    }
  },
  getContents: async (req: Request, res: Response) => {
    try {
      const typeId = req.params.id || (req.query.typeId as string) // Get ID from either params or query
      const authHeader = req.headers.authorization
      const userId = (req as any).user?.id

      if (!userId || !authHeader) {
        return res.status(401).json({
          status: false,
          message: 'User not authenticated',
          contents: null,
        })
      }

      console.log('Fetching contents with type ID:', typeId)
      console.log('User ID:', userId)

      const client = getSupabaseClient(authHeader)
      let query = client
        .from('contents')
        .select(
          'id, type_id, user_id, status, scheduled_at, published_at, data, created_at, updated_at, profile:profiles(is_anonymous,username)'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (typeId) {
        console.log('Filtering by content type ID:', typeId)
        query = query.eq('type_id', typeId)
      }

      const { data: contents, error } = await query

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          status: false,
          message: error.message,
          contents: null,
        })
      }

      // Set author as 'Anonymous' if is_anonymous is true, else use username
      const transformedContents = (contents || []).map((content) => {
        const profile = Array.isArray(content.profile)
          ? content.profile[0]
          : content.profile
        let author = content.data?.author
        if (profile?.is_anonymous) {
          author = 'Anonymous'
        } else if (profile?.username) {
          author = profile.username
        }
        // Only include the fields you want at the root, and do NOT include the nested data object
        // Do NOT spread ...content.data, instead pick the fields you want
        return {
          id: content.id,
          type_id: content.type_id,
          user_id: content.user_id,
          status: content.status,
          scheduled_at: content.scheduled_at,
          published_at: content.published_at,
          created_at: content.created_at,
          updated_at: content.updated_at,
          title: content.data?.title,
          slug: content.data?.slug,
          content: content.data?.content,
          cover_image: content.data?.cover_image,
          reading_time: content.data?.reading_time,
          tags: content.data?.tags,
          meta_title: content.data?.meta_title,
          meta_keywords: content.data?.meta_keywords,
          author,
        }
      })

      res.status(200).json({
        status: true,
        message: 'Contents fetched successfully',
        contents: transformedContents,
      })
    } catch (error: any) {
      console.error('Error fetching contents:', error)
      res.status(500).json({
        status: false,
        message: 'Internal server error',
        contents: null,
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
          status: false,
          message: 'User not authenticated',
          content: null,
        })
      }
      console.log('Debug info for content fetch:')
      console.log('Requested ID:', id)
      console.log('User ID:', userId)

      const client = getSupabaseClient(authHeader)

      // First check if this ID exists in content_types table
      const { data: contentTypeCheck } = await client
        .from('content_types')
        .select('id, title')
        .eq('id', id)
        .maybeSingle()

      if (contentTypeCheck) {
        console.log(
          'WARNING: The provided ID matches a content type, not a content item'
        )
        console.log('Content type found:', contentTypeCheck)
        return res.status(400).json({
          status: false,
          message:
            'The provided ID belongs to a content type. To fetch a content type, use the /content-types endpoint instead.',
          content: null,
        })
      }

      // First, let's do a global check for the content without user filtering
      const { data: globalCheckData, error: globalCheckError } = await client
        .from('contents')
        .select('user_id, status')
        .eq('id', id)
        .maybeSingle()

      console.log('Global content check:', {
        exists: !!globalCheckData,
        ownedBy: globalCheckData?.user_id,
        status: globalCheckData?.status,
        error: globalCheckError?.message,
      })

      // If content exists but belongs to another user, return permission error
      if (globalCheckData && globalCheckData.user_id !== userId) {
        console.log(
          'Content exists but belongs to another user:',
          globalCheckData.user_id
        )
        return res.status(403).json({
          status: false,
          message: 'You do not have permission to access this content',
          content: null,
        })
      }

      // Now get the full content with relationships if it exists
      const { data, error } = await client
        .from('contents')
        .select(
          `
          *,
          content_type:content_types (
            id,
            title,
            name,
            description,
            fields
          )
        `
        )
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle()

      console.log('Final query result:', {
        exists: !!data,
        error: error?.message,
        typeId: data?.type_id,
        status: data?.status,
      })

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          status: false,
          message: 'Error fetching content: ' + error.message,
          content: null,
          details: error.details || null,
        })
      }

      if (!data) {
        return res.status(404).json({
          status: false,
          message: `Content with ID ${id} not found`,
          content: null,
        })
      }

      // Return the content without spreading data fields
      res.status(200).json({
        status: true,
        message: 'Content fetched successfully',
        content: data,
      })
    } catch (error: any) {
      console.error('Error fetching content:', error)
      res.status(500).json({
        status: false,
        message: 'Internal server error',
        content: null,
      })
    }
  },

  updateContent: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { status, ...contentInput } =
        req.body as Partial<ContentCreateInput> & {
          status?: 'draft' | 'published' | 'scheduled'
        }
      const authHeader = req.headers.authorization
      const userId = (req as any).user?.id

      if (!userId || !authHeader) {
        return res.status(401).json({
          status: false,
          message: 'User not authenticated',
          content: null,
        })
      }

      const client = getSupabaseClient(authHeader)

      // First get the existing content
      const { data: existingContent, error: fetchError } = await client
        .from('contents')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        console.error('Supabase error:', fetchError)
        return res.status(400).json({
          status: false,
          message: fetchError.message,
          content: null,
        })
      }

      if (!existingContent) {
        return res.status(404).json({
          status: false,
          message: 'Content not found',
          content: null,
        })
      }

      // Validate cover_image structure if it's being updated
      if (
        contentInput.cover_image &&
        (!contentInput.cover_image.url || !contentInput.cover_image.alt)
      ) {
        return res.status(400).json({
          status: false,
          message: 'Cover image must include both url and alt text',
          content: null,
        })
      }

      // Merge the new data with existing data, maintaining the structure
      const updatedData = {
        ...existingContent.data,
        ...(contentInput.title && { title: contentInput.title }),
        ...(contentInput.slug && { slug: contentInput.slug }),
        ...(contentInput.content && { content: contentInput.content }),
        ...(contentInput.author && { author: contentInput.author }),
        ...(contentInput.cover_image && {
          cover_image: contentInput.cover_image,
        }),
        ...(contentInput.reading_time && {
          reading_time: contentInput.reading_time,
        }),
        ...(contentInput.tags && { tags: contentInput.tags }),
        ...(contentInput.meta_title && { meta_title: contentInput.meta_title }),
        ...(contentInput.meta_keywords && {
          meta_keywords: contentInput.meta_keywords,
        }),
      }

      // Prepare the update object with both data and status
      const updateObject: any = {
        data: updatedData,
        updated_at: new Date().toISOString(),
      }

      // Add status update if provided
      if (status) {
        updateObject.status = status
        if (status === 'published') {
          updateObject.published_at = new Date().toISOString()
        } else if (status === 'scheduled') {
          updateObject.scheduled_at = req.body.scheduled_at || null
        }
      }

      // Update with merged data and status
      const { data, error } = await client
        .from('contents')
        .update(updateObject)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          status: false,
          message: error.message,
          content: null,
        })
      }

      res.status(200).json({
        status: true,
        message: 'Content updated successfully',
        content: data, // Return the raw data without spreading
      })
    } catch (error: any) {
      console.error('Error updating content:', error)
      res.status(500).json({
        status: false,
        message: 'Internal server error',
        content: null,
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
          status: false,
          message: 'User not authenticated',
          content: null,
        })
      }

      if (!['draft', 'published', 'scheduled'].includes(status)) {
        return res.status(400).json({
          status: false,
          message: 'Invalid status. Must be draft, published, or scheduled',
          content: null,
        })
      }

      if (status === 'scheduled' && !scheduled_at) {
        return res.status(400).json({
          status: false,
          message: 'scheduled_at is required for scheduled status',
          content: null,
        })
      }

      const client = getSupabaseClient(authHeader)

      // First check if the content exists and belongs to the user
      const { data: existingContent, error: fetchError } = await client
        .from('contents')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (fetchError || !existingContent) {
        return res.status(404).json({
          status: false,
          message: 'Content not found',
          content: null,
        })
      }

      const updateData = {
        status,
        scheduled_at: status === 'scheduled' ? scheduled_at : null,
        published_at: status === 'published' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
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
          status: false,
          message: error.message,
          content: null,
        })
      }

      res.status(200).json({
        status: true,
        message: `Content ${status} successfully`,
        content: data, // Return the raw data without spreading
      })
    } catch (error: any) {
      console.error('Error verifying content:', error)
      res.status(500).json({
        status: false,
        message: 'Internal server error',
        content: null,
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
      const page = parseInt(req.query.page as string) || 1
      const pageSize = 25
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const client = getSupabaseClient(process.env.SUPABASE_SERVICE_KEY || '')
      let query = client
        .from('contents')
        .select(
          'id, type_id, user_id, status, scheduled_at, published_at, data, created_at, updated_at, content_type:content_types(*), profile:profiles(is_anonymous,username)',
          { count: 'exact' }
        )
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(from, to)

      if (type_id) {
        query = query.eq('type_id', type_id)
      }

      const { data: contents, error, count } = await query

      if (error) {
        console.error('Supabase error:', error)
        return res.status(400).json({
          message: error.message,
          details: error.details,
        })
      }

      // Set author as 'Anonymous' if is_anonymous is true, else use username
      const transformedContents = (contents || []).map((content) => {
        const profile = Array.isArray(content.profile)
          ? content.profile[0]
          : content.profile
        let author = content.data?.author
        if (profile?.is_anonymous) {
          author = 'Anonymous'
        } else if (profile?.username) {
          author = profile.username
        }
        // Only include the fields you want at the root, and do NOT include the nested data object
        // Do NOT spread ...content.data, instead pick the fields you want
        return {
          id: content.id,
          type_id: content.type_id,
          user_id: content.user_id,
          status: content.status,
          scheduled_at: content.scheduled_at,
          published_at: content.published_at,
          created_at: content.created_at,
          updated_at: content.updated_at,
          title: content.data?.title,
          slug: content.data?.slug,
          content: content.data?.content,
          cover_image: content.data?.cover_image,
          reading_time: content.data?.reading_time,
          tags: content.data?.tags,
          meta_title: content.data?.meta_title,
          meta_keywords: content.data?.meta_keywords,
          author,
        }
      })

      res.status(200).json({
        contents: transformedContents,
        length: transformedContents.length,
        total: count || 0,
        page,
        pageSize,
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
      // Remove authHeader check for public endpoint
      // Use service key for public access
      const client = getSupabaseClient(process.env.SUPABASE_SERVICE_KEY || '')
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
