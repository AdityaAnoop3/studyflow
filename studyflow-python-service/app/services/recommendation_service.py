import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import warnings
warnings.filterwarnings('ignore')

class RecommendationService:
    """
    ML-based study recommendations using clustering and pattern analysis
    """
    
    def generate_study_plan(
        self,
        user_sessions: pd.DataFrame,
        user_reviews: pd.DataFrame,
        available_hours: float = 2.0,
        goals: Optional[Dict] = None
    ) -> Dict:
        """
        Generate personalized study plan based on performance and goals
        """
        if user_sessions.empty:
            return self._default_study_plan(available_hours)
        
        # Analyze current state
        current_state = self._analyze_current_state(user_sessions, user_reviews)
        
        # Identify learning patterns
        patterns = self._identify_learning_patterns(user_sessions)
        
        # Generate recommendations
        plan = {
            'daily_schedule': self._create_daily_schedule(
                patterns, available_hours, current_state
            ),
            'topic_priorities': self._prioritize_topics(
                user_sessions, user_reviews, goals
            ),
            'study_techniques': self._recommend_techniques(patterns),
            'milestone_predictions': self._predict_milestones(
                user_sessions, goals
            ),
            'personalized_tips': self._generate_tips(patterns, current_state)
        }
        
        return plan
    
    def _default_study_plan(self, available_hours: float) -> Dict:
        return {
            'daily_schedule': {
                'recommended_sessions': 2,
                'session_length': min(45, int(available_hours * 60 / 2)),
                'break_duration': 10,
                'best_time': "10:00-12:00"
            },
            'topic_priorities': [],
            'study_techniques': [
                "Start with 25-minute focused sessions (Pomodoro Technique)",
                "Review notes immediately after each session",
                "Use active recall instead of passive reading"
            ],
            'milestone_predictions': {},
            'personalized_tips': [
                "Build a consistent daily study habit",
                "Track your progress to stay motivated"
            ]
        }
    
    def _analyze_current_state(
        self,
        sessions: pd.DataFrame,
        reviews: pd.DataFrame
    ) -> Dict:
        """
        Analyze user's current learning state
        """
        # Recent performance
        recent_sessions = sessions[
            sessions['completed_at'] > datetime.now() - timedelta(days=7)
        ]
        
        state = {
            'avg_daily_minutes': 0,
            'current_streak': 0,
            'performance_trend': 'stable',
            'focus_level': 'medium',
            'review_compliance': 0
        }
        
        if not recent_sessions.empty:
            # Daily study time
            daily_minutes = recent_sessions.groupby(
                recent_sessions['completed_at'].dt.date
            )['duration'].sum()
            state['avg_daily_minutes'] = daily_minutes.mean()
            
            # Calculate streak
            dates = set(recent_sessions['completed_at'].dt.date)
            today = datetime.now().date()
            streak = 0
            current_date = today
            
            while current_date in dates or current_date == today:
                if current_date in dates:
                    streak += 1
                current_date -= timedelta(days=1)
                if streak > 0 and current_date not in dates:
                    break
                    
            state['current_streak'] = streak
            
            # Performance trend
            if len(recent_sessions) > 3:
                recent_diff = recent_sessions.tail(3)['difficulty'].mean()
                older_diff = recent_sessions.head(3)['difficulty'].mean()
                if recent_diff < older_diff - 0.3:
                    state['performance_trend'] = 'improving'
                elif recent_diff > older_diff + 0.3:
                    state['performance_trend'] = 'struggling'
            
            # Focus level based on session duration
            avg_duration = recent_sessions['duration'].mean()
            if avg_duration > 60:
                state['focus_level'] = 'high'
            elif avg_duration < 30:
                state['focus_level'] = 'low'
        
        # Review compliance
        if not reviews.empty:
            due_reviews = reviews[reviews['scheduled_for'] <= datetime.now()]
            completed_reviews = due_reviews[due_reviews['completed_at'].notna()]
            if len(due_reviews) > 0:
                state['review_compliance'] = len(completed_reviews) / len(due_reviews)
        
        return state
    
    def _identify_learning_patterns(self, sessions: pd.DataFrame) -> Dict:
        """
        Use clustering to identify learning patterns
        """
        if len(sessions) < 10:
            return {'pattern_type': 'insufficient_data'}
        
        # Prepare features for clustering
        features = []
        for _, session in sessions.iterrows():
            features.append([
                session['duration'],
                session['difficulty'],
                session['completed_at'].hour,
                session['completed_at'].dayofweek
            ])
        
        # Standardize features
        scaler = StandardScaler()
        features_np = np.array(features)
        features_scaled = scaler.fit_transform(features_np)
        
        # Cluster sessions
        n_clusters = min(3, len(sessions) // 5)
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        clusters = kmeans.fit_predict(features_scaled)
        
        # Analyze clusters
        sessions['cluster'] = clusters
        cluster_profiles = {}
        
        for cluster_id in range(n_clusters):
            cluster_sessions = sessions[sessions['cluster'] == cluster_id]
            profile = {
                'avg_duration': cluster_sessions['duration'].mean(),
                'avg_difficulty': cluster_sessions['difficulty'].mean(),
                'preferred_hour': int(cluster_sessions['completed_at'].dt.hour.mode()[0]),
                'session_count': len(cluster_sessions)
            }
            cluster_profiles[f'pattern_{cluster_id}'] = profile
        
        # Determine dominant pattern
        dominant_pattern = max(
            cluster_profiles.items(),
            key=lambda x: x[1]['session_count']
        )[0]
        
        return {
            'pattern_type': 'analyzed',
            'dominant_pattern': dominant_pattern,
            'patterns': cluster_profiles,
            'variety_score': len(cluster_profiles) / n_clusters
        }
    
    def _create_daily_schedule(
        self,
        patterns: Dict,
        available_hours: float,
        current_state: Dict
    ) -> Dict:
        """
        Create optimized daily study schedule
        """
        schedule = {
            'recommended_sessions': 2,
            'session_length': 45,
            'break_duration': 15,
            'best_times': [],
            'total_time': 0
        }
        
        # Adjust based on patterns
        if patterns.get('pattern_type') == 'analyzed':
            dominant = patterns['patterns'][patterns['dominant_pattern']]
            
            # Session length based on historical average
            schedule['session_length'] = min(
                90,
                max(25, int(dominant['avg_duration']))
            )
            
            # Best time based on pattern
            best_hour = dominant['preferred_hour']
            schedule['best_times'] = [
                f"{best_hour:02d}:00-{(best_hour+1):02d}:00",
                f"{(best_hour+2):02d}:00-{(best_hour+3):02d}:00"
            ]
        
        # Adjust based on available time
        max_sessions = int(available_hours * 60 / (schedule['session_length'] + schedule['break_duration']))
        schedule['recommended_sessions'] = min(max_sessions, 3)
        
        # Adjust based on current state
        if current_state['focus_level'] == 'low':
            schedule['session_length'] = min(30, schedule['session_length'])
            schedule['break_duration'] = 20
        elif current_state['focus_level'] == 'high':
            schedule['session_length'] = min(60, schedule['session_length'])
        
        schedule['total_time'] = (
            schedule['recommended_sessions'] * 
            (schedule['session_length'] + schedule['break_duration'])
        )
        
        return schedule
    
    def _prioritize_topics(
        self,
        sessions: pd.DataFrame,
        reviews: pd.DataFrame,
        goals: Optional[Dict]
    ) -> List[Dict]:
        """
        Prioritize topics based on multiple factors
        """
        if 'topic_name' not in sessions.columns:
            return []
        
        topic_stats = sessions.groupby('topic_name').agg({
            'duration': ['sum', 'count'],
            'difficulty': ['mean', 'last'],
            'completed_at': 'max'
        })
        
        priorities = []
        
        for topic in topic_stats.index:
            topic_data = topic_stats.loc[topic]
            
            # Calculate priority score
            score = 0
            
            # Recency (days since last study)
            days_since = (datetime.now() - topic_data['completed_at']['max']).days
            if days_since > 7:
                score += 20
            elif days_since > 3:
                score += 10
            
            # Difficulty (prioritize struggling topics)
            if topic_data['difficulty']['last'] > 3.5:
                score += 15
            
            # Time investment (less studied = higher priority)
            total_hours = topic_data['duration']['sum'] / 60
            if total_hours < 2:
                score += 10
            
            # Review performance
            if not reviews.empty:
                topic_reviews = reviews[reviews['topic_name'] == topic]
                if not topic_reviews.empty:
                    avg_quality = topic_reviews['quality'].mean()
                    if avg_quality < 3:
                        score += 15
            
            priorities.append({
                'topic': topic,
                'priority_score': score,
                'last_studied': topic_data['completed_at']['max'].strftime('%Y-%m-%d'),
                'total_time': int(topic_data['duration']['sum']),
                'difficulty': round(topic_data['difficulty']['mean'], 1),
                'recommendation': self._get_topic_recommendation(score, topic_data)
            })
        
        # Sort by priority
        priorities.sort(key=lambda x: x['priority_score'], reverse=True)
        
        return priorities[:5]  # Top 5 priorities
    
    def _recommend_techniques(self, patterns: Dict) -> List[str]:
        """
        Recommend study techniques based on patterns
        """
        techniques = []
        
        if patterns.get('pattern_type') == 'analyzed':
            dominant = patterns['patterns'][patterns['dominant_pattern']]
            
            # Short sessions
            if dominant['avg_duration'] < 30:
                techniques.append(
                    "Try the Pomodoro Technique: 25 minutes focused study, 5 minute break"
                )
            
            # Long sessions
            elif dominant['avg_duration'] > 60:
                techniques.append(
                    "Use the 50-10 rule: 50 minutes study, 10 minute break"
                )
                techniques.append(
                    "Include active breaks with light physical activity"
                )
            
            # High difficulty
            if dominant['avg_difficulty'] > 3.5:
                techniques.append(
                    "Break complex topics into smaller, manageable chunks"
                )
                techniques.append(
                    "Use the Feynman Technique: explain concepts in simple terms"
                )
            
            # Low difficulty
            elif dominant['avg_difficulty'] < 2.5:
                techniques.append(
                    "Challenge yourself with practice problems"
                )
                techniques.append(
                    "Try teaching the material to someone else"
                )
        
        # Always include these
        techniques.extend([
            "Use active recall instead of passive re-reading",
            "Create visual summaries or mind maps",
            "Test yourself regularly with practice problems"
        ])
        
        return techniques[:5]
    
    def _predict_milestones(
        self,
        sessions: pd.DataFrame,
        goals: Optional[Dict]
    ) -> Dict:
        """
        Predict when user will reach certain milestones
        """
        if len(sessions) < 5:
            return {'status': 'insufficient_data'}
        
        # Calculate learning rate
        sessions_sorted = sessions.sort_values('completed_at')
        
        # Weekly progress
        weekly_duration = sessions_sorted.groupby(
            pd.Grouper(key='completed_at', freq='W')
        )['duration'].sum()
        
        if len(weekly_duration) < 2:
            return {'status': 'insufficient_data'}
        
        avg_weekly_minutes = weekly_duration.mean()
        
        predictions: Dict[str, Any] = {
            'next_100_hours': None,
            'difficulty_improvement': None,
            'consistency_achievement': None
        }
        
        # Predict 100 hours milestone
        total_minutes = sessions['duration'].sum()
        remaining_to_100h = max(0, 6000 - total_minutes)  # 100 hours = 6000 minutes
        if avg_weekly_minutes > 0:
            weeks_to_100h = remaining_to_100h / avg_weekly_minutes
            predictions['next_100_hours'] = {
                'weeks': round(weeks_to_100h, 1),
                'date': (datetime.now() + timedelta(weeks=weeks_to_100h)).strftime('%Y-%m-%d'),
                'current_hours': round(total_minutes / 60, 1)
            }
        
        # Predict difficulty improvement
        if len(sessions) > 10:
            recent_avg = sessions_sorted.tail(5)['difficulty'].mean()
            improvement_rate = 0.1  # Assume 0.1 difficulty reduction per week
            weeks_to_easy = max(0, (recent_avg - 2.0) / improvement_rate)
            predictions['difficulty_improvement'] = {
                'weeks_to_comfortable': round(weeks_to_easy, 1),
                'current_difficulty': round(recent_avg, 1)
            }
        
        return predictions
    
    def _generate_tips(self, patterns: Dict, state: Dict) -> List[str]:
        """
        Generate personalized study tips
        """
        tips = []
        
        # Streak-based tips
        if state['current_streak'] > 7:
            tips.append("Great streak! Keep the momentum going")
        elif state['current_streak'] == 0:
            tips.append("Start a new streak today - consistency is key")
        
        # Performance-based tips
        if state['performance_trend'] == 'improving':
            tips.append("You're making great progress! Consider challenging yourself more")
        elif state['performance_trend'] == 'struggling':
            tips.append("Take time to review fundamentals before moving forward")
        
        # Review compliance tips
        if state['review_compliance'] < 0.7:
            tips.append("Complete your reviews on time for better retention")
        
        # Focus-based tips
        if state['focus_level'] == 'low':
            tips.append("Try studying in a distraction-free environment")
            tips.append("Start with just 15-minute sessions and build up")
        elif state['focus_level'] == 'high':
            tips.append("Your focus is excellent! Ensure you take breaks to avoid burnout")
        
        # Pattern variety tips
        if patterns.get('variety_score', 0) < 0.5:
            tips.append("Try varying your study times and session lengths")
        
        return tips[:5]
    
    def _get_topic_recommendation(self, score: int, topic_data: pd.Series) -> str:
        """
        Get specific recommendation for a topic
        """
        if score > 40:
            return "High priority - schedule a session today"
        elif score > 25:
            return "Medium priority - review within 3 days"
        elif topic_data['difficulty']['last'] > 4:
            return "Difficult topic - consider breaking into subtopics"
        elif topic_data['duration']['sum'] < 60:
            return "Needs more practice time"
        else:
            return "On track - maintain regular review"