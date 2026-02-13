# Deployment Guide: Project Discipline Engine

This guide outlines the steps to move from local development to a live production environment.

## 1. Frontend (Netlify)
Netlify will host your React dashboard. 

### Deployment Settings:
- **Repository:** `https://github.com/iuttkarshh0409/discipline-engine.git`
- **Branch to deploy:** `main`
- **Base directory:** `frontend`
- **Build command:** `npm install; npm run build`
- **Publish directory:** `dist`

### Environment Variables:
Add the following in Netlify (Site Settings > Environment variables):
- `VITE_API_BASE`: `[YOUR_BACKEND_LIVE_URL]` (e.g., https://discipline-api.onrender.com)

---

## 2. Backend (Render / Railway)
Since the backend uses a persistent server (FastAPI) and needs to handle requests, use Render.com or Railway.app.

### Render.com Settings:
- **Service Type:** Web Service
- **Root Directory:** `backend`
- **Runtime:** `Python 3`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:**
  - `DATABASE_URL`: `sqlite:///./discipline.db` (For MVP/Testing)
  - *Note: For true production, consider a managed Postgres instance.*

---

## 3. Post-Deployment Checklist
1. **CORS Policy**: Ensure the backend `main.py` has `allow_origins=["*"]` or specifically lists your Netlify URL.
2. **Database**: If using SQLite, data will reset on every server restart on free tiers. Link a persistent disk or use a Managed Postgres database.
3. **Connect**: Verify that the `VITE_API_BASE` variable in Netlify exactly matches your backend URL.
