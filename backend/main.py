from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, select
from datetime import datetime
from typing import List, Optional

from database import engine, create_db_and_tables, get_session
from models import Project, ProjectBase, ProjectRead, Task, TaskBase, TaskRead, ProjectDetail, Milestone, MilestoneBase, MilestoneRead, BehaviorLog, TaskDependency
from logic import calculate_project_stats
from services import calculate_analytics, calculate_risk_model, score_task_v2

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(title="Project Discipline Engine API - Phase 3", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Projects
@app.post("/projects", response_model=ProjectRead)
def create_project(project: ProjectBase, session: Session = Depends(get_session)):
    db_project = Project.from_orm(project)
    session.add(db_project)
    session.commit()
    session.refresh(db_project)
    return db_project

@app.get("/projects", response_model=List[ProjectRead])
def read_projects(session: Session = Depends(get_session)):
    projects = session.exec(select(Project)).all()
    return projects

@app.get("/projects/{project_id}", response_model=ProjectDetail)
def read_project(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return calculate_project_stats(project, session=session)

# Phase 3: Dependencies
@app.post("/tasks/{task_id}/dependencies")
def add_dependency(task_id: int, depends_on_id: int, session: Session = Depends(get_session)):
    dep = TaskDependency(task_id=task_id, depends_on_id=depends_on_id)
    session.add(dep)
    session.commit()
    return {"status": "success"}

@app.get("/projects/{project_id}/critical-path")
def get_critical_path(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project: raise HTTPException(status_code=404)
    stats = calculate_project_stats(project, session=session)
    return {
        "critical_path": stats.critical_path,
        "tasks": [TaskRead(**t.dict()) for t in project.tasks if t.id in stats.critical_path]
    }

@app.get("/projects/{project_id}/forecast")
def get_forecast(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project: raise HTTPException(status_code=404)
    stats = calculate_project_stats(project, session=session)
    return {
        "estimated_completion": stats.forecast_completion,
        "delay_probability": stats.delay_prob
    }

@app.get("/projects/{project_id}/bottlenecks")
def get_bottlenecks(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project: raise HTTPException(status_code=404)
    stats = calculate_project_stats(project, session=session)
    return stats.bottlenecks

# Phase 3: AI Integration
from ai_integration import AIService

class PlanInput(SQLModel):
    text: str

@app.post("/projects/{project_id}/auto-structure-plan")
def auto_structure_plan(project_id: int, plan: PlanInput, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project: raise HTTPException(status_code=404)
    structured_data = AIService.structure_plan(project_id, plan.text)
    return structured_data

@app.post("/projects/{project_id}/advisor")
def get_ai_advice(project_id: int, available_hours: float, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project: raise HTTPException(status_code=404)
    stats = calculate_project_stats(project, session=session)
    advice = AIService.get_advice(stats.dict(), available_hours)
    return advice

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
