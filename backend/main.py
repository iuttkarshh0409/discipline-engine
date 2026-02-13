from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from datetime import datetime
from typing import List, Optional

from database import engine, create_db_and_tables, get_session
from models import Project, ProjectBase, ProjectRead, Task, TaskBase, TaskRead, ProjectDetail, Milestone, MilestoneBase, MilestoneRead, BehaviorLog
from logic import calculate_project_stats
from services import calculate_analytics, calculate_risk_model, score_task_v2

app = FastAPI(title="Project Discipline Engine API - Phase 2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

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
    return calculate_project_stats(project)

# Multi-Context
@app.post("/projects/{project_id}/context")
def update_project_context(project_id: int, context_data: dict, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project: raise HTTPException(status_code=404)
    for key, value in context_data.items():
        if hasattr(project, key): setattr(project, key, value)
    session.add(project)
    session.commit()
    return {"status": "success"}

# Milestones
@app.post("/projects/{project_id}/milestones", response_model=MilestoneRead)
def create_milestone(project_id: int, milestone: MilestoneBase, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project: raise HTTPException(status_code=404)
    db_milestone = Milestone.from_orm(milestone)
    db_milestone.project_id = project_id
    session.add(db_milestone)
    session.commit()
    session.refresh(db_milestone)
    return db_milestone

@app.patch("/milestones/{milestone_id}/toggle", response_model=MilestoneRead)
def toggle_milestone(milestone_id: int, session: Session = Depends(get_session)):
    milestone = session.get(Milestone, milestone_id)
    if not milestone: raise HTTPException(status_code=404)
    milestone.status = not milestone.status
    session.add(milestone)
    session.commit()
    session.refresh(milestone)
    return milestone

# Tasks
@app.post("/projects/{project_id}/tasks", response_model=TaskRead)
def create_task(project_id: int, task: TaskBase, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project: raise HTTPException(status_code=404)
    db_task = Task.from_orm(task)
    db_task.project_id = project_id
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

@app.patch("/tasks/{task_id}/toggle", response_model=TaskRead)
def toggle_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task: raise HTTPException(status_code=404)
    task.status = not task.status
    if task.status:
        task.completed_at = datetime.utcnow()
        log = BehaviorLog(project_id=task.project_id, task_id=task.id, action_type="completion")
        session.add(log)
    else:
        task.completed_at = None
    session.add(task)
    session.commit()
    session.refresh(task)
    return task

# Advanced Intelligence
@app.get("/projects/{project_id}/analytics")
def get_analytics(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project: raise HTTPException(status_code=404)
    return calculate_analytics(project)

@app.get("/projects/{project_id}/risk")
def get_risk(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project: raise HTTPException(status_code=404)
    score, level = calculate_risk_model(project)
    return {"score": score, "level": level}

@app.get("/projects/{project_id}/suggest-next")
def suggest_next_task(
    project_id: int, 
    available_hours: float = Query(..., gt=0), 
    session: Session = Depends(get_session)
):
    project = session.get(Project, project_id)
    if not project: raise HTTPException(status_code=404)
    pending_tasks = [t for t in project.tasks if not t.status]
    if not pending_tasks: return None
    
    scored_tasks = []
    for t in pending_tasks:
        score, breakdown = score_task_v2(t, project, available_hours)
        scored_tasks.append({
            "task": TaskRead(**t.dict()),
            "score": score,
            "reasoning": breakdown
        })
    
    scored_tasks.sort(key=lambda x: x["score"], reverse=True)
    return scored_tasks[0]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
