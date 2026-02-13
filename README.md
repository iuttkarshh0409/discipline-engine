# Project Discipline Engine MVP

A personal project execution dashboard that tracks progress, calculates pace, and suggests the next best task based on impact, effort, and available time.

## Tech Stack
- **Backend:** FastAPI, SQLModel (SQLAlchemy + Pydantic), PostgreSQL
- **Frontend:** React (Vite), Lucide Icons, Premium CSS (Glassmorphism)

## Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL (or change `DATABASE_URL` in `backend/database.py` to SQLite)

## Getting Started

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set your PostgreSQL connection string in `backend/database.py` or create a `.env` file:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/discipline_db
   ```
   *Note: If you don't have Postgres, you can uncomment the SQLite line in `database.py`.*

4. Run the server:
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`.

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to the URL shown in the terminal (usually `http://localhost:5173`).

## Core Logic: Task Suggestion
The "Next Best Action" tool uses a scoring algorithm:
`Score = (Impact × 10) - (Effort × 5) + Urgency Bonus + Time Fit Bonus`
- **Urgency Bonus:** Heavily weights tasks that are overdue or due within 3 days.
- **Time Fit Bonus:** Rewards tasks that can be completed within your specified available hours.
