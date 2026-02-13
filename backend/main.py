from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from datetime import datetime
from typing import List, Optional

from database import engine, create_db_and_tables, get_session
from models import Project, ProjectBase, ProjectRead, Task, TaskBase, TaskRead, ProjectDetail
from logic import calculate_project_stats, score_task

app = FastAPI(title="Project Discipline Engine API")

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

# Tasks
@app.post("/projects/{project_id}/tasks", response_model=TaskRead)
def create_task(project_id: int, task: TaskBase, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db_task = Task.from_orm(task)
    db_task.project_id = project_id
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

@app.patch("/tasks/{task_id}/toggle", response_model=TaskRead)
def toggle_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = not task.status
    if task.status:
        task.completed_at = datetime.utcnow()
    else:
        task.completed_at = None
        
    session.add(task)
    session.commit()
    session.refresh(task)
    return task

@app.get("/projects/{project_id}/suggest-next", response_model=Optional[TaskRead])
def suggest_next_task(
    project_id: int, 
    available_hours: float = Query(..., gt=0), 
    session: Session = Depends(get_session)
):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    pending_tasks = [t for t in project.tasks if not t.status]
    if not pending_tasks:
        return None
    
    # Sort tasks by score
    scored_tasks = []
    for t in pending_tasks:
        score = score_task(t, available_hours)
        scored_tasks.append((score, t))
    
    scored_tasks.sort(key=lambda x: x[0], reverse=True)
    return scored_tasks[0][1]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
