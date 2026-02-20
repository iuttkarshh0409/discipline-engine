import pytest
from graph_engine import GraphEngine
from models import Task

def test_linear_chain():
    """Test a simple 1 -> 2 -> 3 sequential chain."""
    tasks = [
        Task(id=1, title="T1", estimated_hours=5.0),
        Task(id=2, title="T2", estimated_hours=3.0),
        Task(id=3, title="T3", estimated_hours=10.0),
    ]
    dependencies = [(2, 1), (3, 2)]  # 2 depends on 1, 3 depends on 2
    
    cp, duration, slack = GraphEngine.calculate_critical_path(tasks, dependencies)
    
    assert duration == 18.0
    assert cp == [1, 2, 3]
    assert slack[1] == 0.0
    assert slack[2] == 0.0
    assert slack[3] == 0.0

def test_parallel_branches_and_slack():
    """
    Test parallel branches:
    Path A: 1 (5h) -> 2 (10h) -> 4 (5h)  [Total 20h]
    Path B: 1 (5h) -> 3 (2h)  -> 4 (5h)  [Total 12h]
    """
    tasks = [
        Task(id=1, title="T1", estimated_hours=5.0),
        Task(id=2, title="T2", estimated_hours=10.0),
        Task(id=3, title="T3", estimated_hours=2.0),
        Task(id=4, title="T4", estimated_hours=5.0),
    ]
    dependencies = [
        (2, 1), (3, 1), # 2 and 3 depend on 1
        (4, 2), (4, 3)  # 4 depends on 2 and 3
    ]
    
    cp, duration, slack = GraphEngine.calculate_critical_path(tasks, dependencies)
    
    assert duration == 20.0
    assert cp == [1, 2, 4]
    assert slack[1] == 0.0
    assert slack[2] == 0.0
    assert slack[4] == 0.0
    # Slack for T3: 20 (Total) - Ef(3) - Ef(4) = ? 
    # Or LS(3) - ES(3). 
    # ES(3)=5, EF(3)=7. LS(3)=13, LF(3)=15. Slack = 8.
    assert abs(slack[3] - 8.0) < 0.001

def test_cycle_detection():
    """Test that a cycle is correctly detected."""
    tasks = [
        Task(id=1, title="T1", estimated_hours=1.0),
        Task(id=2, title="T2", estimated_hours=1.0),
    ]
    # 1 -> 2 -> 1
    dependencies = [(2, 1), (1, 2)]
    
    assert GraphEngine.detect_cycle(tasks, dependencies) is True

def test_no_cycle_dag():
    """Test that a standard DAG returns no cycle."""
    tasks = [
        Task(id=1, title="T1", estimated_hours=1.0),
        Task(id=2, title="T2", estimated_hours=1.0),
        Task(id=3, title="T3", estimated_hours=1.0),
    ]
    # 1 -> 2, 1 -> 3
    dependencies = [(2, 1), (3, 1)]
    
    assert GraphEngine.detect_cycle(tasks, dependencies) is False

def test_multiple_critical_paths():
    """Test when two paths have the same duration."""
    tasks = [
        Task(id=1, title="T1", estimated_hours=5.0),
        Task(id=2, title="T2", estimated_hours=10.0),
        Task(id=3, title="T3", estimated_hours=10.0),
        Task(id=4, title="T4", estimated_hours=5.0),
    ]
    # Path A: 1 -> 2 -> 4 (20h)
    # Path B: 1 -> 3 -> 4 (20h)
    dependencies = [(2, 1), (3, 1), (4, 2), (4, 3)]
    
    cp, duration, slack = GraphEngine.calculate_critical_path(tasks, dependencies)
    
    assert duration == 20.0
    # Both paths should be critical
    assert set(cp) == {1, 2, 3, 4}
    for tid in [1, 2, 3, 4]:
        assert slack[tid] <= 0.001
