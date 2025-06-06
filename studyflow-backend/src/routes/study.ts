import { Router } from 'express'

const router = Router()

// Test route
router.get('/test', (_req, res) => {
  res.json({ message: 'Study routes working!' })
})

export default router