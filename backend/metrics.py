from threading import Lock
from typing import Dict

class MetricsTracker:
    def __init__(self):
        self._metrics = {
            "cpm_runs": 0,
            "tasks_scored": 0,
            "risk_evaluations": 0
        }
        self._lock = Lock()

    def increment(self, metric_name: str, amount: int = 1):
        with self._lock:
            if metric_name in self._metrics:
                self._metrics[metric_name] += amount

    def get_metrics(self) -> Dict[str, int]:
        with self._lock:
            return self._metrics.copy()

metrics = MetricsTracker()
