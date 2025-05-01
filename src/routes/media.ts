import { Router } from 'express'
import { mediaController } from '../controllers/media'
import { requireAuth } from '../middleware/auth'
import { upload } from '../middleware/upload'

const router = Router()

// Media routes
router.post(
  '/upload',
  requireAuth,
  upload.single('file'),
  mediaController.uploadMedia
)
router.get('/', requireAuth, mediaController.getMediaList)
router.get('/:id', requireAuth, mediaController.getMedia)
router.delete('/:id', requireAuth, mediaController.deleteMedia)

export const mediaRoutes = router
