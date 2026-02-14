import sqlite3

def migrate():
    conn = sqlite3.connect('discipline.db')
    cursor = conn.cursor()
    
    print("Starting Phase 3 migration...")
    
    # Create TaskDependency table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS taskdependency (
        id INTEGER PRIMARY KEY,
        task_id INTEGER NOT NULL,
        depends_on_id INTEGER NOT NULL,
        FOREIGN KEY (task_id) REFERENCES task (id),
        FOREIGN KEY (depends_on_id) REFERENCES task (id)
    )
    """)

    # Create ProjectForecast table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projectforecast (
        id INTEGER PRIMARY KEY,
        project_id INTEGER NOT NULL,
        estimated_completion DATETIME NOT NULL,
        delay_probability REAL NOT NULL,
        confidence_score REAL NOT NULL,
        risk_trend TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES project (id)
    )
    """)
    
    conn.commit()
    conn.close()
    print("Phase 3 migration complete!")

if __name__ == "__main__":
    migrate()
