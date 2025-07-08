import { useState, useEffect } from 'react'
import { studySessionService, type StudySession } from '../../services/studySessionService'
import { format } from 'date-fns'

export default function RecentSessions() {
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const data = await studySessionService.getSessions(10, 0)
      setSessions(data.sessions)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'text-green-600 bg-green-50'
    if (difficulty === 3) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (loading) {
    return <div className="text-center py-4">Loading sessions...</div>
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No study sessions yet. Start studying to see your progress!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recent Sessions</h3>
        <span className="text-sm text-gray-500">Total: {total} sessions</span>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium">{session.topic.name}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(session.completedAt), 'PPp')}
                </p>
                {session.notes && (
                  <p className="text-sm text-gray-600 mt-2">{session.notes}</p>
                )}
              </div>
              <div className="flex gap-3 items-center ml-4">
                <span className="text-sm font-medium">
                  {formatDuration(session.duration)}
                </span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(session.difficulty)}`}>
                  Level {session.difficulty}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sessions.length < total && (
        <div className="text-center pt-4">
          <button className="text-blue-600 hover:text-blue-800">
            Load more sessions
          </button>
        </div>
      )}
    </div>
  )
}