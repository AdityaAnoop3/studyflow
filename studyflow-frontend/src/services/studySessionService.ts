import { api } from './api'
import type { Topic } from './topicService'

export interface StudySession {
  id: string
  userId: string
  topicId: string
  duration: number
  difficulty: number
  notes?: string
  completedAt: string
  topic: Topic
}

export interface CreateSessionData {
  topicId: string
  duration: number
  difficulty: number
  notes?: string
}

export interface SessionsResponse {
  sessions: StudySession[]
  total: number
}

export interface StudyStats {
  totalMinutes: number
  totalHours: number
  streak: number
  upcomingReviews: number
  totalSessions: number
}

export const studySessionService = {
  async createSession(session: CreateSessionData): Promise<StudySession> {
    const { data } = await api.post<StudySession>('/study/sessions', session)
    return data
  },

  async getSessions(limit = 10, offset = 0): Promise<SessionsResponse> {
    const { data } = await api.get<SessionsResponse>('/study/sessions', {
      params: { limit, offset }
    })
    return data
  },

  async getStats(): Promise<StudyStats> {
    const { data } = await api.get<StudyStats>('/study/stats')
    return data
  }
}