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
        .maybeSingle()

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
            is_anonymous: profile?.is_anonymous || false,
            username: profile?.username || null,
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
      const { first_name, last_name, bio, avatar_url, is_anonymous, username } =
        req.body
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
          is_anonymous,
          username,
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

  forgotPassword: async (req: Request, res: Response) => {
    try {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({
          status: false,
          message: 'Email is required',
        })
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          'https://blog-cms-frontend-nine.vercel.app/auth/reset-password',
      })

      if (error) throw error

      res.status(200).json({
        status: true,
        message: 'Password reset email sent successfully',
      })
    } catch (error: any) {
      res.status(400).json({
        status: false,
        message: error.message,
      })
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { new_password } = req.body
      const authHeader = req.headers.authorization

      if (!authHeader) {
        return res.status(401).json({
          status: false,
          message: 'Authorization token is required',
        })
      }

      const { error } = await supabase.auth.updateUser({
        password: new_password,
      })

      if (error) throw error

      res.status(200).json({
        status: true,
        message: 'Password reset successfully',
      })
    } catch (error: any) {
      res.status(400).json({
        status: false,
        message: error.message,
      })
    }
  },

  changePassword: async (req: Request, res: Response) => {
    try {
      const { current_password, new_password } = req.body
      const authHeader = req.headers.authorization
      const userId = (req as any).user?.id

      if (!userId || !authHeader) {
        return res.status(401).json({
          status: false,
          message: 'User not authenticated',
        })
      }

      if (!current_password || !new_password) {
        return res.status(400).json({
          status: false,
          message: 'Current password and new password are required',
        })
      }

      // First verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (req as any).user.email,
        password: current_password,
      })

      if (signInError) {
        return res.status(400).json({
          status: false,
          message: 'Current password is incorrect',
        })
      }

      // If current password is correct, update to new password
      const { error } = await supabase.auth.updateUser({
        password: new_password,
      })

      if (error) throw error

      res.status(200).json({
        status: true,
        message: 'Password changed successfully',
      })
    } catch (error: any) {
      res.status(400).json({
        status: false,
        message: error.message,
      })
    }
  },
}
