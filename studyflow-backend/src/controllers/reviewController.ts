import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { spacedRepetition } from '../utils/spacedRepetition'

const prisma = new PrismaClient()

interface AuthRequest extends Request {
  userId?: string
}

export const getDueReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    // Get all reviews due today or overdue
    const now = new Date()
    const reviews = await prisma.review.findMany({
      where: {
        topic: { userId },
        completedAt: null,
        scheduledFor: { lte: now }
      },
      include: {
        topic: true,
        studySession: true
      },
      orderBy: { scheduledFor: 'asc' } // Most overdue first
    })

    // Add urgency information
    const reviewsWithUrgency = reviews.map(review => ({
      ...review,
      daysOverdue: spacedRepetition.getReviewUrgency(review.scheduledFor),
      isOverdue: spacedRepetition.isReviewDue(review.scheduledFor)
    }))

    res.json(reviewsWithUrgency)
  } catch (error) {
    console.error('Get due reviews error:', error)
    res.status(500).json({ message: 'Failed to fetch due reviews' })
  }
}

export const getUpcomingReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId
    const { days = '7' } = req.query

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + parseInt(days as string))

    const reviews = await prisma.review.findMany({
      where: {
        topic: { userId },
        completedAt: null,
        scheduledFor: {
          gt: now,
          lte: futureDate
        }
      },
      include: {
        topic: true
      },
      orderBy: { scheduledFor: 'asc' }
    })

    res.json(reviews)
  } catch (error) {
    console.error('Get upcoming reviews error:', error)
    res.status(500).json({ message: 'Failed to fetch upcoming reviews' })
  }
}

export const completeReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params
    const { quality, difficulty } = req.body
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    // Get the review
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        topic: { userId }
      },
      include: {
        topic: true
      }
    })

    if (!review) {
      res.status(404).json({ message: 'Review not found' })
      return
    }

    // Calculate next review using SM-2
    const reviewQuality = quality || spacedRepetition.difficultyToQuality(difficulty || 3)
    const nextReview = spacedRepetition.calculateNextReview(
      reviewQuality,
      review.repetitions,
      review.easeFactor,
      review.interval
    )

    // Update current review
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        completedAt: new Date(),
        difficulty,
        quality: reviewQuality
      }
    })

    // Create next review if quality >= 3 (passing grade)
    if (nextReview.quality >= 3) {
      const nextReviewDate = spacedRepetition.getNextReviewDate(nextReview.interval)
      
      await prisma.review.create({
        data: {
          topicId: review.topicId,
          scheduledFor: nextReviewDate,
          repetitions: nextReview.repetitions,
          easeFactor: nextReview.easeFactor,
          interval: nextReview.interval
        }
      })
    } else {
      // Failed review - create immediate review for tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      await prisma.review.create({
        data: {
          topicId: review.topicId,
          scheduledFor: tomorrow,
          repetitions: 0,
          easeFactor: review.easeFactor,
          interval: 1
        }
      })
    }

    res.json({
      message: 'Review completed successfully',
      nextInterval: nextReview.interval,
      nextReviewDate: spacedRepetition.getNextReviewDate(nextReview.interval)
    })
  } catch (error) {
    console.error('Complete review error:', error)
    res.status(500).json({ message: 'Failed to complete review' })
  }
}

export const getReviewStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const now = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const [dueToday, dueTomorrow, dueThisWeek, completed] = await Promise.all([
      prisma.review.count({
        where: {
          topic: { userId },
          completedAt: null,
          scheduledFor: { lte: now }
        }
      }),
      prisma.review.count({
        where: {
          topic: { userId },
          completedAt: null,
          scheduledFor: {
            gt: now,
            lte: tomorrow
          }
        }
      }),
      prisma.review.count({
        where: {
          topic: { userId },
          completedAt: null,
          scheduledFor: {
            gt: now,
            lte: nextWeek
          }
        }
      }),
      prisma.review.count({
        where: {
          topic: { userId },
          completedAt: { not: null }
        }
      })
    ])

    res.json({
      dueToday,
      dueTomorrow,
      dueThisWeek,
      totalCompleted: completed
    })
  } catch (error) {
    console.error('Get review stats error:', error)
    res.status(500).json({ message: 'Failed to fetch review statistics' })
  }
}

export const skipReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params
    const { days = 1 } = req.body
    const userId = req.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        topic: { userId }
      }
    })

    if (!review) {
      res.status(404).json({ message: 'Review not found' })
      return
    }

    // Reschedule the review
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + days)
    newDate.setHours(0, 0, 0, 0)

    await prisma.review.update({
      where: { id: reviewId },
      data: { scheduledFor: newDate }
    })

    res.json({ message: 'Review rescheduled', newDate })
  } catch (error) {
    console.error('Skip review error:', error)
    res.status(500).json({ message: 'Failed to skip review' })
  }
}