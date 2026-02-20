import pytest
from graph_engine import GraphEngine
from models import Task

def test_detect_cycle():
    tasks = [
        Task(id=1, title="Task 1", estimated_hours=2),
        Task(id=2, title="Task 2", estimated_hours=2)
    ]
    # 1 -> 2 -> 1 (Cycle)
    dependencies = [(2, 1), (1, 2)]
    
    assert GraphEngine.detect_cycle(tasks, dependencies) is True

def test_no_cycle():
    tasks = [
        Task(id=1, title="Task 1", estimated_hours=2),
        Task(id=2, title="Task 2", estimated_hours=2)
    ]
    # 1 -> 2
    dependencies = [(2, 1)]
    
    assert GraphEngine.detect_cycle(tasks, dependencies) is False

def test_critical_path():
    tasks = [
        Task(id=1, title="Task 1", estimated_hours=5),
        Task(id=2, title="Task 2", estimated_hours=3),
        Task(id=3, title="Task 3", estimated_hours=10)
    ]
    # 1 -> 2 -> 3
    dependencies = [(2, 1), (3, 2)]
    
    cp, duration, slack = GraphEngine.calculate_critical_path(tasks, dependencies)
    
    assert cp == [1, 2, 3]
    assert duration == 18.0
    assert all(s <= 0.001 for tid, s in slack.items())
