import sqlite3
import pymysql

# 1️⃣ SQLite 연결
sqlite_conn = sqlite3.connect("sool.db")
sqlite_cursor = sqlite_conn.cursor()

# 2️⃣ MariaDB 연결 (Docker)
maria_conn = pymysql.connect(
    host="localhost",
    user="sool",
    password="soolpass",
    database="sool",
    charset="utf8mb4"
)
maria_cursor = maria_conn.cursor()

# 3️⃣ SQLite에서 sool 데이터 읽기
sqlite_cursor.execute("""
SELECT
    name,
    category,
    abv,
    region,
    description,
    producer,
    ingredients
FROM sool
""")

rows = sqlite_cursor.fetchall()

print(f"📦 SQLite sool rows: {len(rows)}")

# 4️⃣ MariaDB에 INSERT
insert_sql = """
INSERT INTO sool (
    name,
    category,
    abv,
    region,
    description,
    producer,
    ingredients
) VALUES (%s,%s,%s,%s,%s,%s,%s)
"""

for row in rows:
    maria_cursor.execute(insert_sql, row)

maria_conn.commit()

# 5️⃣ 종료
sqlite_conn.close()
maria_conn.close()

print("✅ SQLite → MariaDB sool 테이블 마이그레이션 완료")
