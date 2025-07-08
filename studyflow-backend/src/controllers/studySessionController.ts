import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AuthRequest extends Request {
  userId?: string
}

export const createStudySession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { topicId, duration, difficulty, notes } = req.body
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    // Verify topic ownership
    const topic = await prisma.topic.findFirst({
      where: { id: topicId, userId }
    })

    if (!topic) {
      res.status(404).json({ message: 'Topic not found' })
      return
    }

    const session = await prisma.studySession.create({
      data: {
        userId,
        topicId,
        duration,
        difficulty,
        notes
      },
      include: {
        topic: true
      }
    })

    // Schedule review based on spaced repetition (simplified for now)
    const reviewIntervals = [1, 3, 7, 14, 30] // days
    const nextReviewDays = reviewIntervals[0]
    const nextReviewDate = new Date()
    nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewDays)

    await prisma.review.create({
      data: {
        topicId,
        studySessionId: session.id,
        scheduledFor: nextReviewDate
      }
    })

    res.status(201).json(session)
  } catch (error) {
    console.error('Create study session error:', error)
    res.status(500).json({ message: 'Failed to create study session' })
  }
}

export const getUserSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId
    const { limit = '10', offset = '0' } = req.query

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const sessions = await prisma.studySession.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        topic: true
      }
    })

    const total = await prisma.studySession.count({
      where: { userId }
    })

    res.json({ sessions, total })
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({ message: 'Failed to fetch sessions' })
  }
}

export const getSessionStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    // Get total study time
    const totalMinutes = await prisma.studySession.aggregate({
      where: { userId },
      _sum: { duration: true }
    })

    // Get study streak (simplified - consecutive days)
    const recentSessions = await prisma.studySession.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true }
    })

    // Calculate streak
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < recentSessions.length; i++) {
      const sessionDate = new Date(recentSessions[i].completedAt)
      sessionDate.setHours(0, 0, 0, 0)
      
      const dayDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (dayDiff === streak) {
        streak++
      } else {
        break
      }
    }

    // Get upcoming reviews
    const upcomingReviews = await prisma.review.count({
      where: {
        topic: { userId },
        completedAt: null,
        scheduledFor: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      }
    })

    res.json({
      totalMinutes: totalMinutes._sum.duration || 0,
      totalHours: Math.round((totalMinutes._sum.duration || 0) / 60),
      streak,
      upcomingReviews,
      totalSessions: recentSessions.length
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ message: 'Failed to fetch statistics' })
  }
}