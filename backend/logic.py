from datetime import datetime, timezone
from typing import List
from models import Task, Project, ProjectDetail, TaskRead

def calculate_project_stats(project: Project) -> ProjectDetail:
    now = datetime.utcnow()
    total_tasks = len(project.tasks)
    completed_tasks = [t for t in project.tasks if t.status]
    num_completed = len(completed_tasks)
    
    completion_percentage = (num_completed / total_tasks * 100) if total_tasks > 0 else 0
    
    days_left = (project.deadline.replace(tzinfo=None) - now).days
    days_total = (project.deadline.replace(tzinfo=None) - project.start_date.replace(tzinfo=None)).days
    days_passed = (now - project.start_date.replace(tzinfo=None)).days
    
    if days_passed <= 0:
        days_passed = 1 # Avoid division by zero
        
    avg_tasks_per_day = num_completed / days_passed
    
    # Pace calculation
    remaining_tasks = total_tasks - num_completed
    if days_left > 0:
        required_pace = remaining_tasks / days_left
    else:
        required_pace = remaining_tasks if remaining_tasks > 0 else 0
        
    if remaining_tasks == 0:
        pace_status = "On Track"
    elif days_left <= 0:
        pace_status = "Behind"
    elif avg_tasks_per_day >= required_pace:
        pace_status = "Ahead"
    elif avg_tasks_per_day >= required_pace * 0.8:
        pace_status = "On Track"
    else:
        pace_status = "Behind"

    return ProjectDetail(
        **project.dict(),
        tasks=[TaskRead(**t.dict()) for t in project.tasks],
        total_tasks=total_tasks,
        completed_tasks=num_completed,
        completion_percentage=round(completion_percentage, 2),
        days_left=max(0, days_left),
        pace_status=pace_status,
        avg_tasks_per_day=round(avg_tasks_per_day, 2)
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
