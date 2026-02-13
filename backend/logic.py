from datetime import datetime, timezone
from typing import List
from models import Task, Project, ProjectDetail, TaskRead

from services import calculate_risk_model

def calculate_project_stats(project: Project) -> ProjectDetail:
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
    
    pace_status = "On Track"
    if risk_level == "High": pace_status = "Behind"
    elif risk_score < 20: pace_status = "Ahead"

    return ProjectDetail(
        **project.dict(),
        tasks=[TaskRead(**t.dict()) for t in project.tasks],
        milestones=[MilestoneRead(**m.dict()) for m in project.milestones],
        total_tasks=total_tasks,
        completed_tasks=num_completed,
        completion_percentage=round(completion_percentage, 2),
        days_left=max(0, days_left),
        pace_status=pace_status,
        avg_tasks_per_day=round(avg_tasks_per_day, 2),
        risk_level=risk_level,
        risk_score=risk_score
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
