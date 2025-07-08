import { useState, useEffect } from 'react'
import { studySessionService, type StudyStats } from '../services/studySessionService'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<StudyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await studySessionService.getStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Study Time</h3>
            <p className="text-2xl font-bold mt-2">{stats.totalHours} hours</p>
            <p className="text-sm text-gray-500">{stats.totalMinutes} minutes</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Study Streak</h3>
            <p className="text-2xl font-bold mt-2">{stats.streak} days</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
            <p className="text-2xl font-bold mt-2">{stats.totalSessions}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Upcoming Reviews</h3>
            <p className="text-2xl font-bold mt-2">{stats.upcomingReviews}</p>
            <p className="text-sm text-gray-500">Next 7 days</p>
          </div>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="space-y-2">
          <a href="/study" className="block p-4 border rounded hover:bg-gray-50">
            Start a Study Session →
          </a>
          <a href="/analytics" className="block p-4 border rounded hover:bg-gray-50">
            View Detailed Analytics →
          </a>
        </div>
      </div>
    </div>
  )
}