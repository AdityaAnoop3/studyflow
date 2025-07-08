import { useState } from 'react'
import TopicManager from '../components/study/TopicManager'
import StudySessionForm from '../components/study/StudySessionForm'
import RecentSessions from '../components/study/RecentSessions'

export default function StudySessionPage() {
  const [activeTab, setActiveTab] = useState<'topics' | 'sessions'>('sessions')
  const [refreshSessions, setRefreshSessions] = useState(0)

  const handleSessionCreated = () => {
    // Force refresh of recent sessions
    setRefreshSessions(prev => prev + 1)
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Study Sessions</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Log Session
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'topics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manage Topics
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'sessions' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <StudySessionForm onSessionCreated={handleSessionCreated} />
          </div>
          <div>
            <RecentSessions key={refreshSessions} />
          </div>
        </div>
      ) : (
        <TopicManager />
      )}
    </div>
  )
}