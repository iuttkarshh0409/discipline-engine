import collections
from datetime import datetime, timedelta
from typing import List, Dict, Any
from models import Project, Task, ProjectForecast

class ForecastingModule:
    @staticmethod
    def calculate_forecast(project: Project, critical_path_duration_hours: float) -> Dict[str, Any]:
        now = datetime.utcnow()
        completed_tasks = [t for t in project.tasks if t.status]
        pending_tasks = [t for t in project.tasks if not t.status]
        
        if not project.tasks:
            return {
                "estimated_completion": project.deadline,
                "delay_probability": 0,
                "confidence_score": 100,
                "risk_trend": "stable"
            }

        # Historical Velocity (tasks per day)
        days_passed = max(1, (now - project.start_date.replace(tzinfo=None)).days)
        velocity = len(completed_tasks) / days_passed
        
        # Remaining hours based on critical path vs total work
        remaining_hours = sum(t.estimated_hours for t in pending_tasks)
        
        # Work execution factor (how much hours we do per day on average)
        # For simplicity, assume 6 productive hours per day if no log data
        hours_per_day = 6.0 
        
        # Estimated days needed
        # We take the max of critical path duration (sequential) and total work distributed (parallel capacity)
        # Assuming single user: sequential is more realistic for the person
        days_needed = critical_path_duration_hours / hours_per_day
        
        est_completion = now + timedelta(days=days_needed)
        
        # Delay Probability
        days_left = (project.deadline.replace(tzinfo=None) - now).days
        delay_prob = 0
        if days_left <= 0:
            delay_prob = 100 if pending_tasks else 0
        else:
            delay_prob = min(100, max(0, (days_needed / days_left) * 50))
            
        # Confidence Score
        # More completed tasks -> Higher confidence
        confidence = (len(completed_tasks) / len(project.tasks)) * 100 if project.tasks else 0
        
        # Logic for risk trend
        # Ideally we'd compare with previous forecast
        risk_trend = "stable"
        
        return {
            "estimated_completion": est_completion,
            "delay_probability": round(delay_prob, 2),
            "confidence_score": round(confidence, 2),
            "risk_trend": risk_trend
        }

    @staticmethod
    def detect_bottlenecks(tasks: List[Task], dependencies: List[tuple], slack: Dict[int, float]) -> List[Dict[str, Any]]:
        bottlenecks = []
        
        # 1. Critical path tasks are naturally bottlenecks
        critical_tasks = [tid for tid, s in slack.items() if s <= 0.001]
        
        # 2. Dependency Hubs (Tasks blocking many others)
        blocked_by = {t.id: 0 for t in tasks}
        for task_id, depends_on_id in dependencies:
            if depends_on_id in blocked_by:
                blocked_by[depends_on_id] += 1
            
        for tid, count in blocked_by.items():
            if count >= 3:
                bottlenecks.append({
                    "task_id": tid,
                    "impact_severity": int(min(100, count * 20)),
                    "reason": f"Blocking {count} downstream tasks."
                })
                
        # 3. High weight milestone tasks with zero slack
        for t in tasks:
            if t.id in critical_tasks and t.milestone_id:
                # We'd need milestone weight here, but can simplify
                bottlenecks.append({
                    "task_id": t.id,
                    "impact_severity": 90,
                    "reason": "Critical path task linked to milestone."
                })
                
        # Deduplicate
        seen = set()
        unique_bottlenecks = []
        for b in bottlenecks:
            if b["task_id"] not in seen:
                unique_bottlenecks.append(b)
                seen.add(b["task_id"])
                
        return unique_bottlenecks
