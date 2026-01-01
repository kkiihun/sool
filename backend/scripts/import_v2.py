import pandas as pd
import pymysql
import math

CSV_PATH = "/Users/kimkihun/Documents/sool/backend/data/sool_basic_clean.csv"

conn = pymysql.connect(
    host="127.0.0.1",
    user="root",
    password="rootpass",
    db="sool",
    charset="utf8mb4",
    autocommit=True
)
cur = conn.cursor()

df = pd.read_csv(CSV_PATH)

def extract_region(address):
    if isinstance(address, str):
        return address[:2]  # ex: 서울, 경기, 강원
    return "Unknown"

for _, row in df.iterrows():

    # ---- NULL 처리 ----
    name = row.get('name')
    abv = None if (pd.isna(row.get('abv')) or row.get('abv') == '') else row.get('abv')
    desc = row.get('description') if isinstance(row.get('description'), str) else None
    ingredients = row.get('ingredients') if isinstance(row.get('ingredients'), str) else None
    producer = row.get('producer') if isinstance(row.get('producer'), str) else "Unknown"
    region_name = extract_region(row.get('양조장주소', ""))

    # 1. default category
    cur.execute("INSERT IGNORE INTO category_v2(name) VALUES(%s)", ("Unknown",))
    cur.execute("SELECT id FROM category_v2 WHERE name=%s", ("Unknown",))
    category_id = cur.fetchone()[0]

    # 2. region insert / fetch
    cur.execute("INSERT IGNORE INTO region_v2(name) VALUES(%s)", (region_name,))
    cur.execute("SELECT id FROM region_v2 WHERE name=%s", (region_name,))
    region_id = cur.fetchone()[0]

    # 3. producer insert / fetch
    cur.execute("INSERT IGNORE INTO producer_v2(name, region_id) VALUES(%s,%s)", (producer, region_id))
    cur.execute("SELECT id FROM producer_v2 WHERE name=%s", (producer,))
    producer_id = cur.fetchone()[0]

    # 4. sool insert
    cur.execute("""
        INSERT IGNORE INTO sool_v2(name, category_id, region_id, producer_id, abv, description)
        VALUES(%s,%s,%s,%s,%s,%s)
    """, (name, category_id, region_id, producer_id, abv, desc))

print("\n🎉 Import Completed Successfully")
