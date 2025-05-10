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
router.post('/:typeId', requireAuth, contentController.createContent)
router.get('/:typeId', requireAuth, contentController.getContents)
router.get('/:typeId/:id', requireAuth, contentController.getContent)
router.get('/:typeId/:id/verify', requireAuth, contentController.verifyContent)
router.put('/:typeId/:id', requireAuth, contentController.updateContent)
router.delete('/:typeId/:id', requireAuth, contentController.deleteContent)

// Public routes (no auth required)
router.get('/public/posts', contentController.getPublishedContents)
router.get('/public/posts/:id', contentController.getPublishedContent)

export const contentRoutes = router
