from datetime import datetime, timezone
from typing import List
from models import Task, Project, ProjectDetail, TaskRead, MilestoneRead

from services import calculate_risk_model, score_task_v2
from graph_engine import GraphEngine
from forecasting import ForecastingModule
from logger import logger
from metrics import metrics

def calculate_project_stats(project: Project, session=None) -> ProjectDetail:
    now = datetime.utcnow()
    total_tasks = len(project.tasks)
    completed_tasks = [t for t in project.tasks if t.status]
    num_completed = len(completed_tasks)
    
    completion_percentage = (num_completed / total_tasks * 100) if total_tasks > 0 else 0
    
    days_left = (project.deadline.replace(tzinfo=None) - now).days
    days_passed = max(1, (now - project.start_date.replace(tzinfo=None)).days)
    avg_tasks_per_day = num_completed / days_passed
    
    # Risk calculation
    risk_score, risk_level = calculate_risk_model(project)
    
    # Phase 3: Dependency & Critical Path
    # Fetch dependencies from DB if session is available
    dependencies = []
    if session:
        from models import TaskDependency
        from sqlmodel import select
        # Extract task IDs
        tids = [t.id for t in project.tasks]
        if tids:
            deps_data = session.exec(select(TaskDependency).where(TaskDependency.task_id.in_(tids))).all()
            dependencies = [(d.task_id, d.depends_on_id) for d in deps_data]

    critical_path, cp_duration, slack = GraphEngine.calculate_critical_path(project.tasks, dependencies)
    
    # Phase 3: Forecasting
    forecast = ForecastingModule.calculate_forecast(project, cp_duration)
    
    # Phase 3: Bottlenecks
    bottlenecks = ForecastingModule.detect_bottlenecks(project.tasks, dependencies, slack)
    
    pace_status = "On Track"
    if risk_level == "High" or forecast["delay_probability"] > 50: pace_status = "Behind"
    elif risk_score < 20 and forecast["delay_probability"] < 10: pace_status = "Ahead"

    # Log top ranked tasks (Strategy Advisor hint)
    scored_tasks = []
    for t in project.tasks:
        if not t.status:
            metrics.increment("tasks_scored")
            score, _ = score_task_v2(t, project, available_hours=4.0) # Default 4h for logging
            scored_tasks.append((t.title, score))
    
    if scored_tasks:
        scored_tasks.sort(key=lambda x: x[1], reverse=True)
        top_task, top_score = scored_tasks[0]
        logger.info(f"Strategy: project={project.title}, top_task='{top_task}', score={top_score:.1f}")

    return ProjectDetail(
        **project.dict(),
        tasks=[TaskRead(**t.dict(), dependency_ids=[d[1] for d in dependencies if d[0] == t.id]) for t in project.tasks],
        milestones=[MilestoneRead(**m.dict()) for m in project.milestones],
        total_tasks=total_tasks,
        completed_tasks=num_completed,
        completion_percentage=round(completion_percentage, 2),
        days_left=max(0, days_left),
        pace_status=pace_status,
        avg_tasks_per_day=round(avg_tasks_per_day, 2),
        risk_level=risk_level,
        risk_score=risk_score,
        critical_path=critical_path,
        forecast_completion=forecast["estimated_completion"],
        delay_prob=forecast["delay_probability"],
        bottlenecks=bottlenecks
    )

def score_task(task: Task, available_hours: float) -> float:
    # Weights
    IMPACT_WEIGHT = 10
    EFFORT_WEIGHT = 5
    
    score = (IMPACT_WEIGHT * task.impact_score) - (EFFORT_WEIGHT * task.effort_score)
    
    # Urgency Bonus
    if task.deadline:
        now = datetime.utcnow()
        days_until = (task.deadline.replace(tzinfo=None) - now).days
        if days_until < 0:
            urgency_bonus = 100 # Overdue
        elif days_until <= 3:
            urgency_bonus = 50
        elif days_until <= 7:
            urgency_bonus = 20
        else:
            urgency_bonus = 0
        score += urgency_bonus
        
    # Time Fit Bonus
    if task.estimated_hours <= available_hours:
        score += 30
        
    return score
