import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_PUBLIC_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PUBLIC_PORT", "3308"))
DB_USER = os.getenv("DB_USER", "sool")
DB_PASSWORD = os.getenv("DB_PASSWORD", "soolpass")
DB_NAME = os.getenv("DB_NAME", "sool")

try:
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    with conn.cursor() as cursor:
        cursor.execute("SELECT DATABASE(), USER(), VERSION()")
        database, user, version = cursor.fetchone()
    print(f"Connection successful: database={database}, user={user}, version={version}")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
