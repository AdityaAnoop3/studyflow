# StudyFlow - Adaptive Learning Dashboard

A full-stack web application that uses spaced repetition algorithms and progress analytics to optimize study sessions and track learning progress.

## Features

- 🔐 **User Authentication** - Secure JWT-based authentication
- 📚 **Study Session Tracking** - Log study time, topics, and difficulty ratings
- 🧠 **Spaced Repetition System** - Smart review scheduling based on forgetting curves
- 📊 **Progress Analytics** - Visual dashboards showing study patterns and weak areas
- 📝 **Problem Sets** - Create and track practice problems with difficulty ratings
- 🎯 **Study Recommendations** - AI-powered suggestions for optimal study schedules

## Tech Stack

### Frontend
- React.js with TypeScript
- Vite for build tooling
- React Router for navigation
- Tailwind CSS for styling
- Recharts for data visualization
- Axios for API calls

### Backend
- Node.js with Express.js
- TypeScript
- PostgreSQL database
- Prisma ORM
- JWT authentication
- bcrypt for password hashing

### Python Microservice (Coming Soon)
- FastAPI
- Advanced spaced repetition algorithms
- Statistical analysis for study patterns

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Python 3.8+ (for microservice)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/studyflow.git
cd studyflow
```

2. Install frontend dependencies:
```bash
cd studyflow-frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../studyflow-backend
npm install
```

4. Set up the database:
```bash
# Create database and run migrations
npx prisma migrate dev
```

5. Configure environment variables:
- Copy `.env.example` to `.env` in both frontend and backend directories
- Update with your database credentials and JWT secret

### Running the Application

1. Start PostgreSQL

2. Start the backend (port 5001):
```bash
cd studyflow-backend
npm run dev
```

3. Start the frontend (port 5173):
```bash
cd studyflow-frontend
npm run dev
```

4. Access the application at `http://localhost:5173`

## Project Structure

```
studyflow/
├── studyflow-frontend/     # React frontend
├── studyflow-backend/      # Node.js backend
├── studyflow-python-service/ # Python microservice (WIP)
└── README.md
```

## License

MIT License - see LICENSE file for details

## Author

Aditya Anoop Nair