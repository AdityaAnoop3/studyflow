import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface DifficultyTrendChartProps {
  data: Array<{
    date: string
    avgDifficulty: number
  }>
}

export default function DifficultyTrendChart({ data }: DifficultyTrendChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    displayDate: format(new Date(item.date), 'MMM d')
  }))

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Difficulty Trend</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="displayDate" />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 border rounded shadow">
                      <p className="font-medium">{data.displayDate}</p>
                      <p className="text-sm">Avg Difficulty: {data.avgDifficulty}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Line 
              type="monotone" 
              dataKey="avgDifficulty" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm text-gray-500 mt-2 text-center">
        1 = Very Easy, 5 = Very Difficult
      </p>
    </div>
  )
}