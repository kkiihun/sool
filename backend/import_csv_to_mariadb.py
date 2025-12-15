import pandas as pd
import pymysql
from dateutil import parser
import re
import numpy as np

# 1) CSV 로드
df = pd.read_csv("sense_traditional.csv")

# 2) 컬럼명 매핑
df = df.rename(columns={
    "이름": "drink_name",
    "종류": "drink_type",
    "도수": "alcohol_percent",
    "향 Aroma": "aroma",
    "당도 Sweetness": "sweetness",
    "산도Acidity": "acidity",
    "바디감 Body": "body",
    "탄산감 Carbonation": "carbonation",
    "목넘김 Smoothness": "smoothness",
    "여운 Aftertaste": "aftertaste",
    "복합미 Complexity": "complexity",
    "종합평가 Overall Evaluation": "overall_score",
    "Comments": "comment",
    "일자": "tasted_at",
    "가격": "price",
    "양조장/제조": "brewery"
})

# 3) 도수 처리 ("6%" → 6.0)
def parse_alcohol(x):
    if pd.isna(x):
        return None
    return float(re.sub(r"[^0-9.]", "", str(x)))

df["alcohol_percent"] = df["alcohol_percent"].apply(parse_alcohol)

# 4) 날짜 처리 ("25/4월" → 2025-04-01)
def parse_date(x):
    if pd.isna(x):
        return None
    try:
        year, month = x.replace("월", "").split("/")
        return parser.parse(f"20{year}-{month}-01").date()
    except:
        return None

df["tasted_at"] = df["tasted_at"].apply(parse_date)

# 5) "-" → None
df = df.replace("-", None)

# 🔥 NaN → None (반드시 필요)
import numpy as np
df = df.replace({pd.NA: None, np.nan: None})

# 6) DB 연결
conn = pymysql.connect(
    host="localhost",
    user="sool",
    password="soolpass",
    database="sool",
    charset="utf8mb4"
)

cursor = conn.cursor()

# 7) INSERT
insert_sql = """
INSERT INTO tastings (
  drink_name, drink_type, alcohol_percent, price, brewery,
  tasted_at,
  aroma, sweetness, acidity, body, carbonation,
  smoothness, aftertaste, complexity,
  overall_score, comment
) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
"""

for _, row in df.iterrows():
    cursor.execute(insert_sql, tuple(row[col] for col in [
        "drink_name", "drink_type", "alcohol_percent", "price", "brewery",
        "tasted_at",
        "aroma", "sweetness", "acidity", "body", "carbonation",
        "smoothness", "aftertaste", "complexity",
        "overall_score", "comment"
    ]))

conn.commit()
cursor.close()
conn.close()

print("✅ CSV → MariaDB import 완료")
