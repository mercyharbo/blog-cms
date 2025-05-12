import { Router } from 'express'
import { authController } from '../controllers/auth'
import { requireAuth } from '../middleware/auth'

const router = Router()

// Auth routes
router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/logout', authController.logout)
router.get('/me', requireAuth, authController.getCurrentUser)

// Password management routes
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)
router.post('/change-password', requireAuth, authController.changePassword)

// Profile route
router.put('/profile', requireAuth, authController.updateProfile)

export const authRoutes = router
