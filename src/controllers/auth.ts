import { Request, Response } from 'express'
import { supabase } from '../config/supabase'

export const authController = {
  signup: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      res.status(201).json({
        message: 'User created successfully',
        user: data.user,
      })
    } catch (error: any) {
      res.status(400).json({
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
        message: 'Login successful',
        user: data.user,
        session: data.session,
      })
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      })
    }
  },

  logout: async (req: Request, res: Response) => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      res.status(200).json({
        message: 'Logout successful',
      })
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      })
    }
  },

  getCurrentUser: async (req: Request, res: Response) => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) throw error

      res.status(200).json({
        user,
      })
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      })
    }
  },
}
