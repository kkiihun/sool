from sqlalchemy.orm import Session
from sqlalchemy import func
import numpy as np
from typing import List, Dict

from app.models.sool import Sool
from app.models.tasting_note import TastingNote
from app.models.activity import ActivityLog
from app.api.utils.recommender import flavor_vector

class RecommenderService:
    @staticmethod
    def get_user_taste_profile(db: Session, user_id: int) -> Dict[str, float]:
        """
        사용자의 활동 로그와 시음 노트를 기반으로 선호하는 맛 프로필(Vector)을 계산합니다.
        가중치: 리뷰 작성(5.0) > 조회(1.0)
        """
        # 1. 사용자가 리뷰를 남긴 술들의 맛 지표
        user_notes = db.query(TastingNote).filter(TastingNote.user_id == user_id).all()
        
        # 2. 사용자가 조회한 술들의 평균 맛 지표
        viewed_sools = db.query(Sool).join(ActivityLog, ActivityLog.sool_id == Sool.id)\
            .filter(ActivityLog.user_id == user_id, ActivityLog.action == "view").all()

        vectors = []
        weights = []

        for note in user_notes:
            vectors.append(flavor_vector(note))
            weights.append(5.0) # 리뷰 작성은 강한 선호도 표시

        for sool in viewed_sools:
            # 해당 술의 대표 맛 지표(평균) 가져오기
            avg_note = db.query(
                func.avg(TastingNote.aroma),
                func.avg(TastingNote.sweetness),
                func.avg(TastingNote.acidity),
                func.avg(TastingNote.body),
                func.avg(TastingNote.finish)
            ).filter(TastingNote.sool_id == sool.id).first()
            
            if avg_note and avg_note[0] is not None:
                vectors.append([float(v) for v in avg_note])
                weights.append(1.0) # 조회는 약한 선호도 표시

        if not vectors:
            return None

        # 가중 평균 계산
        weighted_avg = np.average(vectors, axis=0, weights=weights)
        return {
            "aroma": weighted_avg[0],
            "sweetness": weighted_avg[1],
            "acidity": weighted_avg[2],
            "body": weighted_avg[3],
            "finish": weighted_avg[4]
        }

    @staticmethod
    def recommend_personalized(db: Session, user_id: int, limit: int = 10) -> List[Dict]:
        """
        개인화된 하이브리드 추천 로직
        1. 사용자 프로필 기반 유사도 (Content-based)
        2. 다른 사용자들이 함께 본 제품 (Item-Item CF 가미 가능 - 여기선 CB 위주)
        """
        profile = RecommenderService.get_user_taste_profile(db, user_id)
        if not profile:
            # 기록이 없으면 인기 제품 추천
            return RecommenderService.get_popular_sools(db, limit)

        profile_vec = np.array([profile["aroma"], profile["sweetness"], profile["acidity"], profile["body"], profile["finish"]])

        # 전체 술의 평균 맛 지표 가져오기
        all_sool_stats = db.query(
            Sool.id,
            Sool.name,
            Sool.image_url,
            Sool.category,
            func.avg(TastingNote.aroma).label("aroma"),
            func.avg(TastingNote.sweetness).label("sweetness"),
            func.avg(TastingNote.acidity).label("acidity"),
            func.avg(TastingNote.body).label("body"),
            func.avg(TastingNote.finish).label("finish")
        ).join(TastingNote, TastingNote.sool_id == Sool.id)\
         .group_by(Sool.id).all()

        recommendations = []
        for s in all_sool_stats:
            # 이미 경험한 술 제외 로직 추가 가능
            s_vec = np.array([float(s.aroma), float(s.sweetness), float(s.acidity), float(s.body), float(s.finish)])
            
            # 코사인 유사도 계산
            norm_p = np.linalg.norm(profile_vec)
            norm_s = np.linalg.norm(s_vec)
            if norm_p == 0 or norm_s == 0:
                sim = 0
            else:
                sim = np.dot(profile_vec, s_vec) / (norm_p * norm_s)
            
            recommendations.append({
                "id": s.id,
                "name": s.name,
                "image_url": s.image_url,
                "category": s.category,
                "score": float(sim)
            })

        # 유사도 순 정렬
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:limit]

    @staticmethod
    def get_popular_sools(db: Session, limit: int = 10) -> List[Dict]:
        """조회수가 높은 인기 제품 추천"""
        popular = db.query(
            Sool.id,
            Sool.name,
            Sool.image_url,
            Sool.category,
            func.count(ActivityLog.id).label("view_count")
        ).join(ActivityLog, ActivityLog.sool_id == Sool.id)\
         .filter(ActivityLog.action == "view")\
         .group_by(Sool.id)\
         .order_by(func.count(ActivityLog.id).desc())\
         .limit(limit).all()

        return [
            {
                "id": p.id,
                "name": p.name,
                "image_url": p.image_url,
                "category": p.category,
                "score": 1.0 # 인기도 기반이므로 점수 고정 또는 정규화
            } for p in popular
        ]
