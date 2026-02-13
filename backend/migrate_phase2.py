import sqlite3

def migrate():
    conn = sqlite3.connect('discipline.db')
    cursor = conn.cursor()
    
    print("Starting migration...")
    
    # Update Project table
    try:
        cursor.execute("ALTER TABLE project ADD COLUMN context_notes TEXT")
        cursor.execute("ALTER TABLE project ADD COLUMN roadmap_text TEXT")
        cursor.execute("ALTER TABLE project ADD COLUMN architecture_notes TEXT")
        print("Updated project table columns.")
    except sqlite3.OperationalError:
        print("Project columns already exist.")

    # Update Task table
    try:
        cursor.execute("ALTER TABLE task ADD COLUMN milestone_id INTEGER")
        cursor.execute("ALTER TABLE task ADD COLUMN completed_at DATETIME")
        print("Updated task table columns.")
    except sqlite3.OperationalError:
        print("Task columns already exist.")

    # Create Milestone table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS milestone (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        target_date DATETIME,
        weight INTEGER DEFAULT 3,
        status BOOLEAN DEFAULT 0,
        project_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES project (id)
    )
    """)
    
    # Create BehaviorLog table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS behaviorlog (
        id INTEGER PRIMARY KEY,
        project_id INTEGER NOT NULL,
        task_id INTEGER,
        action_type TEXT DEFAULT 'completion',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        duration_minutes INTEGER,
        FOREIGN KEY (project_id) REFERENCES project (id),
        FOREIGN KEY (task_id) REFERENCES task (id)
    )
    """)
    
    # Fix for SQLite not supporting AUTO_INCREMENT like this (it uses AUTOINCREMENT)
    # Actually SQLite INTEGER PRIMARY KEY handles autoincrement automatically.
    
    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
