import pandas as pd
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.sool import Sool

CSV_PATH = "data/sool_basic.csv"


def import_sool_data():
    db: Session = SessionLocal()
    df = pd.read_csv(CSV_PATH)

    for _, row in df.iterrows():
        exists = db.query(Sool).filter(Sool.name == row["name"]).first()

        if not exists:
            sool = Sool(
                name=row["name"],
                category=row.get("category", None),
                abv=row.get("abv", None),
                region=row.get("region", None)
            )
            db.add(sool)

    db.commit()
    db.close()
    print("🎉 Sool data imported successfully!")


if __name__ == "__main__":
    import_sool_data()
