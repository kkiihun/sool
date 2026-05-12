import os
import sys

# 프로젝트 루트를 path에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.food_pairing import FoodTag
from app.models.sool import Sool

def seed_food_tags():
    db = SessionLocal()
    
    tags_data = [
        {"name": "육류", "icon": "🥩"},
        {"name": "해산물", "icon": "🦪"},
        {"name": "매운음식", "icon": "🌶️"},
        {"name": "치즈", "icon": "🧀"},
        {"name": "과일", "icon": "🍎"},
        {"name": "튀김", "icon": "🍤"},
        {"name": "전/부침개", "icon": "🍳"},
        {"name": "국물요리", "icon": "🍲"},
    ]

    print("🌱 Seeding Food Tags...")
    for tag_item in tags_data:
        existing = db.query(FoodTag).filter(FoodTag.name == tag_item["name"]).first()
        if not existing:
            new_tag = FoodTag(**tag_item)
            db.add(new_tag)
            print(f"  + Added: {tag_item['name']}")
    
    db.commit()

    # Sample Pairings for some spirits
    print("🔗 Creating Sample Pairings...")
    
    # 1. 막걸리 (Usually pairs well with Jeon, Spicy Food)
    makgeollis = db.query(Sool).filter(Sool.category.like("%막걸리%")).limit(5).all()
    jeon_tag = db.query(FoodTag).filter(FoodTag.name == "전/부침개").first()
    spicy_tag = db.query(FoodTag).filter(FoodTag.name == "매운음식").first()

    for m in makgeollis:
        if jeon_tag and jeon_tag not in m.food_tags:
            m.food_tags.append(jeon_tag)
        if spicy_tag and spicy_tag not in m.food_tags:
            m.food_tags.append(spicy_tag)

    # 2. 증류주 (Usually pairs well with Meat, Seafood)
    spirits = db.query(Sool).filter(Sool.category.like("%증류주%")).limit(5).all()
    meat_tag = db.query(FoodTag).filter(FoodTag.name == "육류").first()
    seafood_tag = db.query(FoodTag).filter(FoodTag.name == "해산물").first()

    for s in spirits:
        if meat_tag and meat_tag not in s.food_tags:
            s.food_tags.append(meat_tag)
        if seafood_tag and seafood_tag not in s.food_tags:
            s.food_tags.append(seafood_tag)

    # 3. Specific ID (e.g., 954)
    target_sool = db.query(Sool).filter(Sool.id == 954).first()
    fruit_tag = db.query(FoodTag).filter(FoodTag.name == "과일").first()
    cheese_tag = db.query(FoodTag).filter(FoodTag.name == "치즈").first()
    
    if target_sool:
        if fruit_tag and fruit_tag not in target_sool.food_tags:
            target_sool.food_tags.append(fruit_tag)
        if cheese_tag and cheese_tag not in target_sool.food_tags:
            target_sool.food_tags.append(cheese_tag)

    # 4. assign random tags to more spirits
    all_tags = db.query(FoodTag).all()
    import random
    more_sools = db.query(Sool).limit(100).all()
    for s in more_sools:
        if not s.food_tags:
            s.food_tags = random.sample(all_tags, k=random.randint(1, 3))

    db.commit()

if __name__ == "__main__":
    seed_food_tags()
