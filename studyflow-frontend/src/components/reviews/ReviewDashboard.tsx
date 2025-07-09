import { useState, useEffect } from 'react'
import { reviewService, type Review, type ReviewStats } from '../../services/reviewService'
import { format } from 'date-fns'

export default function ReviewDashboard() {
  const [dueReviews, setDueReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentReview, setCurrentReview] = useState<Review | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      const [reviews, reviewStats] = await Promise.all([
        reviewService.getDueReviews(),
        reviewService.getReviewStats()
      ])
      setDueReviews(reviews)
      setStats(reviewStats)
      if (reviews.length > 0) {
        setCurrentReview(reviews[0])
      }
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewComplete = async (quality: number) => {
    if (!currentReview) return

    try {
      await reviewService.completeReview(currentReview.id, { quality })
      
      // Move to next review
      const remainingReviews = dueReviews.filter(r => r.id !== currentReview.id)
      setDueReviews(remainingReviews)
      setCurrentReview(remainingReviews[0] || null)
      setShowAnswer(false)
      
      // Reload stats
      const newStats = await reviewService.getReviewStats()
      setStats(newStats)
    } catch (err) {
      console.error('Failed to complete review:', err)
    }
  }

  const handleSkip = async () => {
    if (!currentReview) return

    try {
      await reviewService.skipReview(currentReview.id, 1)
      
      // Move to next review
      const remainingReviews = dueReviews.filter(r => r.id !== currentReview.id)
      setDueReviews(remainingReviews)
      setCurrentReview(remainingReviews[0] || null)
      setShowAnswer(false)
    } catch (err) {
      console.error('Failed to skip review:', err)
    }
  }

  const getQualityLabel = (quality: number) => {
    const labels = [
      'Complete blackout',
      'Incorrect, but familiar',
      'Incorrect, but easy to recall',
      'Correct, with hesitation',
      'Correct, with some effort',
      'Perfect response'
    ]
    return labels[quality] || ''
  }

  const getQualityColor = (quality: number) => {
    if (quality <= 1) return 'bg-red-100 text-red-800 hover:bg-red-200'
    if (quality <= 2) return 'bg-orange-100 text-orange-800 hover:bg-orange-200'
    if (quality <= 3) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
    if (quality <= 4) return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    return 'bg-green-100 text-green-800 hover:bg-green-200'
  }

  if (loading) {
    return <div className="text-center py-8">Loading reviews...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Due Today</h3>
            <p className="text-2xl font-bold mt-2 text-red-600">{stats.dueToday}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Due Tomorrow</h3>
            <p className="text-2xl font-bold mt-2 text-orange-600">{stats.dueTomorrow}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Due This Week</h3>
            <p className="text-2xl font-bold mt-2 text-yellow-600">{stats.dueThisWeek}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Completed</h3>
            <p className="text-2xl font-bold mt-2 text-green-600">{stats.totalCompleted}</p>
          </div>
        </div>
      )}

      {/* Review Interface */}
      {currentReview ? (
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Review: {currentReview.topic.name}</h2>
              <span className="text-sm text-gray-500">
                {currentReview.daysOverdue! > 0 
                  ? `${currentReview.daysOverdue} days overdue`
                  : 'Due today'
                }
              </span>
            </div>
            
            {currentReview.topic.description && (
              <p className="text-gray-600 mb-4">{currentReview.topic.description}</p>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Last studied:</strong> {
                  currentReview.studySession
                    ? format(new Date(currentReview.studySession.completedAt), 'PPP')
                    : 'Not studied yet'
                }
              </p>
              <p className="text-sm text-gray-600">
                <strong>Review interval:</strong> {currentReview.interval} days
              </p>
              <p className="text-sm text-gray-600">
                <strong>Repetitions:</strong> {currentReview.repetitions}
              </p>
            </div>
          </div>

          {!showAnswer ? (
            <div className="text-center">
              <p className="text-lg mb-6">
                Try to recall everything you know about this topic.
              </p>
              <button
                onClick={() => setShowAnswer(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-lg font-medium"
              >
                Show Answer
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-t pt-6">
                <p className="text-lg mb-6">
                  How well did you recall this topic?
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[0, 1, 2, 3, 4, 5].map(quality => (
                    <button
                      key={quality}
                      onClick={() => handleReviewComplete(quality)}
                      className={`p-4 rounded-lg border-2 text-center transition-colors ${getQualityColor(quality)}`}
                    >
                      <div className="font-bold text-lg mb-1">{quality}</div>
                      <div className="text-sm">{getQualityLabel(quality)}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              onClick={handleSkip}
              className="text-gray-600 hover:text-gray-800"
            >
              Skip for today
            </button>
            <div className="text-sm text-gray-500">
              {dueReviews.length - 1} more reviews remaining
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-xl font-semibold mb-4">All caught up!</h2>
          <p className="text-gray-600">
            You've completed all your reviews for today. Great job! 🎉
          </p>
        </div>
      )}

      {/* Due Reviews List */}
      {dueReviews.length > 1 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Upcoming Reviews</h3>
          <div className="space-y-2">
            {dueReviews.slice(1).map(review => (
              <div key={review.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{review.topic.name}</p>
                  <p className="text-sm text-gray-500">
                    {review.daysOverdue! > 0 
                      ? `${review.daysOverdue} days overdue`
                      : 'Due today'
                    }
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Interval: {review.interval} days
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}