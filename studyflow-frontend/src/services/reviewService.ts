import { api } from './api'
import { type Topic } from './topicService'
import { type StudySession } from './studySessionService'

export interface Review {
  id: string
  topicId: string
  topic: Topic
  studySessionId?: string
  studySession?: StudySession
  scheduledFor: string
  completedAt?: string
  difficulty?: number
  repetitions: number
  easeFactor: number
  interval: number
  quality?: number
  createdAt: string
  updatedAt: string
  // Added by frontend
  daysOverdue?: number
  isOverdue?: boolean
}

export interface ReviewStats {
  dueToday: number
  dueTomorrow: number
  dueThisWeek: number
  totalCompleted: number
}

export interface CompleteReviewData {
  quality?: number
  difficulty?: number
}

export const reviewService = {
  async getDueReviews(): Promise<Review[]> {
    const { data } = await api.get<Review[]>('/reviews/due')
    return data
  },

  async getUpcomingReviews(days: number = 7): Promise<Review[]> {
    const { data } = await api.get<Review[]>('/reviews/upcoming', {
      params: { days }
    })
    return data
  },

  async getReviewStats(): Promise<ReviewStats> {
    const { data } = await api.get<ReviewStats>('/reviews/stats')
    return data
  },

  async completeReview(reviewId: string, reviewData: CompleteReviewData): Promise<{
    message: string
    nextInterval: number
    nextReviewDate: string
  }> {
    const { data } = await api.post(`/reviews/${reviewId}/complete`, reviewData)
    return data
  },

  async skipReview(reviewId: string, days: number = 1): Promise<{
    message: string
    newDate: string
  }> {
    const { data } = await api.post(`/reviews/${reviewId}/skip`, { days })
    return data
  }
}