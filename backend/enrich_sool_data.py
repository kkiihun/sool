import os
import pandas as pd
from app.core.database import SessionLocal
from app.models.sool import Sool
from app.models.user import User  # 관계 설정을 위해 임포트 필수
from app.models.tasting_note import TastingNote # 관계 설정을 위해 임포트 필수

CSV_PATH = "/app/data/sool_basic_region_added.csv"

def enrich_data():
    print(f"📊 Enriching spirit data from {CSV_PATH}...")
    
    if not os.path.exists(CSV_PATH):
        # 로컬 실행 환경 대응
        fallback_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "data/sool_basic_region_added.csv"))
        if os.path.exists(fallback_path):
            print(f"ℹ Using fallback path: {fallback_path}")
            df = pd.read_csv(fallback_path)
        else:
            print(f"❌ Error: File not found at {CSV_PATH} or {fallback_path}")
            return
    else:
        df = pd.read_csv(CSV_PATH)
    
    db = SessionLocal()
    updated_count = 0
    
    for _, row in df.iterrows():
        name = str(row.get("name", "")).strip()
        if not name:
            continue
            
        sool = db.query(Sool).filter(Sool.name == name).first()
        
        if sool:
            region = str(row.get("region", "")).strip()
            producer = str(row.get("producer", "")).strip()
            description = str(row.get("description", "")).strip()
            
            # 카테고리 보정 (적극적)
            if not sool.category or sool.category in ["Unknown", "", "미등록"]:
                if "막걸리" in name or "동동주" in name:
                    sool.category = "탁주"
                elif "약주" in name:
                    sool.category = "약주"
                elif "소주" in name or "증류" in name:
                    sool.category = "증류주"
                elif "와인" in name or "과실" in name:
                    sool.category = "과실주"
                else:
                    # 기본 카테고리가 비어있으면 탁주로 임시 할당 (전통주의 다수가 탁주이므로)
                    sool.category = "탁주"

            if region and (not sool.region or sool.region in ["미등록", "Unknown", ""]):
                sool.region = region
            
            if producer and (not sool.producer or sool.producer in ["Unknown", ""]):
                sool.producer = producer
                
            if description and (not sool.description or len(str(sool.description)) < 5):
                sool.description = description[:500]
                
            updated_count += 1

    db.commit()
    db.close()
    print(f"✅ Finished! Updated {updated_count} items with richer information.")

if __name__ == "__main__":
    enrich_data()
