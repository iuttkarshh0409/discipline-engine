from sqlmodel import create_engine, Session, SQLModel

# SQLite database file (created automatically)
DATABASE_URL = "sqlite:///./discipline.db"

engine = create_engine(
    DATABASE_URL,
    echo=True,
    connect_args={"check_same_thread": False}  # required for SQLite + FastAPI
)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
