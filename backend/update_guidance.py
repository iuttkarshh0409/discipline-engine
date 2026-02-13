import json
from sqlmodel import Session, select
from database import engine
from models import Task

guidance_data = [
  {
    "title": "Define Core Problem Statement",
    "guidance": "1. Re-read document once\n2. Remove vague sentences\n3. Ensure 5 clear problems\n4. Check real-campus relevance\n5. Freeze version"
  },
  {
    "title": "Create Gap Identification Document",
    "guidance": "1. Review structure\n2. Simplify language\n3. Remove repetition\n4. Ensure problem-only focus\n5. Lock final copy"
  },
  {
    "title": "Design Google Form for Student Validation",
    "guidance": "1. Re-check question clarity\n2. Remove bias wording\n3. Ensure option balance\n4. Test form once\n5. Archive final version"
  },
  {
    "title": "Collect Initial Student Responses",
    "guidance": "1. Confirm response count\n2. Export to spreadsheet\n3. Check completeness\n4. Remove duplicates\n5. Save raw data backup"
  },
  {
    "title": "Analyze Survey Insights",
    "guidance": "1. Categorize answers\n2. Identify top patterns\n3. Count dominant trends\n4. Write 5 core insights\n5. Validate logic"
  },
  {
    "title": "Create Insight-to-Feature Mapping Document",
    "guidance": "1. List validated problems\n2. Map to GLCS features\n3. Remove weak mappings\n4. Format clean table\n5. Final clarity check"
  },
  {
    "title": "Define GLCS MVP Scope",
    "guidance": "1. List all features\n2. Cut non-essentials\n3. Keep core engine only\n4. Define outputs clearly\n5. Lock MVP scope"
  },
  {
    "title": "Design Learning Flow Architecture",
    "guidance": "1. Outline student journey\n2. Add checkpoints\n3. Insert book-first logic\n4. Add skill integration\n5. Simplify flow"
  },
  {
    "title": "Select Pilot Subject",
    "guidance": "1. Compare syllabus complexity\n2. Ensure textbook access\n3. Check semester timeline\n4. Choose manageable subject\n5. Confirm decision"
  },
  {
    "title": "Build Pilot Roadmap for Selected Subject",
    "guidance": "1. Break syllabus units\n2. Assign book chapters\n3. Add understanding checks\n4. Define one project\n5. Review structure"
  },
  {
    "title": "Test Pilot with Small Student Group",
    "guidance": "1. Select 5–10 peers\n2. Explain pilot briefly\n3. Observe engagement\n4. Note friction points\n5. Collect feedback"
  },
  {
    "title": "Refine System Based on Feedback",
    "guidance": "1. List improvement areas\n2. Remove complexity\n3. Clarify instructions\n4. Strengthen checkpoints\n5. Final revision"
  },
  {
    "title": "Decision Milestone: Continue, Scale, or Refocus",
    "guidance": "1. Review pilot outcomes\n2. Assess real benefit\n3. Evaluate effort vs impact\n4. Identify strongest value\n5. Decide next phase"
  }
]

def update_guidance():
    with Session(engine) as session:
        for entry in guidance_data:
            statement = select(Task).where(Task.title == entry["title"])
            task = session.exec(statement).first()
            if task:
                task.guidance = entry["guidance"]
                session.add(task)
                print(f"Updated guidance for: {task.title}")
            else:
                print(f"Task not found: {entry['title']}")
        session.commit()
    print("Guidance update complete!")

if __name__ == "__main__":
    update_guidance()
