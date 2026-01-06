"""
Database service for CME Detection System
Handles all database operations and provides data access layer
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import json
import logging

from database import (
    CMEEventDB, AnalysisSessionDB, ParticleDataDB, SystemStatusDB,
    get_db, SessionLocal
)

class DatabaseService:
    """Service class for database operations"""
    
    @staticmethod
    def save_cme_events(events: List[Dict[str, Any]], session_id: Optional[int] = None) -> bool:
        """Save CME events to database"""
        db = SessionLocal()
        try:
            for event_data in events:
                # Generate event name based on datetime
                event_datetime = datetime.fromisoformat(event_data['datetime'].replace('Z', '+00:00'))
                event_name = f"CME_{event_datetime.strftime('%Y%m%d_%H%M')}"
                
                cme_event = CMEEventDB(
                    name=event_name,  # Added name field
                    datetime=event_datetime,
                    speed=event_data['speed'],
                    angular_width=event_data['angular_width'],
                    source_location=event_data['source_location'],
                    estimated_arrival=datetime.fromisoformat(event_data['estimated_arrival'].replace('Z', '+00:00')),
                    confidence=event_data['confidence'],
                    analysis_type=event_data.get('analysis_type', 'full'),
                    sync_timestamp=datetime.now()  # Added sync timestamp
                )
                db.add(cme_event)
            
            db.commit()
            logging.info(f"Saved {len(events)} CME events to database")
            return True
        except Exception as e:
            logging.error(f"Error saving CME events: {e}")
            db.rollback()
            return False
        finally:
            db.close()
    
    @staticmethod
    def save_analysis_session(start_date: str, end_date: str, analysis_type: str, 
                            events_count: int, processing_time: float, 
                            advanced_settings: Optional[Dict] = None) -> Optional[int]:
        """Save analysis session to database"""
        db = SessionLocal()
        try:
            # Generate session name based on datetime
            session_name = f"Analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            session = AnalysisSessionDB(
                session_name=session_name,  # Added session name
                start_date=datetime.fromisoformat(start_date),
                end_date=datetime.fromisoformat(end_date),
                analysis_type=analysis_type,
                events_found=events_count,
                processing_time=processing_time,
                advanced_settings=json.dumps(advanced_settings) if advanced_settings else None,
                sync_timestamp=datetime.now()  # Added sync timestamp
            )
            db.add(session)
            db.commit()
            
            logging.info(f"Saved analysis session '{session_name}' with {events_count} events")
            return session.id
        except Exception as e:
            logging.error(f"Error saving analysis session: {e}")
            db.rollback()
            return None
        finally:
            db.close()
    
    @staticmethod
    def save_particle_data(data: List[Dict[str, Any]], data_name: str = None) -> bool:
        """Save particle data to database"""
        db = SessionLocal()
        try:
            # Generate data name if not provided
            if not data_name:
                data_name = f"ParticleData_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            for data_point in data:
                particle_data = ParticleDataDB(
                    data_name=data_name,  # Added data name
                    timestamp=datetime.fromisoformat(data_point['timestamp'].replace('Z', '+00:00')),
                    velocity=data_point.get('velocity'),
                    density=data_point.get('density'),
                    temperature=data_point.get('temperature'),
                    flux=data_point.get('flux'),
                    source=data_point.get('source', 'SWIS-ASPEX'),
                    sync_timestamp=datetime.now()  # Added sync timestamp
                )
                db.add(particle_data)
            
            db.commit()
            logging.info(f"Saved {len(data)} particle data points to database as '{data_name}'")
            return True
        except Exception as e:
            logging.error(f"Error saving particle data: {e}")
            db.rollback()
            return False
        finally:
            db.close()
    
    @staticmethod
    def get_cme_events(start_date: Optional[str] = None, end_date: Optional[str] = None, 
                      limit: int = 100) -> List[Dict[str, Any]]:
        """Retrieve CME events from database"""
        db = SessionLocal()
        try:
            query = db.query(CMEEventDB)
            
            if start_date:
                query = query.filter(CMEEventDB.datetime >= datetime.fromisoformat(start_date))
            if end_date:
                query = query.filter(CMEEventDB.datetime <= datetime.fromisoformat(end_date))
            
            events = query.order_by(CMEEventDB.datetime.desc()).limit(limit).all()
            
            return [
                {
                    'id': event.id,
                    'datetime': event.datetime.isoformat(),
                    'speed': event.speed,
                    'angular_width': event.angular_width,
                    'source_location': event.source_location,
                    'estimated_arrival': event.estimated_arrival.isoformat() if event.estimated_arrival else None,
                    'confidence': event.confidence,
                    'analysis_type': event.analysis_type
                }
                for event in events
            ]
        except Exception as e:
            logging.error(f"Error retrieving CME events: {e}")
            return []
        finally:
            db.close()
    
    @staticmethod
    def get_particle_data(start_date: Optional[str] = None, end_date: Optional[str] = None, 
                         limit: int = 1000) -> List[Dict[str, Any]]:
        """Retrieve particle data from database"""
        db = SessionLocal()
        try:
            query = db.query(ParticleDataDB)
            
            if start_date:
                query = query.filter(ParticleDataDB.timestamp >= datetime.fromisoformat(start_date))
            if end_date:
                query = query.filter(ParticleDataDB.timestamp <= datetime.fromisoformat(end_date))
            
            data = query.order_by(ParticleDataDB.timestamp.asc()).limit(limit).all()
            
            return [
                {
                    'timestamp': point.timestamp.isoformat(),
                    'velocity': point.velocity,
                    'density': point.density,
                    'temperature': point.temperature,
                    'flux': point.flux,
                    'source': point.source
                }
                for point in data
            ]
        except Exception as e:
            logging.error(f"Error retrieving particle data: {e}")
            return []
        finally:
            db.close()
    
    @staticmethod
    def update_system_status(status_data: Dict[str, Any]) -> bool:
        """Update system status in database"""
        db = SessionLocal()
        try:
            # Get the latest status record or create new one
            status = db.query(SystemStatusDB).order_by(SystemStatusDB.updated_at.desc()).first()
            
            if not status:
                status = SystemStatusDB()
                db.add(status)
            
            # Update fields
            if 'mission_status' in status_data:
                status.mission_status = status_data['mission_status']
            if 'system_health' in status_data:
                status.system_health = status_data['system_health']
            if 'data_coverage' in status_data:
                status.data_coverage = status_data['data_coverage']
            if 'total_cme_events' in status_data:
                status.total_cme_events = status_data['total_cme_events']
            if 'active_alerts' in status_data:
                status.active_alerts = status_data['active_alerts']
            
            status.last_data_update = datetime.utcnow()
            status.updated_at = datetime.utcnow()
            
            db.commit()
            logging.info("System status updated successfully")
            return True
        except Exception as e:
            logging.error(f"Error updating system status: {e}")
            db.rollback()
            return False
        finally:
            db.close()
    
    @staticmethod
    def get_system_status() -> Optional[Dict[str, Any]]:
        """Get current system status from database"""
        db = SessionLocal()
        try:
            status = db.query(SystemStatusDB).order_by(SystemStatusDB.updated_at.desc()).first()
            
            if status:
                return {
                    'mission_status': status.mission_status,
                    'system_health': status.system_health,
                    'data_coverage': status.data_coverage,
                    'last_update': status.last_data_update.isoformat() if status.last_data_update else datetime.utcnow().isoformat(),
                    'total_cme_events': status.total_cme_events,
                    'active_alerts': status.active_alerts
                }
            return None
        except Exception as e:
            logging.error(f"Error retrieving system status: {e}")
            return None
        finally:
            db.close()
    
    @staticmethod
    def get_analysis_history(limit: int = 50) -> List[Dict[str, Any]]:
        """Get analysis session history from database"""
        db = SessionLocal()
        try:
            sessions = db.query(AnalysisSessionDB).order_by(AnalysisSessionDB.created_at.desc()).limit(limit).all()
            
            return [
                {
                    'id': session.id,
                    'start_date': session.start_date.isoformat(),
                    'end_date': session.end_date.isoformat(),
                    'analysis_type': session.analysis_type,
                    'events_found': session.events_found,
                    'processing_time': session.processing_time,
                    'advanced_settings': json.loads(session.advanced_settings) if session.advanced_settings else None,
                    'created_at': session.created_at.isoformat()
                }
                for session in sessions
            ]
        except Exception as e:
            logging.error(f"Error retrieving analysis history: {e}")
            return []
        finally:
            db.close()

# Export the service instance
db_service = DatabaseService()
