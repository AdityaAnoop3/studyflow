import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { createTopic, getUserTopics, updateTopic, deleteTopic } from '../controllers/topicController'
import { createStudySession, getUserSessions, getSessionStats } from '../controllers/studySessionController'

const router = Router()

// All study routes require authentication
router.use(authenticateToken)

// Topic routes
router.post('/topics', createTopic)
router.get('/topics', getUserTopics)
router.put('/topics/:id', updateTopic)
router.delete('/topics/:id', deleteTopic)

// Session routes
router.post('/sessions', createStudySession)
router.get('/sessions', getUserSessions)
router.get('/stats', getSessionStats)

export default router