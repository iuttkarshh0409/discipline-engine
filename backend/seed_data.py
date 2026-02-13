import json
from datetime import datetime
from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import Project, Task

data = {
  "project": {
    "title": "IIPS Skill Forge (GLCS)",
    "description": "A guided learning and skill development system designed to restructure college learning through syllabus-based structure, book-centric depth, understanding verification, and skill integration.",
    "deadline": "2026-04-30"
  },
  "tasks": [
    {
      "title": "Define Core Problem Statement",
      "description": "Document systemic gaps in college learning including syllabus confusion, AI over-reliance, shallow learning, and skill deficits.",
      "estimated_hours": 6,
      "impact_score": 5,
      "effort_score": 3,
      "status": True,
      "deadline": "2026-01-10"
    },
    {
      "title": "Create Gap Identification Document",
      "description": "Structured document explaining the why behind the project and learning deficiencies observed on campus.",
      "estimated_hours": 4,
      "impact_score": 5,
      "effort_score": 2,
      "status": True,
      "deadline": "2026-01-15"
    },
    {
      "title": "Design Google Form for Student Validation",
      "description": "Craft 5 strategic questions targeting syllabus clarity, book usage, AI behavior, structure, and skill confidence.",
      "estimated_hours": 3,
      "impact_score": 4,
      "effort_score": 2,
      "status": True,
      "deadline": "2026-01-20"
    },
    {
      "title": "Collect Initial Student Responses",
      "description": "Gather 10–15 honest responses to validate behavioral learning patterns.",
      "estimated_hours": 2,
      "impact_score": 4,
      "effort_score": 1,
      "status": True,
      "deadline": "2026-01-25"
    },
    {
      "title": "Analyze Survey Insights",
      "description": "Map responses to key GLCS features and identify recurring patterns for justification.",
      "estimated_hours": 4,
      "impact_score": 5,
      "effort_score": 3,
      "status": False,
      "deadline": "2026-02-05"
    },
    {
      "title": "Create Insight-to-Feature Mapping Document",
      "description": "Connect each validated problem to specific GLCS system components.",
      "estimated_hours": 3,
      "impact_score": 5,
      "effort_score": 2,
      "status": False,
      "deadline": "2026-02-10"
    },
    {
      "title": "Define GLCS MVP Scope",
      "description": "Identify minimum viable system features (syllabus breakdown, book flow, verification, doubt tracking, one skill integration).",
      "estimated_hours": 5,
      "impact_score": 5,
      "effort_score": 3,
      "status": False,
      "deadline": "2026-02-20"
    },
    {
      "title": "Design Learning Flow Architecture",
      "description": "Create structured flow from student profiling to roadmap generation, verification checkpoints, and skill projects.",
      "estimated_hours": 6,
      "impact_score": 5,
      "effort_score": 4,
      "status": False,
      "deadline": "2026-03-05"
    },
    {
      "title": "Select Pilot Subject",
      "description": "Choose one semester subject to fully map using GLCS structure.",
      "estimated_hours": 2,
      "impact_score": 4,
      "effort_score": 1,
      "status": False,
      "deadline": "2026-03-10"
    },
    {
      "title": "Build Pilot Roadmap for Selected Subject",
      "description": "Implement syllabus breakdown, book chapters, quizzes, doubt system, and one skill project for pilot subject.",
      "estimated_hours": 10,
      "impact_score": 5,
      "effort_score": 5,
      "status": False,
      "deadline": "2026-03-25"
    },
    {
      "title": "Test Pilot with Small Student Group",
      "description": "Run pilot with 5–10 students and collect qualitative feedback.",
      "estimated_hours": 4,
      "impact_score": 5,
      "effort_score": 3,
      "status": False,
      "deadline": "2026-04-05"
    },
    {
      "title": "Refine System Based on Feedback",
      "description": "Simplify, remove friction, and improve clarity in learning flow and verification logic.",
      "estimated_hours": 6,
      "impact_score": 5,
      "effort_score": 4,
      "status": False,
      "deadline": "2026-04-20"
    },
    {
      "title": "Decision Milestone: Continue, Scale, or Refocus",
      "description": "Evaluate pilot success and decide future direction (campus rollout, research project, or product development).",
      "estimated_hours": 3,
      "impact_score": 5,
      "effort_score": 2,
      "status": False,
      "deadline": "2026-04-30"
    }
  ]
}

def seed():
    create_db_and_tables()
    with Session(engine) as session:
        # Check if project exists
        statement = select(Project).where(Project.title == data["project"]["title"])
        existing_project = session.exec(statement).first()
        if existing_project:
            print("Project already exists. Skipping seed.")
            return

        project = Project(
            title=data["project"]["title"],
            description=data["project"]["description"],
            deadline=datetime.strptime(data["project"]["deadline"], "%Y-%m-%d"),
            start_date=datetime(2025, 12, 1) # Approximate start for history
        )
        session.add(project)
        session.commit()
        session.refresh(project)

        for t in data["tasks"]:
            task = Task(
                title=t["title"],
                description=t["description"],
                estimated_hours=t["estimated_hours"],
                impact_score=t["impact_score"],
                effort_score=t["effort_score"],
                status=t["status"],
                deadline=datetime.strptime(t["deadline"], "%Y-%m-%d") if t.get("deadline") else None,
                project_id=project.id,
                completed_at=datetime.utcnow() if t["status"] else None
            )
            session.add(task)
        session.commit()
        print("Successfully migrated ChatGPT data into discipline.db")

if __name__ == "__main__":
    seed()
