import pandas as pd

COLUMN_MAP = {
    "제품명": "name",
    "제품소개": "description",
    "알콜도수": "abv",
    "용량": "volume",
    "성분": "ingredients",
    "특이사항": "notes",
    "특징": "notes",
    "판매여부": "available",
    "양조장": "producer",
    "양조장 주소": "producer_location",
    "홈페이지주소": "link"
}

INPUT_FILE = "data/sool_basic.csv"
OUTPUT_FILE = "data/sool_basic_clean.csv"

df = pd.read_csv(INPUT_FILE)

df = df.rename(columns=COLUMN_MAP)

# 중복된 notes 컬럼 처리
if 'notes_x' in df.columns and 'notes_y' in df.columns:
    df['notes'] = df['notes_x'].fillna(df['notes_y'])
    df.drop(columns=['notes_x', 'notes_y'], inplace=True)

# Y/N → true/false
if 'available' in df.columns:
    df['available'] = df['available'].map(lambda x: True if str(x).upper() == "Y" else False)

df.to_csv(OUTPUT_FILE, index=False)

print("🎉 CSV 변환 완료 →", OUTPUT_FILE)
