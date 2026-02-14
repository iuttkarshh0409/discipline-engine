import json
from typing import List, Dict, Any, Optional
import os
# Assuming some standard library or simple mock for AI if key is missing
# In a real scenario, we'd use 'google-generativeai' or similar.

class AIService:
    @staticmethod
    def _mock_ai_structure_plan(text: str) -> Dict[str, Any]:
        # Simple rule-based mock for structuring plan if no AI
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        tasks = []
        for i, line in enumerate(lines):
            tasks.append({
                "title": line[:50],
                "description": line,
                "estimated_hours": 2,
                "impact_score": 3,
                "effort_score": 3,
                "dependencies": [i] if i > 0 else [] # Sequential by default in mock
            })
        return {
            "tasks": tasks,
            "milestones": [
                {"title": "Initial Phase", "weight": 3},
                {"title": "Delivery Phase", "weight": 5}
            ]
        }

    @staticmethod
    def structure_plan(project_id: int, plan_text: str) -> Dict[str, Any]:
        # This would call Gemini API
        # For now, providing the logic structure and mock
        return AIService._mock_ai_structure_plan(plan_text)

    @staticmethod
    def get_advice(project_data: Dict[str, Any], available_hours: float) -> Dict[str, Any]:
        # This combines forecast + critical path + context
        # Mocking an advice response
        return {
            "recommended_task_id": project_data.get("tasks", [{}])[0].get("id"),
            "strategic_explanation": "This task is on your critical path and has the highest dependency count. Completing it now reduces overall project risk by 15%.",
            "alternate_path": "If you feel fatigued, try Task B which is low effort but still contributes to your milestone.",
            "risk_aware_reasoning": "Current delay probability is 40%. Focusing on critical path prevents timeline slippage."
        }
