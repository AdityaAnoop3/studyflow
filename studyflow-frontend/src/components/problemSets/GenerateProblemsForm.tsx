import { useState } from 'react'
import { problemSetService } from '../../services/problemSetService'

interface GenerateProblemsFormProps {
  problemSetId: string
  onProblemsGenerated: () => void
}

export default function GenerateProblemsForm({ problemSetId, onProblemsGenerated }: GenerateProblemsFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [subject, setSubject] = useState('')
  const [count, setCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await problemSetService.generateProblemsFromFile(
        problemSetId,
        file,
        subject,
        count
      )
      setSuccess(result.message)
      setFile(null)
      setSubject('')
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
      onProblemsGenerated()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate problems')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Generate Problems with AI</h3>
      <p className="text-sm text-gray-600 mb-4">
        Upload lecture notes (PDF or DOCX) and AI will generate practice problems automatically!
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Lecture Material
          </label>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Supported: PDF, DOCX (max 10MB)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject/Topic (Optional)
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Calculus, Physics, etc."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Problems
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? 'Generating Problems...' : 'Generate Problems'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
        <strong>Note:</strong> You'll need to set up a free Google Gemini API key in the backend for this to work.
      </div>
    </div>
  )
}