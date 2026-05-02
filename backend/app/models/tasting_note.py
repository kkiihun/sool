from sqlalchemy import Column, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class TastingNote(Base):
    __tablename__ = "tasting_notes"

    id = Column(Integer, primary_key=True, index=True)
    sool_id = Column(Integer, ForeignKey("sool.id"), nullable=False)
    rating = Column(Integer, nullable=True)
    aroma = Column(Float, nullable=True)
    # Keep the legacy DB column names while exposing the current API field names.
    sweetness = Column("flavor", Float, nullable=True)
    acidity = Column("texture", Float, nullable=True)
    body = Column(Float, nullable=True)
    finish = Column(Float, nullable=True)
    comment = Column("notes", Text, nullable=True)

    sool = relationship("Sool", backref="tasting_notes", lazy="joined")

    def vector(self):
        return [
            float(self.aroma or 0),
            float(self.sweetness or 0),
            float(self.acidity or 0),
            float(self.body or 0),
            float(self.finish or 0),
        ]
