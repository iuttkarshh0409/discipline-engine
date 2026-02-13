from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

class ProjectBase(SQLModel):
    title: str
    description: Optional[str] = None
    start_date: datetime = Field(default_factory=datetime.utcnow)
    deadline: datetime

class Project(ProjectBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    tasks: List["Task"] = Relationship(back_populates="project")

class TaskBase(SQLModel):
    title: str
    description: Optional[str] = None
    guidance: Optional[str] = None
    estimated_hours: float
    impact_score: int = Field(ge=1, le=5)
    effort_score: int = Field(ge=1, le=5)
    deadline: Optional[datetime] = None
    status: bool = Field(default=False)
    project_id: int = Field(foreign_key="project.id")

class Task(TaskBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    project: Project = Relationship(back_populates="tasks")

class ProjectRead(ProjectBase):
    id: int
    created_at: datetime

class TaskRead(TaskBase):
    id: int
    completed_at: Optional[datetime]
    created_at: datetime

class ProjectDetail(ProjectRead):
    tasks: List[TaskRead] = []
    total_tasks: int = 0
    completed_tasks: int = 0
    completion_percentage: float = 0
    days_left: int = 0
    pace_status: str = "On Track" # Ahead, On Track, Behind
    avg_tasks_per_day: float = 0
