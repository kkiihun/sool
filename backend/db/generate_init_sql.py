import sqlite3

SQLITE_DB = "sool.db"          # SQLite 파일 경로
OUTPUT_SQL = "init.sql"        # 생성될 파일

TABLE_NAME = "sool"

conn = sqlite3.connect(SQLITE_DB)
cursor = conn.cursor()

# 테이블 스키마 추출
cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{TABLE_NAME}'")
create_table_sql = cursor.fetchone()[0]

# 데이터 추출
cursor.execute(f"SELECT * FROM {TABLE_NAME}")
rows = cursor.fetchall()

columns = [desc[0] for desc in cursor.description]

with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
    f.write("USE sool;\n\n")
    f.write(f"{create_table_sql};\n\n")

    for row in rows:
        values = []
        for v in row:
            if v is None:
                values.append("NULL")
            elif isinstance(v, (int, float)):
                values.append(str(v))
            else:
                values.append("'" + str(v).replace("'", "''") + "'")

        insert_sql = f"""
INSERT INTO {TABLE_NAME} ({", ".join(columns)})
VALUES ({", ".join(values)});
"""
        f.write(insert_sql)

print("✅ init.sql 생성 완료")
