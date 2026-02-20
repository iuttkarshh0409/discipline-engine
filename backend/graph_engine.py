from typing import List, Dict, Set, Tuple
import collections
import time
from models import Task
from logger import logger
from metrics import metrics

class GraphEngine:
    def __init__(self, tasks: List[Task]):
        self.tasks = {t.id: t for t in tasks}
        self.adj = collections.defaultdict(list)
        self.in_degree = collections.defaultdict(int)
        
        # Build graph
        for t in tasks:
            # We need to know dependencies. Assuming task objects have a dependency list or we fetch them separately.
            # In Phase 3, we'll assume the task object passed has its dependencies loaded or we use a separate list.
            pass

    @staticmethod
    def build_graph(tasks: List[Task], dependencies: List[Tuple[int, int]]) -> Tuple[Dict[int, List[int]], Dict[int, int]]:
        adj = {t.id: [] for t in tasks}
        in_degree = {t.id: 0 for t in tasks}
        
        for task_id, depends_on_id in dependencies:
            if depends_on_id in adj:
                adj[depends_on_id].append(task_id)
            if task_id in in_degree:
                in_degree[task_id] += 1
            
        return adj, in_degree

    @staticmethod
    def detect_cycle(tasks: List[Task], dependencies: List[Tuple[int, int]]) -> bool:
        adj, in_degree = GraphEngine.build_graph(tasks, dependencies)
        queue = collections.deque([tid for tid, degree in in_degree.items() if degree == 0])
        count = 0
        while queue:
            u = queue.popleft()
            count += 1
            for v in adj.get(u, []):
                in_degree[v] -= 1
                if in_degree[v] == 0:
                    queue.append(v)
        return count != len(tasks)

    @staticmethod
    def calculate_critical_path(tasks: List[Task], dependencies: List[Tuple[int, int]]) -> Tuple[List[int], float, Dict[int, float]]:
        metrics.increment("cpm_runs")
        start_time = time.time()
        adj, in_degree = GraphEngine.build_graph(tasks, dependencies)
        task_dict = {t.id: t for t in tasks}
        
        es = {t.id: 0.0 for t in tasks}
        ef = {t.id: t.estimated_hours for t in tasks}
        
        queue = collections.deque([tid for tid, degree in in_degree.items() if degree == 0])
        processed = []
        
        while queue:
            u = queue.popleft()
            processed.append(u)
            ef[u] = es[u] + task_dict[u].estimated_hours
            for v in adj.get(u, []):
                es[v] = max(es[v], ef[u])
                in_degree[v] -= 1
                if in_degree[v] == 0:
                    queue.append(v)
                    
        total_duration = max(ef.values()) if ef else 0.0
        
        lf = {tid: float(total_duration) for tid in es}
        ls = {tid: float(total_duration) - task_dict[tid].estimated_hours for tid in es}
        
        rev_adj = {t.id: [] for t in tasks}
        out_degree = {t.id: 0 for t in tasks}
        for task_id, depends_on_id in dependencies:
            if task_id in rev_adj:
                rev_adj[task_id].append(depends_on_id)
            if depends_on_id in out_degree:
                out_degree[depends_on_id] += 1
            
        queue = collections.deque([tid for tid, degree in out_degree.items() if degree == 0])
        while queue:
            u = queue.popleft()
            ls[u] = lf[u] - task_dict[u].estimated_hours
            for v in rev_adj.get(u, []):
                lf[v] = min(lf[v], ls[u])
                out_degree[v] -= 1
                if out_degree[v] == 0:
                    queue.append(v)
                    
        slack = {tid: ls[tid] - es[tid] for tid in es}
        critical_path = [tid for tid, s in slack.items() if s <= 0.001]
        critical_path.sort(key=lambda tid: es[tid])
        
        execution_time = (time.time() - start_time) * 1000
        logger.info(f"CPM Execution: tasks={len(tasks)}, duration={total_duration:.1f}h, time={execution_time:.2f}ms")
        
        return critical_path, float(total_duration), slack
