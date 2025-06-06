import { api } from './api'

interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
  }
  token: string
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
    return data
  },

  async signup(email: string, password: string, name: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/signup', { email, password, name })
    return data
  },

  async getProfile() {
    const { data } = await api.get('/auth/profile')
    return data
  }
}