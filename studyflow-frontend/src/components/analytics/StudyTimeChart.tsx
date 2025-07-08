import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'

interface StudyTimeChartProps {
  data: Array<{
    date: string
    minutes: number
    sessions: number
  }>
}

export default function StudyTimeChart({ data }: StudyTimeChartProps) {
  // Format data for display
  const formattedData = data.map(item => ({
    ...item,
    displayDate: format(new Date(item.date), 'MMM d'),
    hours: Number((item.minutes / 60).toFixed(1))
  }))

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Daily Study Time</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="displayDate" />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 border rounded shadow">
                      <p className="font-medium">{data.displayDate}</p>
                      <p className="text-sm">Time: {data.hours} hours ({data.minutes} min)</p>
                      <p className="text-sm">Sessions: {data.sessions}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="hours" fill="#3B82F6" name="Hours" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}