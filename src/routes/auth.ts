import { Router } from 'express'
import { authController } from '../controllers/auth'
import { requireAuth } from '../middleware/auth'

const router = Router()

// Auth routes
router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/logout', authController.logout)
router.get('/me', requireAuth, authController.getCurrentUser)

// Profile route
router.put('/profile', requireAuth, authController.updateProfile)

export const authRoutes = router
