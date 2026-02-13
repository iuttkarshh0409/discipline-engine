from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from models import Project, Task, Milestone, BehaviorLog

def calculate_risk_model(project: Project) -> Tuple[int, str]:
    now = datetime.utcnow()
    total_tasks = len(project.tasks)
    completed_tasks = [t for t in project.tasks if t.status]
    num_completed = len(completed_tasks)
    remaining_tasks = total_tasks - num_completed
    
    if total_tasks == 0:
        return 0, "Low"
    
    days_left = (project.deadline.replace(tzinfo=None) - now).days
    days_total = (project.deadline.replace(tzinfo=None) - project.start_date.replace(tzinfo=None)).days
    days_passed = (now - project.start_date.replace(tzinfo=None)).days
    
    if days_passed <= 0: days_passed = 1
    current_velocity = num_completed / days_passed # tasks per day
    
    if days_left <= 0:
        return 100, "High" if remaining_tasks > 0 else 0
    
    required_velocity = remaining_tasks / days_left
    
    # Risk Factor 1: Velocity Gap
    velocity_ratio = required_velocity / current_velocity if current_velocity > 0 else 2.0
    
    # Risk Factor 2: Timeline Pressure
    timeline_consumed = days_passed / days_total if days_total > 0 else 0.5
    
    # Simple Risk formula
    risk_score = int(min(100, (velocity_ratio * 40) + (timeline_consumed * 20) + (remaining_tasks * 2)))
    
    if risk_score < 30:
        level = "Low"
    elif risk_score < 70:
        level = "Moderate"
    else:
        level = "High"
        
    return risk_score, level

def calculate_analytics(project: Project) -> Dict[str, Any]:
    now = datetime.utcnow()
    logs = project.behavior_logs
    
    # Velocity
    days_passed = max(1, (now - project.start_date.replace(tzinfo=None)).days)
    completed_tasks = [t for t in project.tasks if t.status]
    velocity = len(completed_tasks) / days_passed
    
    # Consistency (Simple formula: Percentage of days with at least one completion)
    completion_dates = {t.completed_at.date() for t in completed_tasks if t.completed_at}
    consistency_score = int(min(100, (len(completion_dates) / days_passed) * 100))
    
    # Completion Trend (Last 7 days)
    trend = []
    for i in range(7):
        date = (now - timedelta(days=i)).date()
        count = sum(1 for t in completed_tasks if t.completed_at and t.completed_at.date() == date)
        trend.append({"date": str(date), "count": count})
    
    return {
        "current_velocity": round(velocity, 2),
        "consistency_score": consistency_score,
        "completion_trend": trend[::-1]
    }

def score_task_v2(task: Task, project: Project, available_hours: float) -> Tuple[float, Dict[str, float]]:
    now = datetime.utcnow()
    
    # Weights
    W_IMPACT = 10
    W_EFFORT = 5
    W_MILESTONE = 15
    W_URGENCY = 20
    W_TIME_FIT = 30
    
    # Base Score
    impact_part = W_IMPACT * task.impact_score
    effort_part = W_EFFORT * task.effort_score
    score = impact_part - effort_part
    
    # Milestone Bonus
    milestone_bonus = 0
    if task.milestone_id:
        milestone = next((m for m in project.milestones if m.id == task.milestone_id), None)
        if milestone and not milestone.status:
            milestone_bonus = W_MILESTONE * milestone.weight
    score += milestone_bonus
            
    # Urgency Bonus (Hyperbolic)
    urgency_bonus = 0
    if task.deadline:
        days_until = (task.deadline.replace(tzinfo=None) - now).days
        if days_until < 0: urgency_bonus = W_URGENCY * 5
        elif days_until <= 2: urgency_bonus = W_URGENCY * 3
        elif days_until <= 7: urgency_bonus = W_URGENCY * 1
    score += urgency_bonus

    # Time Fit Bonus
    time_fit_bonus = W_TIME_FIT if task.estimated_hours <= available_hours else 0
    score += time_fit_bonus
    
    # Delay Penalty
    risk_score, _ = calculate_risk_model(project)
    delay_penalty = (risk_score / 10) * 5
    score -= delay_penalty

    breakdown = {
        "impact": impact_part,
        "effort": -effort_part,
        "milestone": milestone_bonus,
        "urgency": urgency_bonus,
        "time_fit": time_fit_bonus,
        "delay_penalty": -delay_penalty
    }
    
    return score, breakdown
