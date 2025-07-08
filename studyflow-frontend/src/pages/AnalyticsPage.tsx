import { useState, useEffect } from 'react'
import { analyticsService } from '../services/analyticsService'
import StudyTimeChart from '../components/analytics/StudyTimeChart'
import TopicBreakdownChart from '../components/analytics/TopicBreakdownChart'
import DifficultyTrendChart from '../components/analytics/DifficultyTrendChart'

export default function AnalyticsPage() {
  const [dailyData, setDailyData] = useState<any[]>([])
  const [topicData, setTopicData] = useState<any[]>([])
  const [difficultyData, setDifficultyData] = useState<any[]>([])
  const [streakData, setStreakData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(7)

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [daily, topics, difficulty, streak] = await Promise.all([
        analyticsService.getDailyStudyTime(timeRange),
        analyticsService.getTopicBreakdown(),
        analyticsService.getDifficultyTrend(30),
        analyticsService.getStudyStreak()
      ])
      
      setDailyData(daily)
      setTopicData(topics)
      setDifficultyData(difficulty)
      setStreakData(streak)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(parseInt(e.target.value))}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* Streak Stats */}
      {streakData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Current Streak</h3>
            <p className="text-2xl font-bold mt-2 text-blue-600">
              {streakData.currentStreak} days
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Longest Streak</h3>
            <p className="text-2xl font-bold mt-2 text-green-600">
              {streakData.longestStreak} days
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Study Days</h3>
            <p className="text-2xl font-bold mt-2 text-purple-600">
              {streakData.studyDays.length} days
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudyTimeChart data={dailyData} />
        <TopicBreakdownChart data={topicData} />
      </div>

      <DifficultyTrendChart data={difficultyData} />

      {/* Study Calendar */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Study Calendar</h3>
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
          {generateCalendarDays(streakData?.studyDays || []).map((day, index) => (
            <div
              key={index}
              className={`aspect-square flex items-center justify-center text-sm rounded ${
                day.studied
                  ? 'bg-green-500 text-white font-medium'
                  : day.isToday
                  ? 'bg-blue-100 text-blue-800'
                  : day.date
                  ? 'bg-gray-50 text-gray-400'
                  : ''
              }`}
            >
              {day.date ? new Date(day.date).getDate() : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper function to generate calendar days
function generateCalendarDays(studyDays: string[]) {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  
  const days = []
  const studyDaySet = new Set(studyDays)
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({ date: null, studied: false, isToday: false })
  }
  
  // Add all days of the month
  for (let date = 1; date <= lastDay.getDate(); date++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    days.push({
      date: dateStr,
      studied: studyDaySet.has(dateStr),
      isToday: date === today.getDate()
    })
  }
  
  return days
}