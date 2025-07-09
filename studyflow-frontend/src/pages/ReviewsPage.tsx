import ReviewDashboard from '../components/reviews/ReviewDashboard'

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Spaced Repetition Reviews</h1>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How Spaced Repetition Works</h3>
        <p className="text-sm text-blue-800">
          Reviews are scheduled based on the SM-2 algorithm. The better you recall a topic, 
          the longer the interval before the next review. This optimizes your learning by 
          reviewing just before you would forget.
        </p>
      </div>
      <ReviewDashboard />
    </div>
  )
}