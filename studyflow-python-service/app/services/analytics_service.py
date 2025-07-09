import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from scipy import stats
import warnings
warnings.filterwarnings('ignore')
from typing import cast
from pandas import Interval

class AnalyticsService:
    """
    Advanced analytics for study patterns and performance metrics
    """
    
    def analyze_study_patterns(self, sessions_df: pd.DataFrame) -> Dict:
        """
        Comprehensive analysis of study patterns
        """
        if sessions_df.empty:
            return self._empty_analysis()
        
        # Convert timestamps
        sessions_df['completed_at'] = pd.to_datetime(sessions_df['completed_at'])
        sessions_df['date'] = sessions_df['completed_at'].dt.date
        sessions_df['hour'] = sessions_df['completed_at'].dt.hour
        sessions_df['day_of_week'] = sessions_df['completed_at'].dt.dayofweek
        
        analysis = {
            'summary_stats': self._calculate_summary_stats(sessions_df),
            'time_patterns': self._analyze_time_patterns(sessions_df),
            'difficulty_analysis': self._analyze_difficulty_progression(sessions_df),
            'productivity_metrics': self._calculate_productivity_metrics(sessions_df),
            'topic_performance': self._analyze_topic_performance(sessions_df),
            'learning_velocity': self._calculate_learning_velocity(sessions_df),
            'recommendations': []
        }
        
        # Generate recommendations based on analysis
        analysis['recommendations'] = self._generate_recommendations(analysis)
        
        return analysis
    
    def _empty_analysis(self) -> Dict:
        return {
            'summary_stats': {
                'total_sessions': 0,
                'total_minutes': 0,
                'avg_session_length': 0,
                'study_days': 0
            },
            'time_patterns': {},
            'difficulty_analysis': {},
            'productivity_metrics': {},
            'topic_performance': {},
            'learning_velocity': {},
            'recommendations': ["Start studying to get personalized insights!"]
        }
    
    def _calculate_summary_stats(self, df: pd.DataFrame) -> Dict:
        return {
            'total_sessions': len(df),
            'total_minutes': df['duration'].sum(),
            'total_hours': round(df['duration'].sum() / 60, 1),
            'avg_session_length': round(df['duration'].mean(), 1),
            'median_session_length': df['duration'].median(),
            'study_days': df['date'].nunique(),
            'sessions_per_day': round(len(df) / df['date'].nunique(), 1),
            'longest_session': df['duration'].max(),
            'shortest_session': df['duration'].min()
        }
    
    def _analyze_time_patterns(self, df: pd.DataFrame) -> Dict:
        # Best time of day
        hourly_stats = df.groupby('hour').agg({
            'duration': ['mean', 'sum', 'count'],
            'difficulty': 'mean'
        }).round(2)
        
        # Best day of week
        daily_stats = df.groupby('day_of_week').agg({
            'duration': ['mean', 'sum', 'count'],
            'difficulty': 'mean'
        }).round(2)
        
        # Find peak performance times
        if len(hourly_stats) > 0:
            best_hour = hourly_stats['duration']['sum'].idxmax()
            most_frequent_hour = hourly_stats['duration']['count'].idxmax()
        else:
            best_hour = most_frequent_hour = None
            
        return {
            'peak_hours': {
                'most_productive': int(best_hour) if best_hour is not None else None,
                'most_frequent': int(most_frequent_hour) if most_frequent_hour is not None else None
            },
            'hourly_distribution': hourly_stats.to_dict() if not hourly_stats.empty else {},
            'weekly_distribution': daily_stats.to_dict() if not daily_stats.empty else {},
            'study_consistency': self._calculate_consistency_score(df)
        }
    
    def _analyze_difficulty_progression(self, df: pd.DataFrame) -> Dict:
        # Sort by date to see progression
        df_sorted = df.sort_values('completed_at')
        
        # Calculate rolling average difficulty
        window_size = min(7, len(df))
        if window_size > 0:
            rolling_difficulty = df_sorted['difficulty'].rolling(
                window=window_size, min_periods=1
            ).mean()
            
            # Trend analysis
            if len(df) > 5:
                x = np.arange(len(df))
                regress_result: Any = stats.linregress(x, df_sorted['difficulty'])
                slope = regress_result.slope
                r_value = regress_result.rvalue
                trend = 'increasing' if slope > 0.01 else 'decreasing' if slope < -0.01 else 'stable'
            else:
                slope = 0
                r_value = 0
                trend = 'insufficient_data'
        else:
            rolling_difficulty = pd.Series()
            slope = 0
            r_value = 0
            trend = 'no_data'
        
        return {
            'current_avg_difficulty': round(df['difficulty'].mean(), 2),
            'difficulty_trend': trend,
            'trend_strength': abs(slope),
            'consistency': r_value ** 2 if r_value else 0,
            'difficulty_by_topic': df.groupby('topic_name')['difficulty'].mean().to_dict() if 'topic_name' in df.columns else {},
            'recommendation': self._get_difficulty_recommendation(trend, df['difficulty'].mean())
        }
    
    def _calculate_productivity_metrics(self, df: pd.DataFrame) -> Dict:
        # Calculate focus score (longer sessions = better focus)
        avg_duration = df['duration'].mean()
        focus_score = min(100, (avg_duration / 60) * 100)  # 60 min = 100%
        
        # Calculate efficiency (lower difficulty over time = learning)
        recent_sessions = df.nlargest(min(10, len(df)), 'completed_at')
        older_sessions = df.nsmallest(min(10, len(df)), 'completed_at')
        
        if len(recent_sessions) > 0 and len(older_sessions) > 0:
            efficiency_improvement = (
                older_sessions['difficulty'].mean() - 
                recent_sessions['difficulty'].mean()
            ) / older_sessions['difficulty'].mean() * 100
        else:
            efficiency_improvement = 0
        
        return {
            'focus_score': round(focus_score, 1),
            'efficiency_improvement': round(efficiency_improvement, 1),
            'optimal_session_length': self._calculate_optimal_session_length(df),
            'burnout_risk': self._calculate_burnout_risk(df)
        }
    
    def _analyze_topic_performance(self, df: pd.DataFrame) -> Dict:
        if 'topic_name' not in df.columns:
            return {}
            
        topic_stats = df.groupby('topic_name').agg({
            'duration': ['sum', 'mean', 'count'],
            'difficulty': ['mean', 'std']
        }).round(2)
        
        # Calculate mastery score for each topic
        mastery_scores = {}
        for topic in topic_stats.index:
            topic_df = df[df['topic_name'] == topic].sort_values('completed_at')
            if len(topic_df) > 1:
                # Decreasing difficulty = increasing mastery
                x = np.arange(len(topic_df))
                regress_result: Any = stats.linregress(x, topic_df['difficulty'])
                slope = regress_result.slope
                mastery_scores[topic] = max(0, min(100, 50 - slope * 50))
            else:
                mastery_scores[topic] = 50  # Neutral score
        
        keys = list(mastery_scores)
        return {
            'topic_statistics': topic_stats.to_dict(),
            'mastery_scores': mastery_scores,
            'recommended_focus': min(keys, key=lambda t: mastery_scores[t]) if keys else None
        }
    
    def _calculate_learning_velocity(self, df: pd.DataFrame) -> Dict:
        if len(df) < 5:
            return {'status': 'insufficient_data'}
        
        # Group by week
        df['week'] = df['completed_at'].dt.to_period('W')
        weekly_stats = df.groupby('week').agg({
            'duration': 'sum',
            'difficulty': 'mean'
        })
        
        if len(weekly_stats) < 2:
            return {'status': 'insufficient_data'}
        
        # Calculate velocity (minutes per week trend)
        weeks = np.arange(len(weekly_stats))
        regress_result: Any = stats.linregress(weeks, weekly_stats['duration'])
        duration_slope = regress_result.slope
        
        return {
            'current_velocity': round(weekly_stats['duration'].iloc[-1], 1),
            'velocity_trend': 'increasing' if duration_slope > 0 else 'decreasing',
            'weekly_average': round(weekly_stats['duration'].mean(), 1),
            'consistency_score': round(
                (1 - weekly_stats['duration'].std() / weekly_stats['duration'].mean()) * 100, 1
            ) if weekly_stats['duration'].mean() > 0 else 0
        }
    
    def _calculate_consistency_score(self, df: pd.DataFrame) -> float:
        # Calculate how consistently the user studies
        date_range = (df['date'].max() - df['date'].min()).days + 1
        if date_range == 0:
            return 0
        
        study_days = df['date'].nunique()
        consistency = (study_days / date_range) * 100
        
        return round(consistency, 1)
    
    def _calculate_optimal_session_length(self, df: pd.DataFrame) -> int:
        # Find session length with best difficulty outcomes
        df['duration_bucket'] = pd.cut(df['duration'], bins=[0, 15, 30, 45, 60, 120, 500])
        result_series = df.groupby('duration_bucket')['difficulty'].mean()
        if result_series.empty:
            return 30  # Default
        optimal_bucket = cast(Interval, result_series.idxmin())
        return int(optimal_bucket.mid)
    
    def _calculate_burnout_risk(self, df: pd.DataFrame) -> str:
        recent_days = 7
        recent_df = df[df['completed_at'] > datetime.now() - timedelta(days=recent_days)]
        
        if len(recent_df) == 0:
            return 'low'
        
        # Factors: too many sessions, increasing difficulty, very long sessions
        sessions_per_day = len(recent_df) / recent_days
        avg_difficulty = recent_df['difficulty'].mean()
        avg_duration = recent_df['duration'].mean()
        
        risk_score = 0
        if sessions_per_day > 5:
            risk_score += 2
        elif sessions_per_day > 3:
            risk_score += 1
            
        if avg_difficulty > 4:
            risk_score += 2
        elif avg_difficulty > 3.5:
            risk_score += 1
            
        if avg_duration > 90:
            risk_score += 1
        
        if risk_score >= 4:
            return 'high'
        elif risk_score >= 2:
            return 'medium'
        return 'low'
    
    def _get_difficulty_recommendation(self, trend: str, avg_difficulty: float) -> str:
        if trend == 'increasing' and avg_difficulty > 3.5:
            return "Consider reviewing fundamentals or taking breaks between difficult topics"
        elif trend == 'decreasing':
            return "Great progress! You're mastering the material"
        elif avg_difficulty < 2:
            return "Consider challenging yourself with harder topics"
        return "Maintain your current study approach"
    
    def _generate_recommendations(self, analysis: Dict) -> List[str]:
        recommendations = []
        
        # Time-based recommendations
        if 'time_patterns' in analysis and 'peak_hours' in analysis['time_patterns']:
            peak_hour = analysis['time_patterns']['peak_hours']['most_productive']
            if peak_hour is not None:
                recommendations.append(
                    f"Schedule important study sessions around {peak_hour}:00 when you're most productive"
                )
        
        # Difficulty recommendations
        if 'difficulty_analysis' in analysis:
            diff = analysis['difficulty_analysis']
            if diff.get('current_avg_difficulty', 0) > 4:
                recommendations.append(
                    "Current material is very challenging. Consider breaking topics into smaller chunks"
                )
        
        # Productivity recommendations
        if 'productivity_metrics' in analysis:
            prod = analysis['productivity_metrics']
            if prod.get('burnout_risk') == 'high':
                recommendations.append(
                    "High burnout risk detected. Schedule regular breaks and vary your study topics"
                )
            if prod.get('optimal_session_length'):
                recommendations.append(
                    f"Your optimal session length is {prod['optimal_session_length']} minutes"
                )
        
        # Topic recommendations
        if 'topic_performance' in analysis:
            topic_perf = analysis['topic_performance']
            if topic_perf.get('recommended_focus'):
                recommendations.append(
                    f"Focus more on '{topic_perf['recommended_focus']}' which needs improvement"
                )
        
        return recommendations[:5]  # Top 5 recommendations