import os
from sqlalchemy import create_engine, text
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse

ENV_PATH = Path(r"C:\Users\Shi Iu Oi\Desktop\FlyUpProject-1\backend\.env")
load_dotenv(ENV_PATH)
raw_db_url = os.getenv("DATABASE_URL")
sqlalchemy_db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

parsed = urlparse(sqlalchemy_db_url)
query_params = dict(parse_qsl(parsed.query))
query_params.pop("pgbouncer", None)
query_params.setdefault("sslmode", "require")
clean_query = urlencode(query_params)
DB_CONN = urlunparse(parsed._replace(query=clean_query))

engine = create_engine(DB_CONN)

with engine.connect() as conn:
    # Find course_id for the assignment
    stmt = text("""
        SELECT s."CourseId" 
        FROM "Assignments" a
        JOIN "Sections" s ON a."SectionId" = s."Id"
        WHERE a."Id" = 'ca5bf6ee-5df4-40f0-abef-2de57ca6bccb'
    """)
    result = conn.execute(stmt).fetchone()
    if result:
        print(f"CourseId: {result[0]}")
    else:
        print("CourseId not found for this assignment.")

    # Find a user_id
    stmt = text('SELECT "Id" FROM "Users" LIMIT 1')
    result = conn.execute(stmt).fetchone()
    if result:
        print(f"UserId: {result[0]}")
    else:
        print("No users found.")
