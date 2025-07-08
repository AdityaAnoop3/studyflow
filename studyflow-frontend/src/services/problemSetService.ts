import { api } from './api'

export interface Problem {
  id: string
  problemSetId: string
  question: string
  answer: string
  difficulty: number
  attempts: number
  successes: number
  lastAttempt?: string
  createdAt: string
  updatedAt: string
}

export interface ProblemSet {
  id: string
  title: string
  description?: string
  userId: string
  createdAt: string
  updatedAt: string
  _count?: {
    problems: number
  }
  problems?: Problem[]
}

export interface CreateProblemSetData {
  title: string
  description?: string
}

export interface CreateProblemData {
  question: string
  answer: string
  difficulty?: number
}

export const problemSetService = {
  async getProblemSets(): Promise<ProblemSet[]> {
    const { data } = await api.get<ProblemSet[]>('/problem-sets')
    return data
  },

  async getProblemSetById(id: string): Promise<ProblemSet> {
    const { data } = await api.get<ProblemSet>(`/problem-sets/${id}`)
    return data
  },

  async createProblemSet(problemSet: CreateProblemSetData): Promise<ProblemSet> {
    const { data } = await api.post<ProblemSet>('/problem-sets', problemSet)
    return data
  },

  async updateProblemSet(id: string, problemSet: CreateProblemSetData): Promise<ProblemSet> {
    const { data } = await api.put<ProblemSet>(`/problem-sets/${id}`, problemSet)
    return data
  },

  async deleteProblemSet(id: string): Promise<void> {
    await api.delete(`/problem-sets/${id}`)
  },

  async addProblem(problemSetId: string, problem: CreateProblemData): Promise<Problem> {
    const { data } = await api.post<Problem>(`/problem-sets/${problemSetId}/problems`, problem)
    return data
  },

  async updateProblem(problemSetId: string, problemId: string, problem: CreateProblemData): Promise<Problem> {
    const { data } = await api.put<Problem>(`/problem-sets/${problemSetId}/problems/${problemId}`, problem)
    return data
  },

  async deleteProblem(problemSetId: string, problemId: string): Promise<void> {
    await api.delete(`/problem-sets/${problemSetId}/problems/${problemId}`)
  },

  async recordAttempt(problemId: string, success: boolean): Promise<Problem & { successRate: number }> {
    const { data } = await api.post(`/problem-sets/problems/${problemId}/attempt`, { success })
    return data
  },

  async generateProblemsFromFile(problemSetId: string, file: File, subject?: string, count?: number): Promise<{ message: string, problems: Problem[] }> {
    const formData = new FormData()
    formData.append('file', file)
    if (subject) formData.append('subject', subject)
    if (count) formData.append('count', count.toString())

    const { data } = await api.post(`/problem-sets/${problemSetId}/generate`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return data
  }
}