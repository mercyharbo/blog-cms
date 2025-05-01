import { Request, Response } from 'express'
import { supabase } from '../config/supabase'

interface MediaMetadata {
  id?: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  userId: string
  createdAt?: string
}

export const mediaController = {
  uploadMedia: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        throw new Error('No file uploaded')
      }

      const file = req.file
      const userId = (req as any).user?.id

      if (!userId) {
        throw new Error('User not authenticated')
      }

      // Generate a unique filename
      const timestamp = Date.now()
      const uniqueFilename = `${timestamp}-${file.originalname}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(uniqueFilename, file.buffer, {
          contentType: file.mimetype,
        })

      if (uploadError) throw uploadError

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('media').getPublicUrl(uniqueFilename)

      // Save media metadata
      const mediaMetadata: MediaMetadata = {
        filename: uniqueFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: publicUrl,
        userId,
      }

      const { data: metadata, error: metadataError } = await supabase
        .from('media')
        .insert(mediaMetadata)
        .select()
        .single()

      if (metadataError) throw metadataError

      res.status(201).json({
        message: 'Media uploaded successfully',
        media: metadata,
      })
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      })
    }
  },

  getMediaList: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })

      if (error) throw error

      res.status(200).json({
        media: data,
      })
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      })
    }
  },

  getMedia: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const userId = (req as any).user?.id
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('id', id)
        .eq('userId', userId)
        .single()

      if (error) throw error

      res.status(200).json({
        media: data,
      })
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      })
    }
  },

  deleteMedia: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const userId = (req as any).user?.id
      if (!userId) {
        throw new Error('User not authenticated')
      }

      // Get media metadata
      const { data: media, error: fetchError } = await supabase
        .from('media')
        .select('*')
        .eq('id', id)
        .eq('userId', userId)
        .single()

      if (fetchError) throw fetchError

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([media.filename])

      if (storageError) throw storageError

      // Delete metadata
      const { error: deleteError } = await supabase
        .from('media')
        .delete()
        .eq('id', id)
        .eq('userId', userId)

      if (deleteError) throw deleteError

      res.status(200).json({
        message: 'Media deleted successfully',
      })
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      })
    }
  },
}
