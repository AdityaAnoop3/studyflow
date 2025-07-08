import ProblemSetManager from '../components/problemSets/ProblemSetManager'

export default function ProblemSetsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Practice Problems</h1>
      <ProblemSetManager />
    </div>
  )
}