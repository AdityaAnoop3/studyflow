import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { upload } from '../middleware/upload'
import {
  createProblemSet,
  getUserProblemSets,
  getProblemSetById,
  updateProblemSet,
  deleteProblemSet,
  addProblem,
  updateProblem,
  deleteProblem,
  recordAttempt,
  generateProblemsFromFile
} from '../controllers/problemSetController'

const router = Router()

// All routes require authentication
router.use(authenticateToken)

// Problem Set routes
router.post('/', createProblemSet)
router.get('/', getUserProblemSets)
router.get('/:id', getProblemSetById)
router.put('/:id', updateProblemSet)
router.delete('/:id', deleteProblemSet)

// Problem routes within sets
router.post('/:problemSetId/problems', addProblem)
router.put('/:problemSetId/problems/:problemId', updateProblem)
router.delete('/:problemSetId/problems/:problemId', deleteProblem)

// Record attempt
router.post('/problems/:problemId/attempt', recordAttempt)

// Generate problems from file
router.post('/:problemSetId/generate', upload.single('file'), generateProblemsFromFile)

export default router