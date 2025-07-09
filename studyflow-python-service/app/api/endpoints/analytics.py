from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Optional
from datetime import datetime, timedelta
import pandas as pd
from typing import cast
from sqlalchemy.engine import Engine

from app.models.database import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter()
analytics_service = AnalyticsService()

@router.post("/analyze-patterns")
async def analyze_study_patterns(
    user_id: str,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Analyze user's study patterns using advanced analytics
    """
    try:
        # Query study sessions from database
        query = f"""
        SELECT 
            s.id,
            s.duration,
            s.difficulty,
            s.completed_at,
            s.notes,
            t.name as topic_name,
            t.id as topic_id
        FROM "StudySession" s
        JOIN "Topic" t ON s."topicId" = t.id
        WHERE s."userId" = '{user_id}'
        AND s.completed_at > '{(datetime.now() - timedelta(days=days)).isoformat()}'
        ORDER BY s.completed_at
        """
        
        sessions_df = pd.read_sql(query, con=cast(Engine, db.bind))
        
        # Analyze patterns
        analysis = analytics_service.analyze_study_patterns(sessions_df)
        
        return {
            "status": "success",
            "user_id": user_id,
            "analysis_period_days": days,
            "analysis": analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/learning-velocity/{user_id}")
async def get_learning_velocity(
    user_id: str,
    topic_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Calculate learning velocity and progress trends
    """
    try:
        # Base query
        query = f"""
        SELECT 
            s.duration,
            s.difficulty,
            s.completed_at,
            t.name as topic_name
        FROM "StudySession" s
        JOIN "Topic" t ON s."topicId" = t.id
        WHERE s."userId" = '{user_id}'
        """
        
        if topic_id:
            query += f" AND t.id = '{topic_id}'"
            
        query += " ORDER BY s.completed_at"
        
        sessions_df = pd.read_sql(query, con=cast(Engine, db.bind))
        
        if sessions_df.empty:
            return {
                "status": "no_data",
                "message": "No study sessions found"
            }
        
        # Calculate velocity metrics
        velocity_data = analytics_service._calculate_learning_velocity(sessions_df)
        
        return {
            "status": "success",
            "user_id": user_id,
            "topic_id": topic_id,
            "velocity_metrics": velocity_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/performance-forecast/{user_id}")
async def get_performance_forecast(
    user_id: str,
    days_ahead: int = 30,
    db: Session = Depends(get_db)
):
    """
    Forecast performance trends based on historical data
    """
    try:
        # Get historical data
        query = f"""
        SELECT 
            s.duration,
            s.difficulty,
            s.completed_at,
            r.quality,
            r."easeFactor",
            r.interval
        FROM "StudySession" s
        LEFT JOIN "Review" r ON s.id = r."studySessionId"
        WHERE s."userId" = '{user_id}'
        ORDER BY s.completed_at
        """
        
        data_df = pd.read_sql(query, con=cast(Engine, db.bind))
        
        if len(data_df) < 10:
            return {
                "status": "insufficient_data",
                "message": "Need at least 10 study sessions for forecasting"
            }
        
        # Simple trend forecasting
        data_df['completed_at'] = pd.to_datetime(data_df['completed_at'])
        data_df['days_from_start'] = (data_df['completed_at'] - data_df['completed_at'].min()).dt.days
        
        # Linear regression for difficulty trend
        from scipy import stats
        slope, intercept, r_value, _, _ = stats.linregress(
            data_df['days_from_start'],
            data_df['difficulty']
        )  # type: ignore
        
        # Forecast
        forecast_days = range(
            data_df['days_from_start'].max() + 1,
            data_df['days_from_start'].max() + days_ahead + 1
        )
        
        forecast = []
        for day in forecast_days:
            predicted_difficulty = max(1, min(5, intercept + slope * day))  # type: ignore
            forecast.append({
                "day": day,
                "predicted_difficulty": round(predicted_difficulty, 2),
                "confidence": abs(r_value),  # type: ignore
            })
        
        return {
            "status": "success",
            "user_id": user_id,
            "current_trend": "improving" if slope < -0.01 else "worsening" if slope > 0.01 else "stable",  # type: ignore
            "trend_strength": abs(slope),  # type: ignore
            "forecast": forecast
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))