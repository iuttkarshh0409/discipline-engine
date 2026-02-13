import json
from datetime import datetime
from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import Project, Task

data = {
  "project": {
    "title": "Intern Knowledge Transfer & Onboarding",
    "description": "A 7-day intensive KT period to unblock interns and integrate them into the development workflow.",
    "deadline": "2026-02-21"
  },
  "tasks": [
    {
      "title": "AlumConnect Architecture Walkthrough",
      "description": "High-level overview of the FastAPI backend, MongoDB structure, and the AlumConnect mission.",
      "guidance": "1. Review the Level-0 and Level-1 DFDs.\n2. Understand the 'Passive Expiry' logic (7-day timer).\n3. Discuss the 'Asymmetric Visibility' security model.",
      "estimated_hours": 2,
      "impact_score": 10,
      "effort_score": 2,
      "status": False,
      "deadline": "2026-02-14"
    },
    {
      "title": "Local Environment Setup & Audit",
      "description": "Ensuring every intern has Python, MongoDB, and the necessary .env files running locally.",
      "guidance": "1. Clone the repository.\n2. Run 'pip install -r requirements.txt'.\n3. Verify connection to MongoDB Atlas or local instance.\n4. Use the X-Dev-User bypass to verify the app runs.",
      "estimated_hours": 4,
      "impact_score": 10,
      "effort_score": 5,
      "status": False,
      "deadline": "2026-02-15"
    },
    {
      "title": "Git Workflow & Branching Strategy",
      "description": "Standardizing how interns push code/docs to avoid conflicts.",
      "guidance": "1. Demonstrate 'git checkout -b feature/task-name'.\n2. Explain the Pull Request (PR) review process.\n3. Rules for committing documentation vs. code.",
      "estimated_hours": 2,
      "impact_score": 8,
      "effort_score": 3,
      "status": False,
      "deadline": "2026-02-16"
    },
    {
      "title": "Deep Dive: Core FastAPI Modules",
      "description": "Explaining the Pydantic schemas and the Router structure in server.py.",
      "guidance": "1. Walkthrough of the User and Profile models.\n2. Explain how dependencies like 'get_current_user' work.\n3. Review the logic for creating mentorship requests.",
      "estimated_hours": 5,
      "impact_score": 9,
      "effort_score": 6,
      "status": False,
      "deadline": "2026-02-17"
    },
    {
      "title": "Data Modeling & Aggregation Logic",
      "description": "Training on how we query MongoDB and generate analytics.",
      "guidance": "1. Review the 'Top Employers' aggregation pipeline.\n2. Explain the difference between Embedding and Referencing in our collections.\n3. Practice running a simple query in MongoDB Compass.",
      "estimated_hours": 3,
      "impact_score": 8,
      "effort_score": 4,
      "status": False,
      "deadline": "2026-02-18"
    },
    {
      "title": "Pair Programming: The First 'Good First Issue'",
      "description": "A hands-on session to fix a minor bug or add a simple metadata field.",
      "guidance": "1. Identify a low-risk task (e.g., adding a new job_domain enum).\n2. Write the code together with the intern.\n3. Run the test cases from Chapter 6.",
      "estimated_hours": 4,
      "impact_score": 9,
      "effort_score": 7,
      "status": False,
      "deadline": "2026-02-19"
    },
    {
      "title": "IIPS-DAVV Documentation Standard Alignment",
      "description": "Training the format-focused interns on the senior report standards.",
      "guidance": "1. Compare our draft with the 'Prakshep MCA' and 'CMS' reports.\n2. Standardize the Bibliography and DFD formatting.\n3. Fill in the 'Front Matter' placeholders.",
      "estimated_hours": 3,
      "impact_score": 7,
      "effort_score": 4,
      "status": False,
      "deadline": "2026-02-20"
    },
    {
      "title": "Final KT Sync & Q/A Session",
      "description": "Closing the KT week with a comprehensive sync to clear all lingering doubts.",
      "guidance": "1. Review tasks completed during the week.\n2. Address specific blockers in the research or formatting tasks.\n3. Set individual targets for the 'Implementation' phase.",
      "estimated_hours": 2,
      "impact_score": 10,
      "effort_score": 2,
      "status": False,
      "deadline": "2026-02-21"
    }
  ]
}

def seed():
    create_db_and_tables()
    with Session(engine) as session:
        statement = select(Project).where(Project.title == data["project"]["title"])
        existing_project = session.exec(statement).first()
        if existing_project:
            print("Project already exists. Skipping seed.")
            return

        project = Project(
            title=data["project"]["title"],
            description=data["project"]["description"],
            deadline=datetime.strptime(data["project"]["deadline"], "%Y-%m-%d"),
            start_date=datetime.utcnow()
        )
        session.add(project)
        session.commit()
        session.refresh(project)

        for t in data["tasks"]:
            task = Task(
                title=t["title"],
                description=t["description"],
                guidance=t["guidance"],
                estimated_hours=t["estimated_hours"],
                impact_score=min(5, t["impact_score"] // 2) if t["impact_score"] > 5 else t["impact_score"], # Normalizing to 1-5 scale
                effort_score=min(5, t["effort_score"] // 2) if t["effort_score"] > 5 else t["effort_score"], # Normalizing to 1-5 scale
                status=t["status"],
                deadline=datetime.strptime(t["deadline"], "%Y-%m-%d") if t.get("deadline") else None,
                project_id=project.id
            )
            session.add(task)
        session.commit()
        print("Successfully migrated Intern KT data into discipline.db")

if __name__ == "__main__":
    seed()
