import { useState, useEffect } from 'react'
import { problemSetService, type ProblemSet } from '../../services/problemSetService'
import { Link } from 'react-router-dom'

export default function ProblemSetManager() {
  const [problemSets, setProblemSets] = useState<ProblemSet[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSet, setEditingSet] = useState<ProblemSet | null>(null)
  const [formData, setFormData] = useState({ title: '', description: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    loadProblemSets()
  }, [])

  const loadProblemSets = async () => {
    try {
      const data = await problemSetService.getProblemSets()
      setProblemSets(data)
    } catch (err) {
      setError('Failed to load problem sets')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (editingSet) {
        await problemSetService.updateProblemSet(editingSet.id, formData)
      } else {
        await problemSetService.createProblemSet(formData)
      }
      
      setFormData({ title: '', description: '' })
      setShowForm(false)
      setEditingSet(null)
      loadProblemSets()
    } catch (err) {
      setError('Failed to save problem set')
    }
  }

  const handleEdit = (set: ProblemSet) => {
    setEditingSet(set)
    setFormData({ title: set.title, description: set.description || '' })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this problem set?')) {
      try {
        await problemSetService.deleteProblemSet(id)
        loadProblemSets()
      } catch (err) {
        setError('Failed to delete problem set')
      }
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading problem sets...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Problem Sets</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingSet(null)
            setFormData({ title: '', description: '' })
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Create Problem Set'}
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
            {editingSet ? 'Edit Problem Set' : 'New Problem Set'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                {editingSet ? 'Update' : 'Create'} Problem Set
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingSet(null)
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
        {problemSets.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center py-8">
            No problem sets yet. Create your first problem set to practice!
          </p>
        ) : (
          problemSets.map((set) => (
            <div key={set.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold">{set.title}</h3>
              {set.description && (
                <p className="text-gray-600 mt-1">{set.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {set._count?.problems || 0} problems
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  to={`/problem-sets/${set.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Problems
                </Link>
                <button
                  onClick={() => handleEdit(set)}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(set.id)}
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