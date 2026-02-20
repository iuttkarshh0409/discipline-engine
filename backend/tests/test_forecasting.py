import pytest
from datetime import datetime, timedelta
from forecasting import ForecastingModule
from models import Project, Task

def test_calculate_forecast_basic():
    start_date = datetime.utcnow() - timedelta(days=10)
    deadline = datetime.utcnow() + timedelta(days=10)
    
    project = Project(
        id=1, 
        title="Test Project", 
        start_date=start_date, 
        deadline=deadline,
        tasks=[]
    )
    
    # Empty project
    forecast = ForecastingModule.calculate_forecast(project, 0.0)
    assert forecast["delay_probability"] == 0
    assert forecast["confidence_score"] == 100

def test_detect_bottlenecks():
    tasks = [
        Task(id=1, title="Hub Task", estimated_hours=2),
        Task(id=2, title="Task A", estimated_hours=2),
        Task(id=3, title="Task B", estimated_hours=2),
        Task(id=4, title="Task C", estimated_hours=2),
    ]
    # Task 1 blocks 2, 3, 4
    dependencies = [(2, 1), (3, 1), (4, 1)]
    slack = {1: 0.0, 2: 1.0, 3: 1.0, 4: 1.0}
    
    bottlenecks = ForecastingModule.detect_bottlenecks(tasks, dependencies, slack)
    
    assert len(bottlenecks) >= 1
    assert bottlenecks[0]["task_id"] == 1
    assert "Blocking 3 downstream tasks" in bottlenecks[0]["reason"]
