import { Router } from 'express'
import { authController } from '../controllers/auth'

const router = Router()

// Auth routes
router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/logout', authController.logout)
router.get('/me', authController.getCurrentUser)

export const authRoutes = router
