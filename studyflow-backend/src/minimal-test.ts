console.log('Script started')

import express from 'express'

console.log('Express imported')

const app = express()

app.get('/', (_req, res) => {
  res.send('Working!')
})

console.log('Routes defined')

const server = app.listen(5000, () => {
  console.log('Server started on port 5000')
})

console.log('Listen called')

// Use the server variable to avoid unused variable error
server.on('error', (err) => {
  console.error('Server error:', err)
})

// This should definitely keep it running
setInterval(() => {
  console.log('Server still running...')
}, 5000)