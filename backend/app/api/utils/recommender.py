# 🔥 Flavor Vector 기반 추천에 사용되는 공통 함수 Utilities

def flavor_vector(note):
    """
    Returns flavor vector from tasting note
    Index order must be consistent with model:
    [aroma, sweetness, acidity, body, finish]
    """
    return [
        float(note.aroma or 0),
        float(note.sweetness or 0),
        float(note.acidity or 0),
        float(note.body or 0),
        float(note.finish or 0)
    ]
