from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

class ProjectBase(SQLModel):
    title: str
    description: Optional[str] = None
    context_notes: Optional[str] = None
    roadmap_text: Optional[str] = None
    architecture_notes: Optional[str] = None
    start_date: datetime = Field(default_factory=datetime.utcnow)
    deadline: datetime

class Project(ProjectBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    tasks: List["Task"] = Relationship(back_populates="project")
    milestones: List["Milestone"] = Relationship(back_populates="project")
    behavior_logs: List["BehaviorLog"] = Relationship(back_populates="project")

class MilestoneBase(SQLModel):
    title: str
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    weight: int = Field(default=3, ge=1, le=5)
    status: bool = Field(default=False)
    project_id: int = Field(foreign_key="project.id")

class Milestone(MilestoneBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    project: Project = Relationship(back_populates="milestones")

class BehaviorLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    task_id: Optional[int] = Field(default=None, foreign_key="task.id")
    action_type: str = "completion" # completion, work_session
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration_minutes: Optional[int] = None

    project: Project = Relationship(back_populates="behavior_logs")

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
    milestone_id: Optional[int] = Field(default=None, foreign_key="milestone.id")

class TaskDependency(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id")
    depends_on_id: int = Field(foreign_key="task.id")

class Task(TaskBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    project: Project = Relationship(back_populates="tasks")
    dependencies: List["Task"] = Relationship(
        link_model=TaskDependency,
        sa_relationship_kwargs={
            "primaryjoin": "Task.id==TaskDependency.task_id",
            "secondaryjoin": "Task.id==TaskDependency.depends_on_id",
        }
    )

class ProjectForecast(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    estimated_completion: datetime
    delay_probability: float
    confidence_score: float
    risk_trend: str # increasing, decreasing, stable
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ProjectRead(ProjectBase):
    id: int
    created_at: datetime

class MilestoneRead(MilestoneBase):
    id: int
    created_at: datetime

class TaskRead(TaskBase):
    id: int
    completed_at: Optional[datetime]
    created_at: datetime
    dependency_ids: List[int] = []

class ProjectDetail(ProjectRead):
    tasks: List[TaskRead] = []
    milestones: List[MilestoneRead] = []
    total_tasks: int = 0
    completed_tasks: int = 0
    completion_percentage: float = 0
    days_left: int = 0
    pace_status: str = "On Track"
    avg_tasks_per_day: float = 0
    risk_level: str = "Low"
    risk_score: int = 0
    # Phase 3 Fields
    critical_path: List[int] = []
    forecast_completion: Optional[datetime] = None
    delay_prob: float = 0
    bottlenecks: List[dict] = []
