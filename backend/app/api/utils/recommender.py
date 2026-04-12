# 🔥 Flavor Vector 기반 추천에 사용되는 공통 함수 Utilities

def flavor_vector(note):
    """
    Returns flavor vector from tasting note
    Index order must be consistent with model:
    [aroma, sweetness, acidity, body, finish]
    """
    # note가 TastingNote 인스턴스이거나 유사한 객체인 경우
    return [
        float(getattr(note, "aroma", 0) or 0),
        float(getattr(note, "sweetness", 0) or 0),
        float(getattr(note, "acidity", 0) or 0),
        float(getattr(note, "body", 0) or 0),
        float(getattr(note, "finish", 0) or 0)
    ]
