import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { problemSetService, type ProblemSet, type Problem } from '../services/problemSetService'
import GenerateProblemsForm from '../components/problemSets/GenerateProblemsForm'

export default function ProblemSetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [problemSet, setProblemSet] = useState<ProblemSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    difficulty: 3
  })
  const [error, setError] = useState('')
  const [practiceMode, setPracticeMode] = useState(false)
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    if (id) {
      loadProblemSet()
    }
  }, [id])

  const loadProblemSet = async () => {
    try {
      const data = await problemSetService.getProblemSetById(id!)
      setProblemSet(data)
    } catch (err) {
      setError('Failed to load problem set')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (editingProblem) {
        await problemSetService.updateProblem(id!, editingProblem.id, formData)
      } else {
        await problemSetService.addProblem(id!, formData)
      }
      
      setFormData({ question: '', answer: '', difficulty: 3 })
      setShowForm(false)
      setEditingProblem(null)
      loadProblemSet()
    } catch (err) {
      setError('Failed to save problem')
    }
  }

  const handleEdit = (problem: Problem) => {
    setEditingProblem(problem)
    setFormData({
      question: problem.question,
      answer: problem.answer,
      difficulty: problem.difficulty
    })
    setShowForm(true)
  }

  const handleDelete = async (problemId: string) => {
    if (confirm('Are you sure you want to delete this problem?')) {
      try {
        await problemSetService.deleteProblem(id!, problemId)
        loadProblemSet()
      } catch (err) {
        setError('Failed to delete problem')
      }
    }
  }

  const handleAttempt = async (problemId: string, success: boolean) => {
    try {
      await problemSetService.recordAttempt(problemId, success)
      loadProblemSet()
    } catch (err) {
      console.error('Failed to record attempt')
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-100 text-green-800'
    if (difficulty === 3) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!problemSet) {
    return <div className="text-center py-8">Problem set not found</div>
  }

  const currentProblem = problemSet.problems?.[currentProblemIndex]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/problem-sets" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Problem Sets
          </Link>
          <h1 className="text-3xl font-bold mt-2">{problemSet.title}</h1>
          {problemSet.description && (
            <p className="text-gray-600 mt-1">{problemSet.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {problemSet.problems && problemSet.problems.length > 0 && (
            <button
              onClick={() => {
                setPracticeMode(!practiceMode)
                setCurrentProblemIndex(0)
                setShowAnswer(false)
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {practiceMode ? 'Exit Practice' : 'Practice Mode'}
            </button>
          )}
          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditingProblem(null)
              setFormData({ question: '', answer: '', difficulty: 3 })
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Problem'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!practiceMode && (
        <GenerateProblemsForm 
          problemSetId={id!} 
          onProblemsGenerated={loadProblemSet}
        />
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            {editingProblem ? 'Edit Problem' : 'New Problem'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Question
              </label>
              <textarea
                required
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Answer
              </label>
              <textarea
                required
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Difficulty (1-5)
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5].map(level => (
                  <option key={level} value={level}>
                    Level {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingProblem ? 'Update' : 'Add'} Problem
              </button>
            </div>
          </div>
        </form>
      )}

      {practiceMode && currentProblem ? (
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Problem {currentProblemIndex + 1} of {problemSet.problems!.length}
            </h3>
            <span className={`px-3 py-1 rounded text-sm font-medium ${getDifficultyColor(currentProblem.difficulty)}`}>
              Difficulty: {currentProblem.difficulty}
            </span>
          </div>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Question:</h4>
              <p className="text-lg">{currentProblem.question}</p>
            </div>

            {showAnswer && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-2">Answer:</h4>
                <p className="text-lg">{currentProblem.answer}</p>
                
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      handleAttempt(currentProblem.id, true)
                      if (currentProblemIndex < problemSet.problems!.length - 1) {
                        setCurrentProblemIndex(prev => prev + 1)
                        setShowAnswer(false)
                      } else {
                        setPracticeMode(false)
                      }
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Got it Right
                  </button>
                  <button
                    onClick={() => {
                      handleAttempt(currentProblem.id, false)
                      if (currentProblemIndex < problemSet.problems!.length - 1) {
                        setCurrentProblemIndex(prev => prev + 1)
                        setShowAnswer(false)
                      } else {
                        setPracticeMode(false)
                      }
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Got it Wrong
                  </button>
                </div>
              </div>
            )}

            {!showAnswer && (
              <button
                onClick={() => setShowAnswer(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Show Answer
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {problemSet.problems?.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No problems yet. Add your first problem to start practicing!
            </p>
          ) : (
            problemSet.problems?.map((problem) => (
              <div key={problem.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Question:</h4>
                    <p className="text-gray-700 mb-4">{problem.question}</p>
                    <h4 className="font-medium mb-2">Answer:</h4>
                    <p className="text-gray-700">{problem.answer}</p>
                    
                    {problem.attempts > 0 && (
                      <div className="mt-4 text-sm text-gray-500">
                        Success rate: {((problem.successes / problem.attempts) * 100).toFixed(0)}% 
                        ({problem.successes}/{problem.attempts} attempts)
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex items-start gap-2">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
                      Level {problem.difficulty}
                    </span>
                    <button
                      onClick={() => handleEdit(problem)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(problem.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}