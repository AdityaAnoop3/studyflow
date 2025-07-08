import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface TopicBreakdownChartProps {
  data: Array<{
    topic: string
    minutes: number
    sessions: number
    avgDifficulty: number
  }>
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function TopicBreakdownChart({ data }: TopicBreakdownChartProps) {
  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.minutes, 0)
  
  const formattedData = data.map((item, index) => ({
    ...item,
    hours: Number((item.minutes / 60).toFixed(1)),
    percentage: ((item.minutes / total) * 100).toFixed(1),
    color: COLORS[index % COLORS.length]
  }))

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Time by Topic</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ topic, percentage }) => `${topic} (${percentage}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="minutes"
            >
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 border rounded shadow">
                      <p className="font-medium">{data.topic}</p>
                      <p className="text-sm">Time: {data.hours} hours</p>
                      <p className="text-sm">Sessions: {data.sessions}</p>
                      <p className="text-sm">Avg Difficulty: {data.avgDifficulty.toFixed(1)}</p>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}