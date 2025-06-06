import { Router } from 'express'

const router = Router()

// Test route
router.get('/test', (_req, res) => {
  res.json({ message: 'Auth routes working!' })
})

// Login route (placeholder for now)
router.post('/login', (_req, res) => {
  res.json({ message: 'Login endpoint - to be implemented' })
})

// Signup route (placeholder for now)
router.post('/signup', (_req, res) => {
  res.json({ message: 'Signup endpoint - to be implemented' })
})

export default router