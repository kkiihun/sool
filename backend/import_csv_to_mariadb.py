import pandas as pd
import pymysql
import numpy as np

df = pd.read_csv("sense_traditional.csv")

df = df.rename(columns={
    "향 Aroma": "aroma",
    "당도 Sweetness": "sweetness",
    "산도Acidity": "acidity",
    "바디감 Body": "body",
    "여운 Aftertaste": "aftertaste",
})

df = df.replace({pd.NA: None, np.nan: None})

conn = pymysql.connect(
    host="localhost",
    user="sool",
    password="soolpass",
    database="sool",
    charset="utf8mb4"
)

cursor = conn.cursor()

SOOL_ID = 1  # 위에서 만든 술 id

insert_sql = """
INSERT INTO tasting (
    sool_id,
    sweetness,
    acidity,
    body,
    aroma,
    aftertaste
) VALUES (%s, %s, %s, %s, %s, %s)
"""

for _, row in df.iterrows():
    cursor.execute(
        insert_sql,
        (
            SOOL_ID,
            row["sweetness"],
            row["acidity"],
            row["body"],
            row["aroma"],
            row["aftertaste"],
        )
    )

conn.commit()
cursor.close()
conn.close()

print("✅ tasting 데이터 import 완료")
