import { api } from './api'

export interface Topic {
  id: string
  name: string
  description?: string
  userId: string
  createdAt: string
  updatedAt: string
  _count?: {
    studySessions: number
  }
}

export interface CreateTopicData {
  name: string
  description?: string
}

export const topicService = {
  async getTopics(): Promise<Topic[]> {
    const { data } = await api.get<Topic[]>('/study/topics')
    return data
  },

  async createTopic(topic: CreateTopicData): Promise<Topic> {
    const { data } = await api.post<Topic>('/study/topics', topic)
    return data
  },

  async updateTopic(id: string, topic: CreateTopicData): Promise<Topic> {
    const { data } = await api.put<Topic>(`/study/topics/${id}`, topic)
    return data
  },

  async deleteTopic(id: string): Promise<void> {
    await api.delete(`/study/topics/${id}`)
  }
}