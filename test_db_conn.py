import pymysql
import os

DB_HOST = "localhost"
DB_PORT = 3307
DB_USER = "sool"
DB_PASSWORD = "soolpass"
DB_NAME = "sool"

try:
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    print("Connection successful!")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
