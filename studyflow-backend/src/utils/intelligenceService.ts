import axios from 'axios'

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

export class IntelligenceService {
  private apiClient = axios.create({
    baseURL: PYTHON_SERVICE_URL,
    timeout: 30000
  })

  async getStudyAnalytics(userId: string, days: number = 30) {
    try {
      const response = await this.apiClient.post('/api/analytics/analyze-patterns', {
        user_id: userId,
        days
      })
      return response.data
    } catch (error) {
      console.error('Failed to get study analytics:', error)
      throw new Error('Intelligence service unavailable')
    }
  }

  async getStudyPlan(userId: string, availableHours: number = 2.0, goals?: any) {
    try {
      const response = await this.apiClient.post('/api/recommendations/study-plan', {
        user_id: userId,
        available_hours_per_day: availableHours,
        goals
      })
      return response.data
    } catch (error) {
      console.error('Failed to get study plan:', error)
      throw new Error('Intelligence service unavailable')
    }
  }

  async getOptimalReviewTimes(userId: string) {
    try {
      const response = await this.apiClient.get(`/api/spaced-repetition/optimal-review-times/${userId}`)
      return response.data
    } catch (error) {
      console.error('Failed to get optimal review times:', error)
      throw new Error('Intelligence service unavailable')
    }
  }

  async getRetentionForecast(userId: string, topicId: string, daysAhead: number = 30) {
    try {
      const response = await this.apiClient.get(
        `/api/spaced-repetition/retention-forecast/${userId}/${topicId}`,
        { params: { days_ahead: daysAhead } }
      )
      return response.data
    } catch (error) {
      console.error('Failed to get retention forecast:', error)
      throw new Error('Intelligence service unavailable')
    }
  }

  async getStudyInsights(userId: string) {
    try {
      const response = await this.apiClient.get(`/api/recommendations/study-insights/${userId}`)
      return response.data
    } catch (error) {
      console.error('Failed to get study insights:', error)
      throw new Error('Intelligence service unavailable')
    }
  }
}

export const intelligenceService = new IntelligenceService()