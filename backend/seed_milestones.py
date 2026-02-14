from datetime import datetime, timedelta
from sqlmodel import Session, select
from database import engine
from models import Project, Milestone

def seed_milestones():
    with Session(engine) as session:
        # Targeting IIPS Skill Forge (GLCS) - ID 2
        project = session.get(Project, 2)
        if not project:
            print("Project not found.")
            return

        # Check if milestones already exist
        statement = select(Milestone).where(Milestone.project_id == 2)
        existing = session.exec(statement).all()
        if existing:
            print("Milestones already present for this project.")
            return

        now = datetime.utcnow()
        
        milestones = [
            {
                "title": "Research & Scope Freeze",
                "description": "Validation completed and MVP features locked.",
                "target_date": now + timedelta(days=2),
                "weight": 4
            },
            {
                "title": "Architectural Integrity",
                "description": "Student journey and Concept Dependency Graph logic finalized.",
                "target_date": now + timedelta(days=5),
                "weight": 5
            },
            {
                "title": "Core Engine MVP",
                "description": "Backend APIs and Frontend Dashboard functional for basic roadmap generation.",
                "target_date": now + timedelta(days=12),
                "weight": 5
            },
            {
                "title": "Pilot Deployment",
                "description": "Single-subject pilot live with test student group.",
                "target_date": now + timedelta(days=15),
                "weight": 3
            },
            {
                "title": "Performance Refinement",
                "description": "Feedback integrated and system ready for scaling decisions.",
                "target_date": now + timedelta(days=20),
                "weight": 2
            }
        ]

        for m_data in milestones:
            milestone = Milestone(
                project_id=2,
                title=m_data["title"],
                description=m_data["description"],
                target_date=m_data["target_date"],
                weight=m_data["weight"],
                status=False
            )
            session.add(milestone)
        
        session.commit()
        print(f"Successfully injected {len(milestones)} strategic milestones for IIPS Skill Forge.")

if __name__ == "__main__":
    seed_milestones()
