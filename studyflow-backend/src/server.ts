import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import studyRoutes from './routes/study'

console.log('Starting server initialization...')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

console.log('Configuring middleware...')

// Middleware
app.use(cors())
app.use(express.json())

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/study', studyRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'StudyFlow API is running' })
})

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
  })
})