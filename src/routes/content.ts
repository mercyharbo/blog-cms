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
router.get('/:typeId', contentController.getContents)
router.get('/:typeId/:id', contentController.getContent)
router.put('/:typeId/:id', requireAuth, contentController.updateContent)
router.delete('/:typeId/:id', requireAuth, contentController.deleteContent)

export const contentRoutes = router
