import pytest
from datetime import datetime, timedelta
from services import score_task_v2, calculate_risk_model
from models import Project, Task, Milestone

def test_impact_logic_determinism():
    """Verify that increasing impact score linearly increases the total score by weight (10x)."""
    # Fixed base project
    project = Project(
        id=1, 
        start_date=datetime.utcnow() - timedelta(days=10), 
        deadline=datetime.utcnow() + timedelta(days=10), 
        tasks=[]
    )
    
    task_low = Task(id=1, impact_score=1, effort_score=1, estimated_hours=1)
    task_high = Task(id=2, impact_score=5, effort_score=1, estimated_hours=1)
    
    score_low, _ = score_task_v2(task_low, project, available_hours=5.0)
    score_high, _ = score_task_v2(task_high, project, available_hours=5.0)
    
    # Difference in impact = 4 units. Weight = 10. Expected diff = 40.
    assert score_high == score_low + 40

def test_effort_logic_determinism():
    """Verify that increasing effort score linearly decreases the total score by weight (5x)."""
    project = Project(
        id=1, 
        start_date=datetime.utcnow() - timedelta(days=10), 
        deadline=datetime.utcnow() + timedelta(days=10), 
        tasks=[]
    )
    
    task_easy = Task(id=1, impact_score=3, effort_score=1, estimated_hours=1)
    task_hard = Task(id=2, impact_score=3, effort_score=5, estimated_hours=1)
    
    score_easy, _ = score_task_v2(task_easy, project, available_hours=5.0)
    score_hard, _ = score_task_v2(task_hard, project, available_hours=5.0)
    
    # Difference in effort = 4 units. Weight = 5. Expected diff = -20.
    assert score_hard == score_easy - 20

def test_milestone_bonus_impact():
    """Verify that tasks linked to non-completed milestones receive a weighted bonus (15x)."""
    milestone = Milestone(id=1, title="Alpha", weight=3, status=False)
    project = Project(
        id=1, 
        start_date=datetime.utcnow() - timedelta(days=10), 
        deadline=datetime.utcnow() + timedelta(days=10), 
        tasks=[], 
        milestones=[milestone]
    )
    
    task_no_milestone = Task(id=1, impact_score=3, effort_score=3, estimated_hours=1, milestone_id=None)
    task_with_milestone = Task(id=2, impact_score=3, effort_score=3, estimated_hours=1, milestone_id=1)
    
    score_none, _ = score_task_v2(task_no_milestone, project, available_hours=5.0)
    score_milestone, _ = score_task_v2(task_with_milestone, project, available_hours=5.0)
    
    # Milestone weight = 3. W_MILESTONE = 15. Expected bonus = 45.
    assert score_milestone == score_none + 45

def test_risk_penalty_impact():
    """Verify that projects with higher risk scores result in a larger delay penalty."""
    # Healthy project: 10 days passed, tasks completed.
    project_healthy = Project(
        id=1,
        start_date=datetime.utcnow() - timedelta(days=10),
        deadline=datetime.utcnow() + timedelta(days=10),
        tasks=[Task(id=i, status=True, completed_at=datetime.utcnow()) for i in range(5)]
    )
    
    # Risky project: 10 days passed, 0 completions, deadline tomorrow.
    project_risky = Project(
        id=2,
        start_date=datetime.utcnow() - timedelta(days=10),
        deadline=datetime.utcnow() + timedelta(days=1),
        tasks=[Task(id=i, status=False) for i in range(10)]
    )
    
    task = Task(id=99, impact_score=3, effort_score=3, estimated_hours=1)
    
    score_healthy, breakdown_healthy = score_task_v2(task, project_healthy, available_hours=5.0)
    score_risky, breakdown_risky = score_task_v2(task, project_risky, available_hours=5.0)
    
    # Delay penalty is subtracted.
    assert breakdown_risky["delay_penalty"] < breakdown_healthy["delay_penalty"]
    assert score_risky < score_healthy

def test_ranking_correctness():
    """Verify combined heuristic ranking: High Impact/Low Effort > Low Impact/High Effort."""
    project = Project(
        id=1, 
        start_date=datetime.utcnow() - timedelta(days=10), 
        deadline=datetime.utcnow() + timedelta(days=10), 
        tasks=[]
    )
    
    # Candidate A: Impact 5, Effort 1 -> Base 45
    task_a = Task(id=1, impact_score=5, effort_score=1, estimated_hours=1)
    # Candidate B: Impact 1, Effort 5 -> Base -15
    task_b = Task(id=2, impact_score=1, effort_score=5, estimated_hours=1)
    
    score_a, _ = score_task_v2(task_a, project, available_hours=5.0)
    score_b, _ = score_task_v2(task_b, project, available_hours=5.0)
    
    assert score_a > score_b
    assert score_a - score_b == 60 # (50-5) - (10-25) = 45 - (-15) = 60

def test_time_fit_bonus_determinism():
    """Verify that tasks fitting within available_hours get a fixed bonus (30)."""
    project = Project(id=1, start_date=datetime.utcnow() - timedelta(days=1), deadline=datetime.utcnow() + timedelta(days=1), tasks=[])
    
    task_v_small = Task(id=1, impact_score=3, effort_score=3, estimated_hours=1)
    task_v_large = Task(id=2, impact_score=3, effort_score=3, estimated_hours=10)
    
    # If we have 5 hours available
    score_fit, _ = score_task_v2(task_v_small, project, available_hours=5.0)
    score_no_fit, _ = score_task_v2(task_v_large, project, available_hours=5.0)
    
    # W_TIME_FIT = 30.
    assert score_fit == score_no_fit + 30
