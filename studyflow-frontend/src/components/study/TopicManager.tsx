import { useState, useEffect } from 'react'
import { topicService, type Topic } from '../../services/topicService'

export default function TopicManager() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    loadTopics()
  }, [])

  const loadTopics = async () => {
    try {
      const data = await topicService.getTopics()
      setTopics(data)
    } catch (err) {
      setError('Failed to load topics')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (editingTopic) {
        await topicService.updateTopic(editingTopic.id, formData)
      } else {
        await topicService.createTopic(formData)
      }
      
      setFormData({ name: '', description: '' })
      setShowForm(false)
      setEditingTopic(null)
      loadTopics()
    } catch (err) {
      setError('Failed to save topic')
    }
  }

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic)
    setFormData({ name: topic.name, description: topic.description || '' })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this topic?')) {
      try {
        await topicService.deleteTopic(id)
        loadTopics()
      } catch (err) {
        setError('Failed to delete topic')
      }
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading topics...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Study Topics</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingTopic(null)
            setFormData({ name: '', description: '' })
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Topic'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            {editingTopic ? 'Edit Topic' : 'New Topic'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Topic Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingTopic ? 'Update' : 'Create'} Topic
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingTopic(null)
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {topics.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center py-8">
            No topics yet. Create your first topic to get started!
          </p>
        ) : (
          topics.map((topic) => (
            <div key={topic.id} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold">{topic.name}</h3>
              {topic.description && (
                <p className="text-gray-600 mt-1">{topic.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {topic._count?.studySessions || 0} study sessions
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(topic)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(topic.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}