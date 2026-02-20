import pytest
from datetime import datetime, timedelta
from services import score_task_v2, calculate_risk_model
from models import Project, Task

def test_task_scoring_v2():
    project = Project(
        id=1,
        title="Test Project",
        start_date=datetime.utcnow() - timedelta(days=5),
        deadline=datetime.utcnow() + timedelta(days=5),
        tasks=[]
    )
    
    high_impact_task = Task(
        id=1,
        title="High Impact",
        impact_score=5,
        effort_score=1,
        estimated_hours=2,
        status=False
    )
    
    score, breakdown = score_task_v2(high_impact_task, project, available_hours=4.0)
    
    assert score > 0
    assert breakdown["impact"] == 50
    assert breakdown["effort"] == -5
    assert breakdown["time_fit"] == 30 # Fits available hours

def test_risk_model_calculation():
    # Long past start, close deadline, many remaining tasks -> High Risk
    start_date = datetime.utcnow() - timedelta(days=20)
    deadline = datetime.utcnow() + timedelta(days=2)
    
    project = Project(
        id=1,
        title="Risky Project",
        start_date=start_date,
        deadline=deadline,
        tasks=[Task(id=i, status=False) for i in range(10)]
    )
    
    # Needs a few completed tasks to not hit the "days_passed=1" or "current_velocity=0" defaults too hard
    # but the current model handles velocity gaps.
    
    score, level = calculate_risk_model(project)
    assert level in ["Moderate", "High"]
