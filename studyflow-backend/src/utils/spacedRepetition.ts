// SM-2 Algorithm Implementation
// Based on: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

interface ReviewData {
  quality: number // 0-5 (0=complete blackout, 5=perfect response)
  repetitions: number
  easeFactor: number
  interval: number
}

export class SpacedRepetitionService {
  /**
   * Calculate the next review date based on SM-2 algorithm
   * @param quality - Quality of response (0-5)
   * @param repetitions - Number of correct repetitions
   * @param easeFactor - Current ease factor (default 2.5)
   * @param interval - Current interval in days
   * @returns Updated review data with next interval
   */
  calculateNextReview(
    quality: number,
    repetitions: number = 0,
    easeFactor: number = 2.5,
    interval: number = 1
  ): ReviewData {
    // Quality should be 0-5
    quality = Math.max(0, Math.min(5, quality))

    // Calculate new ease factor
    let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    newEaseFactor = Math.max(1.3, newEaseFactor) // Minimum ease factor is 1.3

    let newRepetitions = repetitions
    let newInterval = interval

    if (quality >= 3) {
      // Correct response
      if (repetitions === 0) {
        newInterval = 1
      } else if (repetitions === 1) {
        newInterval = 6
      } else {
        newInterval = Math.round(interval * newEaseFactor)
      }
      newRepetitions = repetitions + 1
    } else {
      // Incorrect response - reset
      newRepetitions = 0
      newInterval = 1
    }

    return {
      quality,
      repetitions: newRepetitions,
      easeFactor: newEaseFactor,
      interval: newInterval
    }
  }

  /**
   * Calculate the next review date
   * @param interval - Interval in days
   * @returns Next review date
   */
  getNextReviewDate(interval: number): Date {
    const date = new Date()
    date.setDate(date.getDate() + interval)
    date.setHours(0, 0, 0, 0) // Set to start of day
    return date
  }

  /**
   * Determine if a review is due
   * @param scheduledDate - The scheduled review date
   * @returns Whether the review is due
   */
  isReviewDue(scheduledDate: Date): boolean {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return scheduledDate <= now
  }

  /**
   * Get review urgency (how overdue it is)
   * @param scheduledDate - The scheduled review date
   * @returns Number of days overdue (negative if not due yet)
   */
  getReviewUrgency(scheduledDate: Date): number {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const scheduled = new Date(scheduledDate)
    scheduled.setHours(0, 0, 0, 0)
    
    const diffTime = now.getTime() - scheduled.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  /**
   * Convert difficulty (1-5) to quality (0-5) for SM-2
   * This is used when converting from study session difficulty
   */
  difficultyToQuality(difficulty: number): number {
    // Inverse relationship: 
    // Difficulty 1 (very easy) = Quality 5 (perfect)
    // Difficulty 5 (very hard) = Quality 1 (difficult)
    return 6 - difficulty
  }

  /**
   * Get recommended review intervals for different mastery levels
   */
  getRecommendedIntervals(): { [key: string]: number[] } {
    return {
      beginner: [1, 3, 7, 14, 30],      // New material
      intermediate: [1, 6, 15, 30, 60], // Some familiarity
      advanced: [1, 10, 30, 90, 180]    // Well-known material
    }
  }
}

export const spacedRepetition = new SpacedRepetitionService()