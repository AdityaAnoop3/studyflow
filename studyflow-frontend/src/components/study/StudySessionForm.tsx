import { useState, useEffect } from 'react'
import { topicService, type Topic } from '../../services/topicService'
import { studySessionService } from '../../services/studySessionService'

interface StudySessionFormProps {
  onSessionCreated: () => void
}

export default function StudySessionForm({ onSessionCreated }: StudySessionFormProps) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [formData, setFormData] = useState({
    topicId: '',
    duration: 30,
    difficulty: 3,
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadTopics()
  }, [])

  const loadTopics = async () => {
    try {
      const data = await topicService.getTopics()
      setTopics(data)
      if (data.length > 0 && !formData.topicId) {
        setFormData(prev => ({ ...prev, topicId: data[0].id }))
      }
    } catch (err) {
      setError('Failed to load topics')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await studySessionService.createSession(formData)
      // Reset form
      setFormData({
        topicId: topics[0]?.id || '',
        duration: 30,
        difficulty: 3,
        notes: ''
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      onSessionCreated()
    } catch (err) {
      setError('Failed to create study session')
    } finally {
      setLoading(false)
    }
  }

  if (topics.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        You need to create a topic first before logging study sessions.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
      <h3 className="text-lg font-semibold">Log Study Session</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
          Session logged successfully!
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Topic</label>
        <select
          value={formData.topicId}
          onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          {topics.map(topic => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Duration (minutes)
        </label>
        <input
          type="number"
          min="1"
          max="480"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Difficulty (1-5)
        </label>
        <div className="mt-2 flex gap-4">
          {[1, 2, 3, 4, 5].map(level => (
            <label key={level} className="flex items-center">
              <input
                type="radio"
                name="difficulty"
                value={level}
                checked={formData.difficulty === level}
                onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                className="mr-1"
              />
              <span className={`px-2 py-1 rounded ${
                level <= 2 ? 'bg-green-100 text-green-800' :
                level === 3 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {level}
              </span>
            </label>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          1 = Very Easy, 5 = Very Difficult
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Notes (Optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="What did you study? Any key takeaways?"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Log Session'}
      </button>
    </form>
  )
}