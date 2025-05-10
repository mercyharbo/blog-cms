import { Router } from 'express'
import { contentController } from '../controllers/content'
import { requireAuth } from '../middleware/auth'

const router = Router()

// Content type routes
router.post('/types', requireAuth, contentController.createContentType)
router.get('/types', requireAuth, contentController.getContentTypes)
router.get('/types/:id', requireAuth, contentController.getContentType)
router.put('/types/:id', requireAuth, contentController.updateContentType)
router.delete('/types/:id', requireAuth, contentController.deleteContentType)

// Content routes
router.get('/contents', requireAuth, contentController.getContents) // Get all contents with optional type filter
router.get('/contents/:id', requireAuth, contentController.getContent)
router.post('/types/:id/contents', requireAuth, contentController.createContent)
router.put('/contents/:id/verify', requireAuth, contentController.verifyContent)
router.put('/contents/:id', requireAuth, contentController.updateContent)
router.delete('/contents/:id', requireAuth, contentController.deleteContent)

// Public routes (no auth required)
router.get('/public/posts', contentController.getPublishedContents)
router.get('/public/posts/:id', contentController.getPublishedContent)

export const contentRoutes = router
