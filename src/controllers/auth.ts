import { Request, Response } from 'express'
import { supabase } from '../config/supabase'

export const authController = {
  signup: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            'https://blog-cms-frontend-nine.vercel.app/auth/callback',
        },
      })

      if (error) throw error

      res.status(201).json({
        status: true,
        message: 'User created successfully',
        user: data.user,
      })
    } catch (error: any) {
      res.status(400).json({
        status: false,
        message: error.message,
      })
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      res.status(200).json({
        status: true,
        message: 'Login successful',
        user: data.user,
        session: data.session,
      })
    } catch (error: any) {
      res.status(400).json({
        status: false,
        message: error.message,
      })
    }
  },

  logout: async (req: Request, res: Response) => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      res.status(200).json({
        status: true,
        message: 'Logout successful',
      })
    } catch (error: any) {
      res.status(400).json({
        status: false,
        message: error.message,
      })
    }
  },

  getCurrentUser: async (req: Request, res: Response) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(userError?.message || 'User not found')
      }

      // Try to fetch the user's profile
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle() // Use maybeSingle instead of single to avoid error when no profile exists

      // If profile doesn't exist, create it
      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{ id: user.id }])
          .select()
          .single()

        if (createError) throw createError
        profile = newProfile
      }

      res.status(200).json({
        status: true,
        message: 'User profile retrieved successfully',
        user: {
          ...user,
          profile: {
            first_name: profile?.first_name || null,
            last_name: profile?.last_name || null,
            avatar_url: profile?.avatar_url || null,
            bio: profile?.bio || null,
          },
        },
      })
    } catch (error: any) {
      res.status(400).json({
        status: false,
        message: error.message,
      })
    }
  },

  updateProfile: async (req: Request, res: Response) => {
    try {
      const { first_name, last_name, bio, avatar_url } = req.body
      const userId = (req as any).user?.id

      if (!userId) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name,
          last_name,
          bio,
          avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      res.status(200).json({
        status: true,
        message: 'Profile updated successfully',
        profile: data,
      })
    } catch (error: any) {
      res.status(400).json({
        status: false,
        message: error.message,
      })
    }
  },
}
