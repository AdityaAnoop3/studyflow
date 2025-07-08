import { api } from './api'
import { type StudySession } from './studySessionService'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns'

interface DailyStudyTime {
  date: string
  minutes: number
  sessions: number
}

interface TopicBreakdown {
  topic: string
  minutes: number
  sessions: number
  avgDifficulty: number
}

interface DifficultyTrend {
  date: string
  avgDifficulty: number
}

export const analyticsService = {
  async getDailyStudyTime(days: number = 7): Promise<DailyStudyTime[]> {
    const endDate = new Date()
    const startDate = subDays(endDate, days - 1)
    
    // Get sessions for the period
    const { data } = await api.get<{ sessions: StudySession[], total: number }>('/study/sessions', {
      params: { limit: 100 } // Get more sessions for analytics
    })
    
    // Create a map of dates to study data
    const dateMap = new Map<string, { minutes: number, sessions: number }>()
    
    // Initialize all dates with zero values
    eachDayOfInterval({ start: startDate, end: endDate }).forEach(date => {
      const key = format(date, 'yyyy-MM-dd')
      dateMap.set(key, { minutes: 0, sessions: 0 })
    })
    
    // Aggregate sessions by date
    data.sessions.forEach(session => {
      const date = format(new Date(session.completedAt), 'yyyy-MM-dd')
      const existing = dateMap.get(date)
      if (existing) {
        existing.minutes += session.duration
        existing.sessions += 1
      }
    })
    
    // Convert to array
    return Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      minutes: data.minutes,
      sessions: data.sessions
    }))
  },

  async getTopicBreakdown(): Promise<TopicBreakdown[]> {
    const { data } = await api.get<{ sessions: StudySession[], total: number }>('/study/sessions', {
      params: { limit: 100 }
    })
    
    // Aggregate by topic
    const topicMap = new Map<string, { minutes: number, sessions: number, totalDifficulty: number }>()
    
    data.sessions.forEach(session => {
      const existing = topicMap.get(session.topic.name) || { minutes: 0, sessions: 0, totalDifficulty: 0 }
      existing.minutes += session.duration
      existing.sessions += 1
      existing.totalDifficulty += session.difficulty
      topicMap.set(session.topic.name, existing)
    })
    
    // Convert to array with average difficulty
    return Array.from(topicMap.entries()).map(([topic, data]) => ({
      topic,
      minutes: data.minutes,
      sessions: data.sessions,
      avgDifficulty: data.sessions > 0 ? data.totalDifficulty / data.sessions : 0
    }))
  },

  async getDifficultyTrend(days: number = 30): Promise<DifficultyTrend[]> {
    const { data } = await api.get<{ sessions: StudySession[], total: number }>('/study/sessions', {
      params: { limit: 100 }
    })
    
    // Group by date and calculate average difficulty
    const dateMap = new Map<string, { totalDifficulty: number, count: number }>()
    
    data.sessions.forEach(session => {
      const date = format(new Date(session.completedAt), 'yyyy-MM-dd')
      const existing = dateMap.get(date) || { totalDifficulty: 0, count: 0 }
      existing.totalDifficulty += session.difficulty
      existing.count += 1
      dateMap.set(date, existing)
    })
    
    // Convert to array with average difficulty
    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        avgDifficulty: data.count > 0 ? Number((data.totalDifficulty / data.count).toFixed(2)) : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-days) // Get last N days
  },

  async getStudyStreak(): Promise<{ currentStreak: number, longestStreak: number, studyDays: string[] }> {
    const { data } = await api.get<{ sessions: StudySession[], total: number }>('/study/sessions', {
      params: { limit: 365 } // Get a year's worth
    })
    
    // Get unique study days
    const studyDays = new Set<string>()
    data.sessions.forEach(session => {
      studyDays.add(format(new Date(session.completedAt), 'yyyy-MM-dd'))
    })
    
    const sortedDays = Array.from(studyDays).sort()
    
    // Calculate streaks
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let lastDate: Date | null = null
    
    const today = format(new Date(), 'yyyy-MM-dd')
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    
    sortedDays.forEach(dateStr => {
      const date = new Date(dateStr)
      
      if (!lastDate) {
        tempStreak = 1
      } else {
        const dayDiff = Math.floor((date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        if (dayDiff === 1) {
          tempStreak++
        } else {
          tempStreak = 1
        }
      }
      
      longestStreak = Math.max(longestStreak, tempStreak)
      
      // Check if current streak is still active
      if (dateStr === today || dateStr === yesterday) {
        currentStreak = tempStreak
      }
      
      lastDate = date
    })
    
    return {
      currentStreak,
      longestStreak,
      studyDays: sortedDays
    }
  }
}