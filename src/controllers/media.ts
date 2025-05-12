import { Request, Response } from 'express'
import { getSupabaseClient } from '../config/supabase'

interface MediaMetadata {
  id?: string
  filename: string
  originalname: string
  mimetype: string
  size: number
  url: string
  user_id: string
  description?: string
  alt_text?: string
  metadata?: any
  created_at?: string
  updated_at?: string
}

export const mediaController = {
  uploadMedia: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        throw new Error('No file uploaded')
      }

      const file = req.file
      const user_id = (req as any).user?.id
      const authHeader = req.headers.authorization

      if (!user_id || !authHeader) {
        throw new Error('User not authenticated')
      }

      // Generate a unique filename
      const timestamp = Date.now()
      const uniqueFilename = `${timestamp}-${file.originalname}`

      const client = getSupabaseClient(authHeader)

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await client.storage
        .from('media')
        .upload(uniqueFilename, file.buffer, {
          contentType: file.mimetype,
        })

      if (uploadError) throw uploadError

      // Get the public URL
      const {
        data: { publicUrl },
      } = client.storage.from('media').getPublicUrl(uniqueFilename)

      // Save media metadata
      const mediaMetadata: MediaMetadata = {
        filename: uniqueFilename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: publicUrl,
        user_id,
      }

      const { data: metadata, error: metadataError } = await client
        .from('media')
        .insert(mediaMetadata)
        .select()
        .single()

      if (metadataError) throw metadataError

      res.status(201).json({
        status: true,
        message: 'Media uploaded successfully',
        media: metadata,
      })
    } catch (error: any) {
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

      // Get media metadata
      const { data: media, error: fetchError } = await client
        .from('media')
        .select('*')
        .eq('id', id)
        .eq('user_id', user_id)
        .single()

      if (fetchError) throw fetchError

      // Delete file from storage
      const { error: storageError } = await client.storage
        .from('media')
        .remove([media.filename])

      if (storageError) throw storageError

      // Delete metadata
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
