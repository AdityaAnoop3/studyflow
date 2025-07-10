from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Optional
from typing import cast
from sqlalchemy.engine import Engine
from pydantic import BaseModel
import pandas as pd

from app.models.database import get_db
from app.services.advanced_spaced_repetition import AdvancedSpacedRepetition

router = APIRouter()
sr_service = AdvancedSpacedRepetition()

class ReviewRequest(BaseModel):
    quality: int  # 0-5
    repetitions: int
    ease_factor: float
    interval: int
    topic_id: Optional[str] = None

@router.post("/calculate-next-review")
async def calculate_next_review(
    review: ReviewRequest,
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Calculate next review using advanced SM-2 with personalization
    """
    try:
        # Get user performance data for personalization
        performance_data = {}
        
        if review.topic_id:
            # Get topic-specific performance
            topic_query = f"""
            SELECT 
                AVG(s.difficulty) as avg_difficulty,
                COUNT(s.id) as session_count,
                MAX(s."completedAt") as last_studied
            FROM "StudySession" s
            JOIN "Topic" t ON s."topicId" = t.id
            WHERE t.id = '{review.topic_id}' AND t."userId" = '{user_id}'
            """
            topic_stats = pd.read_sql(topic_query, con=cast(Engine, db.bind))
            
            if not topic_stats.empty and topic_stats['avg_difficulty'].iloc[0] is not None:
                performance_data['subject_difficulty_avg'] = float(topic_stats['avg_difficulty'].iloc[0])
        
        # Get user's best performance time
        time_query = f"""
        SELECT 
            EXTRACT(hour FROM "completedAt") as hour,
            AVG(CASE WHEN difficulty <= 3 THEN 1 ELSE 0 END) as success_rate
        FROM "StudySession"
        WHERE "userId" = '{user_id}'
        GROUP BY EXTRACT(hour FROM "completedAt")
        ORDER BY success_rate DESC
        LIMIT 1
        """
        time_stats = pd.read_sql(time_query, con=cast(Engine, db.bind))
        
        if not time_stats.empty and time_stats['hour'].iloc[0] is not None:
            performance_data['best_performance_hour'] = int(time_stats['hour'].iloc[0])
        
        # Get today's session count for fatigue calculation
        today_query = f"""
        SELECT COUNT(*) as count
        FROM "StudySession"
        WHERE "userId" = '{user_id}'
        AND DATE("completedAt") = CURRENT_DATE
        """
        today_stats = pd.read_sql(today_query, con=cast(Engine, db.bind))
        
        if not today_stats.empty and today_stats['count'].iloc[0] is not None:
            performance_data['session_count_today'] = int(today_stats['count'].iloc[0])
        
        # Get quality improvement trend
        improvement_query = f"""
        WITH ordered_reviews AS (
            SELECT 
                quality,
                ROW_NUMBER() OVER (ORDER BY "completedAt" DESC) as rn
            FROM "Review" r
            JOIN "Topic" t ON r."topicId" = t.id
            WHERE t."userId" = '{user_id}' AND r.quality IS NOT NULL
        )
        SELECT 
            AVG(CASE WHEN rn <= 5 THEN quality END) - 
            AVG(CASE WHEN rn > 5 AND rn <= 10 THEN quality END) as improvement
        FROM ordered_reviews
        WHERE rn <= 10
        """
        improvement_stats = pd.read_sql(improvement_query, con=cast(Engine, db.bind))
        
        if not improvement_stats.empty and improvement_stats['improvement'].iloc[0] is not None:
            performance_data['avg_quality_improvement'] = float(improvement_stats['improvement'].iloc[0])
        
        # Calculate next review with personalization
        result = sr_service.calculate_next_interval(
            review.quality,
            review.repetitions,
            review.ease_factor,
            review.interval,
            performance_data
        )
        
        return {
            "status": "success",
            "user_id": user_id,
            "personalization_applied": bool(performance_data),
            "performance_data": performance_data,
            "next_review": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/optimal-review-times/{user_id}")
async def get_optimal_review_times(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Analyze user's performance to find optimal review times
    """
    try:
        # Get review performance history
        query = f"""
        SELECT 
            r."completedAt" as completed_at,
            r.quality,
            r.difficulty,
            t.name as topic_name
        FROM "Review" r
        JOIN "Topic" t ON r."topicId" = t.id
        WHERE t."userId" = '{user_id}' 
        AND r."completedAt" IS NOT NULL
        AND r.quality IS NOT NULL
        ORDER BY r."completedAt" DESC
        LIMIT 200
        """
        
        reviews_df = pd.read_sql(query, con=cast(Engine, db.bind))
        
        if reviews_df.empty:
            return {
                "status": "no_data",
                "message": "No completed reviews found"
            }
        
        # Analyze optimal times
        optimal_times = sr_service.get_optimal_review_time(reviews_df)
        
        return {
            "status": "success",
            "user_id": user_id,
            "optimal_times": optimal_times
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/retention-forecast/{user_id}/{topic_id}")
async def get_retention_forecast(
    user_id: str,
    topic_id: str,
    days_ahead: int = 30,
    db: Session = Depends(get_db)
):
    """
    Predict retention probability for a specific topic
    """
    try:
        # Get latest review data for the topic
        query = f"""
        SELECT 
            r."easeFactor",
            r.interval,
            r.repetitions
        FROM "Review" r
        JOIN "Topic" t ON r."topicId" = t.id
        WHERE t.id = '{topic_id}' AND t."userId" = '{user_id}'
        ORDER BY r."scheduledFor" DESC
        LIMIT 1
        """
        
        review_data = pd.read_sql(query, con=cast(Engine, db.bind))
        
        if review_data.empty:
            return {
                "status": "no_data",
                "message": "No review data found for this topic"
            }
        
        # Get topic info
        topic_query = f"""
        SELECT name FROM "Topic" WHERE id = '{topic_id}'
        """
        topic_info = pd.read_sql(topic_query, con=cast(Engine, db.bind))
        
        # Predict retention
        retention_curve = sr_service.predict_retention(
            review_data['easeFactor'].iloc[0],
            review_data['interval'].iloc[0],
            review_data['repetitions'].iloc[0],
            days_ahead
        )
        
        return {
            "status": "success",
            "user_id": user_id,
            "topic_id": topic_id,
            "topic_name": topic_info['name'].iloc[0] if not topic_info.empty else "Unknown",
            "current_interval": int(review_data['interval'].iloc[0]),
            "repetitions": int(review_data['repetitions'].iloc[0]),
            "retention_forecast": retention_curve
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))