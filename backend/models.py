from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
try:
    from .database import Base
except ImportError:
    from database import Base

class MPLADRecord(Base):
    __tablename__ = "mplad_records"

    id = Column(Integer, primary_key=True, index=True)
    sr_no = Column(String, index=True)
    state = Column(String, index=True)
    mp_name = Column(String, index=True)
    constituency = Column(String, index=True)
    raw_amount = Column(String)
    allocated_amount = Column(Float, nullable=True, index=True)
    category = Column(String, default="General")  # SC, ST, General
    source_filename = Column(String)
    import_date = Column(DateTime, default=datetime.utcnow)
    data_quality_issues = Column(Text, nullable=True)  # JSON or comma-separated notes

    anomalies = relationship("AnomalyFinding", back_populates="record", cascade="all, delete-orphan")
    alerts = relationship("RiskAlert", back_populates="record", cascade="all, delete-orphan")


class AnomalyFinding(Base):
    __tablename__ = "anomaly_findings"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("mplad_records.id"), nullable=True, index=True)
    sr_no = Column(String)
    constituency = Column(String, index=True)
    state = Column(String, index=True)
    mp_name = Column(String)
    allocated_amount = Column(Float, nullable=True)
    anomaly_type = Column(String, index=True)  # e.g., 'MISSING_ALLOCATION', 'ISOLATION_FOREST_OUTLIER', 'IQR_EXTREME_OUTLIER', 'DUPLICATE_CONSTITUENCY'
    anomaly_category = Column(String)  # Financial, ML Anomaly, Data Quality, Duplicate
    risk_score = Column(Float)  # 0 to 100
    risk_level = Column(String, index=True)  # Low (0-29), Medium (30-59), High (60-79), Critical (80-100)
    reason = Column(Text)
    evidence = Column(Text)  # JSON string of statistics and metrics
    suggested_action = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    record = relationship("MPLADRecord", back_populates="anomalies")
    alert = relationship("RiskAlert", back_populates="finding", uselist=False, cascade="all, delete-orphan")


class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, ForeignKey("anomaly_findings.id"), nullable=True)
    record_id = Column(Integer, ForeignKey("mplad_records.id"), nullable=True)
    title = Column(String)
    constituency = Column(String, index=True)
    state = Column(String, index=True)
    mp_name = Column(String)
    anomaly_type = Column(String)
    risk_score = Column(Float)
    risk_level = Column(String, index=True)  # Low, Medium, High, Critical
    status = Column(String, default="New", index=True)  # New, Under Review, Verified Issue, No Issue Found, Escalated
    reviewer_notes = Column(Text, default="")
    assigned_to = Column(String, default="Unassigned")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    audit_history = Column(Text, default="[]")  # JSON array of history entries

    record = relationship("MPLADRecord", back_populates="alerts")
    finding = relationship("AnomalyFinding", back_populates="alert")


class ImportHistory(Base):
    __tablename__ = "import_history"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    file_path = Column(String)
    total_rows = Column(Integer)
    valid_records = Column(Integer)
    missing_records = Column(Integer)
    total_allocated_amount = Column(Float)
    grand_total_in_file = Column(Float, nullable=True)
    imported_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String)
    quality_summary = Column(Text)  # JSON string
