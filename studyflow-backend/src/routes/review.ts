import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import {
  getDueReviews,
  getUpcomingReviews,
  completeReview,
  getReviewStats,
  skipReview
} from '../controllers/reviewController'

const router = Router()

// All routes require authentication
router.use(authenticateToken)

// Get reviews
router.get('/due', getDueReviews)
router.get('/upcoming', getUpcomingReviews)
router.get('/stats', getReviewStats)

// Review actions
router.post('/:reviewId/complete', completeReview)
router.post('/:reviewId/skip', skipReview)

export default router