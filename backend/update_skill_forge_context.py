from sqlmodel import Session, select
from database import engine
from models import Project

data = {
  "roadmap_text": "1. Validate learning gaps using collected survey insights and finalize core problem priorities.\n2. Lock the GLCS MVP scope focusing only on syllabus structuring, book flow, verification, and one skill module.\n3. Design the complete student journey flow from profiling to roadmap generation and understanding checkpoints.\n4. Architect the core engine logic including syllabus breakdown, dependency mapping, and NOT YET verification loops.\n5. Build backend APIs and database models to support structured learning paths and progress tracking.\n6. Develop frontend dashboard for roadmap display, quizzes, doubt tracking, and skill progress visualization.\n7. Launch a controlled pilot with one subject and a small student group.\n8. Analyze pilot performance and refine system before scaling.",
  
  "architecture_notes": "System follows a syllabus-driven engine architecture. Student Profile Input -> Diagnostic Assessment -> Syllabus Decomposition Module -> Concept Dependency Graph Builder -> Personalized Roadmap Generator -> Learning Unit Execution Layer -> Understanding Verification Engine (quiz + NOT YET logic) -> Doubt Ticket System linked to concept nodes -> Skill Module Integrator -> Progress Analytics Dashboard. Core logic centers on controlled progression where concept status cannot advance without verification. Data entities include Student, Subject, ConceptNode, DependencyMap, Roadmap, QuizAttempt, DoubtTicket, SkillTrack, and ProjectTrack. Engine enforces sequential learning with conditional progression gates.",
  
  "context_notes": "Frontend: React (Vite) + Tailwind CSS. Backend: FastAPI (Python) + SQLModel ORM. Database: PostgreSQL. Authentication: Clerk or JWT-based auth. State Management: React Context or Zustand. API Communication: REST (JSON). Hosting: Backend on Railway/Render, Frontend on Vercel. Version Control: Git + GitHub. Future-ready for modular AI integration layer (controlled assist mode)."
}

def update_context():
    with Session(engine) as session:
        statement = select(Project).where(Project.title == "IIPS Skill Forge (GLCS)")
        project = session.exec(statement).first()
        
        if project:
            project.roadmap_text = data["roadmap_text"]
            project.architecture_notes = data["architecture_notes"]
            project.context_notes = data["context_notes"]
            session.add(project)
            session.commit()
            print(f"Strategic context applied to: {project.title}")
        else:
            print("Project 'IIPS Skill Forge' not found in database.")

if __name__ == "__main__":
    update_context()
