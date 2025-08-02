import { Request, Response } from 'express'
import { getSupabaseClient } from '../config/supabase'

interface MediaMetadata {
  id?: string
  filename: string
  originalname: string
  mimetype: string
  size: number
  url: string
  user_id?: string
  description?: string
  alt_text?: string
  metadata?: any
  created_at?: string
  updated_at?: string
}

export const mediaController = {
  uploadMedia: async (req: Request, res: Response) => {
    try {
      const user_id = (req as any).user?.id
      const authHeader = req.headers.authorization

      let fileBuffer: Buffer
      let originalname: string
      let mimetype: string
      let size: number
      let url: string

      if (req.file) {
        // Handle multipart/form-data file upload
        const file = req.file
        fileBuffer = file.buffer
        originalname = file.originalname
        mimetype = file.mimetype
        size = file.size
        url = `data:${mimetype};base64,${fileBuffer.toString('base64')}`
      } else if (
        req.body.file &&
        typeof req.body.file === 'string' &&
        req.body.file.startsWith('data:')
      ) {
        // Handle base64-encoded string
        const base64String = req.body.file
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
        if (!matches || matches.length !== 3) {
          throw new Error('Invalid base64 string')
        }
        const [, mime, base64Data] = matches
        fileBuffer = Buffer.from(base64Data, 'base64')
        originalname = req.body.originalname || 'uploaded-file'
        mimetype = mime
        size = fileBuffer.length
        url = base64String // Use the provided base64 string
        if (
          ![
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
          ].includes(mimetype)
        ) {
          throw new Error('Unsupported file type')
        }
      } else {
        throw new Error('No file or base64 data provided')
      }

      // Generate a unique filename
      const timestamp = Date.now()
      const extension = mimetype.split('/')[1]
      const uniqueFilename = `${timestamp}-${originalname}`

      const client = getSupabaseClient(authHeader || '')

      // Save media metadata with base64 URL
      const mediaMetadata: MediaMetadata = {
        filename: uniqueFilename,
        originalname,
        mimetype,
        size,
        url,
        user_id: user_id || undefined,
      }

      const { data: metadata, error: metadataError } = await client
        .from('media')
        .insert(mediaMetadata)
        .select()
        .single()

      if (metadataError) {
        console.error('Metadata Insert Error:', metadataError)
        throw metadataError
      }

      res.status(201).json({
        status: true,
        message: 'Media uploaded successfully',
        media: metadata,
      })
    } catch (error: any) {
      console.error('Upload Error:', error)
      res.status(400).json({
        status: false,
        message: error.message,
      })
    }
  },

  getMediaList: async (req: Request, res: Response) => {
    try {
      const user_id = (req as any).user?.id
      const authHeader = req.headers.authorization

      if (!user_id || !authHeader) {
        throw new Error('User not authenticated')
      }

      const client = getSupabaseClient(authHeader)
      const { data, error } = await client
        .from('media')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      res.status(200).json({
        status: true,
        message: 'Media list retrieved successfully',
        media: data,
      })
    } catch (error: any) {
      res.status(400).json({
        status: false,
        message: error.message,
      })
    }
  },

  getMedia: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const user_id = (req as any).user?.id
      const authHeader = req.headers.authorization

      if (!user_id || !authHeader) {
        throw new Error('User not authenticated')
      }

      const client = getSupabaseClient(authHeader)
      const { data, error } = await client
        .from('media')
        .select('*')
        .eq('id', id)
        .eq('user_id', user_id)
        .single()

      if (error) throw error

      res.status(200).json({
        status: true,
        message: 'Media retrieved successfully',
        media: data,
      })
    } catch (error: any) {
      res.status(400).json({
        status: false,
        message: error.message,
      })
    }
  },

  deleteMedia: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const user_id = (req as any).user?.id
      const authHeader = req.headers.authorization

      if (!user_id || !authHeader) {
        throw new Error('User not authenticated')
      }

      const client = getSupabaseClient(authHeader)

      const { data: media, error: fetchError } = await client
        .from('media')
        .select('*')
        .eq('id', id)
        .eq('user_id', user_id)
        .single()

      if (fetchError) throw fetchError

      const { error: deleteError } = await client
        .from('media')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id)

      if (deleteError) throw deleteError

      res.status(200).json({
        status: true,
        message: 'Media deleted successfully',
      })
    } catch (error: any) {
      res.status(400).json({
        status: false,
        message: error.message,
      })
    }
  },
}
