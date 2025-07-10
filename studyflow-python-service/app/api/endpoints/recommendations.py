from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Optional, List
from pydantic import BaseModel
import pandas as pd
from typing import cast, Any
from sqlalchemy.engine import Engine

from app.models.database import get_db
from app.services.recommendation_service import RecommendationService

router = APIRouter()
recommendation_service = RecommendationService()

class StudyGoals(BaseModel):
    target_hours_per_week: Optional[float] = None
    target_topics: Optional[List[str]] = None
    difficulty_preference: Optional[str] = None  # "easy", "medium", "hard"

@router.post("/study-plan")
async def generate_study_plan(
    user_id: str,
    available_hours_per_day: float = 2.0,
    goals: Optional[StudyGoals] = None,
    db: Session = Depends(get_db)
):
    """
    Generate personalized study plan with ML-based recommendations
    """
    try:
        # Get user's study sessions
        sessions_query = f"""
        SELECT 
            s.*,
            t.name as topic_name
        FROM "StudySession" s
        JOIN "Topic" t ON s."topicId" = t.id
        WHERE s."userId" = '{user_id}'
        ORDER BY s."completedAt" DESC
        LIMIT 100
        """
        sessions_df = pd.read_sql(sessions_query, con=cast(Engine, db.bind))
        
        # Get user's reviews
        reviews_query = f"""
        SELECT 
            r.*,
            t.name as topic_name
        FROM "Review" r
        JOIN "Topic" t ON r."topicId" = t.id
        WHERE t."userId" = '{user_id}'
        ORDER BY r."scheduledFor" DESC
        LIMIT 100
        """
        reviews_df = pd.read_sql(reviews_query, con=cast(Engine, db.bind))
        
        # Generate study plan
        plan = recommendation_service.generate_study_plan(
            sessions_df,
            reviews_df,
            available_hours_per_day,
            goals.dict() if goals else None
        )
        
        return {
            "status": "success",
            "user_id": user_id,
            "study_plan": plan
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/topic-recommendations/{user_id}")
async def get_topic_recommendations(
    user_id: str,
    limit: int = 5,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get personalized topic recommendations based on performance
    """
    try:
        # Get topic performance data
        query = f"""
        SELECT 
            t.id,
            t.name,
            t.description,
            COUNT(s.id) as session_count,
            AVG(s.duration) as avg_duration,
            AVG(s.difficulty) as avg_difficulty,
            MAX(s."completedAt") as last_studied,
            AVG(r.quality) as avg_review_quality
        FROM "Topic" t
        LEFT JOIN "StudySession" s ON t.id = s."topicId"
        LEFT JOIN "Review" r ON t.id = r."topicId"
        WHERE t."userId" = '{user_id}'
        GROUP BY t.id, t.name, t.description
        """
        
        topics_df = pd.read_sql(query, con=cast(Engine, db.bind))
        
        if topics_df.empty:
            return {
                "status": "no_topics",
                "recommendations": []
            }
        
        # Calculate recommendation scores
        recommendations = []
        
        for _, topic in topics_df.iterrows():
            score = 0
            reasons = []
            
            # Low session count = needs more study
            if topic['session_count'] < 5:
                score += 30
                reasons.append("Needs more practice")
            
            # High difficulty = needs attention
            if topic['avg_difficulty'] and topic['avg_difficulty'] > 3.5:
                score += 20
                reasons.append("Challenging topic")
            
            # Poor review performance
            if topic['avg_review_quality'] and topic['avg_review_quality'] < 3:
                score += 25
                reasons.append("Review performance needs improvement")
            
            # Not studied recently
            if topic['last_studied']:
                days_since = (pd.Timestamp.now() - pd.to_datetime(topic['last_studied'])).days
                if days_since > 7:
                    score += 15
                    reasons.append(f"Not studied in {days_since} days")
            
            recommendations.append({
                "topic_id": topic['id'],
                "topic_name": topic['name'],
                "description": topic['description'],
                "recommendation_score": score,
                "reasons": reasons,
                "suggested_action": recommendation_service._get_topic_recommendation(score, topic)
            })
        
        # Sort by score and limit
        recommendations.sort(key=lambda x: x['recommendation_score'], reverse=True)
        
        return {
            "status": "success",
            "user_id": user_id,
            "recommendations": recommendations[:limit]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/study-insights/{user_id}")
async def get_study_insights(
    user_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get AI-powered insights about study habits
    """
    try:
        # Get comprehensive study data
        query = f"""
        SELECT 
            s.duration,
            s.difficulty,
            s.completed_at,
            t.name as topic_name,
            EXTRACT(hour FROM s."completedAt") as hour,
            EXTRACT(dow FROM s."completedAt") as day_of_week
        FROM "StudySession" s
        JOIN "Topic" t ON s."topicId" = t.id
        WHERE s."userId" = '{user_id}'
        ORDER BY s."completedAt" DESC
        """
        
        sessions_df = pd.read_sql(query, con=cast(Engine, db.bind))
        
        if sessions_df.empty:
            return {
                "status": "no_data",
                "insights": []
            }
        
        insights = []
        
        # Time preference insight
        hour_counts = sessions_df['hour'].value_counts()
        if not hour_counts.empty:
            best_hour = hour_counts.idxmax()
            insights.append({
                "type": "time_preference",
                "insight": f"You study most effectively at {int(best_hour)}:00",
                "confidence": 0.8
            })
        
        # Difficulty progression insight
        if len(sessions_df) > 10:
            recent = sessions_df.head(10)['difficulty'].mean()
            older = sessions_df.tail(10)['difficulty'].mean()
            
            if recent < older - 0.5:
                insights.append({
                    "type": "progress",
                    "insight": "You're handling increasingly difficult material with ease",
                    "confidence": 0.9
                })
            elif recent > older + 0.5:
                insights.append({
                    "type": "challenge",
                    "insight": "Recent topics are more challenging - consider more review time",
                    "confidence": 0.85
                })
        
        # Consistency insight
        dates = pd.to_datetime(sessions_df['completed_at']).dt.date.unique()
        date_range = (dates.max() - dates.min()).days + 1
        consistency = len(dates) / date_range if date_range > 0 else 0
        
        if consistency > 0.7:
            insights.append({
                "type": "consistency",
                "insight": "Excellent study consistency! You study {:.0%} of days".format(consistency),
                "confidence": 0.95
            })
        elif consistency < 0.3:
            insights.append({
                "type": "consistency",
                "insight": "More consistent study schedule would improve retention",
                "confidence": 0.9
            })
        
        return {
            "status": "success",
            "user_id": user_id,
            "insights": insights
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _get_suggested_action(score: int, topic: pd.Series) -> str:
    if score > 60:
        return "Schedule an immediate review session"
    elif score > 40:
        return "Plan a study session this week"
    elif topic['avg_difficulty'] and topic['avg_difficulty'] > 4:
        return "Break down into subtopics for easier learning"
    else:
        return "Continue regular review schedule"