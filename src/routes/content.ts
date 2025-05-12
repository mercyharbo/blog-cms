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

// Content management routes
router.get('/', requireAuth, contentController.getContents) // Get all contents
router.get('/type/:id', requireAuth, contentController.getContents) // Get contents by type ID
router.get('/:id', requireAuth, contentController.getContent) // Get single content
router.post('/types/:id', requireAuth, contentController.createContent)
router.put('/:id', requireAuth, contentController.updateContent)
router.put('/:id/verify', requireAuth, contentController.verifyContent)
router.delete('/:id', requireAuth, contentController.deleteContent)

// Public routes (no auth required)
router.get('/public/posts', contentController.getPublishedContents)
router.get('/public/posts/:id', contentController.getPublishedContent)

export const contentRoutes = router
