import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import pandas as pd

class AdvancedSpacedRepetition:
    """
    Enhanced SM-2 algorithm with personalized adjustments based on:
    - Time of day performance
    - Subject difficulty patterns
    - Individual learning speed
    - Fatigue factors
    """
    
    def __init__(self):
        self.base_ease_factor = 2.5
        self.min_ease_factor = 1.3
        self.max_ease_factor = 3.0
        
    def calculate_next_interval(
        self,
        quality: int,
        repetitions: int,
        ease_factor: float,
        interval: int,
        user_performance_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Enhanced SM-2 calculation with personalized adjustments
        """
        # Basic SM-2 calculation
        new_ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        new_ease_factor = max(self.min_ease_factor, min(self.max_ease_factor, new_ease_factor))
        
        # Apply personalized adjustments if data available
        if user_performance_data:
            new_ease_factor = self._apply_personalization(
                new_ease_factor,
                user_performance_data
            )
        
        # Calculate interval
        if quality >= 3:
            if repetitions == 0:
                new_interval = 1
            elif repetitions == 1:
                new_interval = 6
            else:
                new_interval = round(interval * new_ease_factor)
            new_repetitions = repetitions + 1
        else:
            new_repetitions = 0
            new_interval = 1
            
        # Apply fatigue adjustment
        if user_performance_data and 'session_count_today' in user_performance_data:
            new_interval = self._apply_fatigue_adjustment(
                new_interval,
                user_performance_data['session_count_today']
            )
        
        return {
            'interval': new_interval,
            'ease_factor': new_ease_factor,
            'repetitions': new_repetitions,
            'quality': quality,
            'confidence': self._calculate_confidence(quality, repetitions),
            'next_review_date': (datetime.now() + timedelta(days=new_interval)).isoformat()
        }
    
    def _apply_personalization(self, ease_factor: float, performance_data: Dict[str, Any]) -> float:
        """
        Adjust ease factor based on individual performance patterns
        """
        adjustments = []
        
        # Time of day adjustment
        if 'best_performance_hour' in performance_data:
            current_hour = datetime.now().hour
            best_hour = performance_data['best_performance_hour']
            hour_diff = abs(current_hour - best_hour)
            if hour_diff > 12:
                hour_diff = 24 - hour_diff
            
            # Reduce ease factor if studying far from optimal time
            time_penalty = (hour_diff / 12) * 0.2
            adjustments.append(-time_penalty)
        
        # Subject difficulty adjustment
        if 'subject_difficulty_avg' in performance_data:
            avg_difficulty = performance_data['subject_difficulty_avg']
            if avg_difficulty > 3.5:  # Hard subject
                adjustments.append(-0.1)
            elif avg_difficulty < 2.5:  # Easy subject
                adjustments.append(0.1)
        
        # Learning speed adjustment
        if 'avg_quality_improvement' in performance_data:
            improvement = performance_data['avg_quality_improvement']
            if improvement > 0.5:  # Fast learner
                adjustments.append(0.15)
            elif improvement < -0.2:  # Struggling
                adjustments.append(-0.15)
        
        # Apply all adjustments
        total_adjustment = sum(adjustments)
        adjusted_ease = ease_factor + total_adjustment
        
        return max(self.min_ease_factor, min(self.max_ease_factor, adjusted_ease))
    
    def _apply_fatigue_adjustment(self, interval: int, session_count: int) -> int:
        """
        Reduce interval if user has had many sessions today (fatigue)
        """
        if session_count > 5:
            fatigue_factor = 0.8
        elif session_count > 3:
            fatigue_factor = 0.9
        else:
            fatigue_factor = 1.0
            
        return max(1, round(interval * fatigue_factor))
    
    def _calculate_confidence(self, quality: int, repetitions: int) -> float:
        """
        Calculate confidence in retention (0-1)
        """
        base_confidence = quality / 5.0
        repetition_bonus = min(0.3, repetitions * 0.05)
        return min(1.0, base_confidence * 0.7 + repetition_bonus)
    
    def get_optimal_review_time(self, user_performance_history: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze user's performance history to find optimal review times
        """
        if user_performance_history.empty:
            return {
                'best_hour': 10,  # Default to 10 AM
                'best_day_of_week': 1,  # Tuesday
                'performance_by_hour': {},
                'performance_by_day': {}
            }
        
        # Add hour and day of week
        user_performance_history['hour'] = pd.to_datetime(
            user_performance_history['completed_at']
        ).dt.hour
        user_performance_history['day_of_week'] = pd.to_datetime(
            user_performance_history['completed_at']
        ).dt.dayofweek
        
        # Calculate average quality by hour
        hourly_performance = user_performance_history.groupby('hour')['quality'].agg(['mean', 'count'])
        hourly_performance = hourly_performance[hourly_performance['count'] >= 2]  # Min 2 sessions
        
        # Calculate average quality by day of week
        daily_performance = user_performance_history.groupby('day_of_week')['quality'].agg(['mean', 'count'])
        
        best_hour = int(hourly_performance['mean'].idxmax()) if not hourly_performance.empty else 10
        best_day = int(daily_performance['mean'].idxmax()) if not daily_performance.empty else 1
        
        return {
            'best_hour': int(best_hour),
            'best_day_of_week': int(best_day),
            'performance_by_hour': hourly_performance['mean'].to_dict(),
            'performance_by_day': daily_performance['mean'].to_dict(),
            'recommendation': f"Your best performance is at {best_hour}:00 on {self._day_name(best_day)}s"
        }
    
    def _day_name(self, day_num: int) -> str:
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return days[day_num]
    
    def predict_retention(
        self,
        ease_factor: float,
        interval: int,
        repetitions: int,
        days_ahead: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Predict retention probability over the next N days
        """
        retention_curve = []
        
        for day in range(1, days_ahead + 1):
            # Forgetting curve: R = e^(-t/S)
            # Where t is time and S is strength (related to interval)
            strength = interval * ease_factor * (1 + repetitions * 0.1)
            retention = np.exp(-day / strength)
            
            retention_curve.append({
                'day': day,
                'retention_probability': round(retention, 3),
                'review_recommended': retention < 0.8  # Recommend review if below 80%
            })
        
        return retention_curve