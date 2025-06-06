import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface JwtPayload {
  userId: string
  email: string
}

declare global {
  namespace Express {
    interface Request {
      userId?: string
      userEmail?: string
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'Access token required' })
    return
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.userId = verified.userId
    req.userEmail = verified.email
    next()
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' })
    return
  }
}