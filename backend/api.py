import os
import io
import json
import csv
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
import numpy as np

def sanitize_float(val):
    if val is None:
        return None
    try:
        f = float(val)
        if np.isnan(f) or np.isinf(f):
            return None
        return f
    except (ValueError, TypeError):
        return None

try:
    from .database import engine, Base, get_db, DB_PATH
    from .models import MPLADRecord, AnomalyFinding, RiskAlert, ImportHistory
    from .ingestion import ingest_mplads_data, parse_mplads_csv
    from .ml_engine import run_anomaly_detection_pipeline
except ImportError:
    from database import engine, Base, get_db, DB_PATH
    from models import MPLADRecord, AnomalyFinding, RiskAlert, ImportHistory
    from ingestion import ingest_mplads_data, parse_mplads_csv
    from ml_engine import run_anomaly_detection_pipeline

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MPLADS AI Sentinel API",
    description="AI-Powered MPLADS Scheme Monitoring, Financial Anomaly Detection & Risk Intelligence API",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server (usually localhost:5173) and local access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event: automatically ingest default CSV and run anomaly pipeline if DB empty
@app.on_event("startup")
def startup_event():
    db = next(get_db())
    try:
        record_count = db.query(MPLADRecord).count()
        csv_path = r"D:\MPLAD\Allocated Limit for Honble MPs.csv"
        if record_count == 0 and os.path.exists(csv_path):
            print(f"[STARTUP] Ingesting initial CSV dataset from: {csv_path}")
            ingest_mplads_data(db, csv_path)
            print("[STARTUP] Running initial anomaly detection engine...")
            run_anomaly_detection_pipeline(db)
            print("[STARTUP] Initialization complete!")
    finally:
        db.close()


# Pydantic Schemas
class AlertUpdateRequest(BaseModel):
    status: Optional[str] = None
    reviewer_notes: Optional[str] = None
    assigned_to: Optional[str] = None

class ImportRequest(BaseModel):
    file_path: Optional[str] = None


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MPLADS AI Sentinel API",
        "timestamp": datetime.utcnow().isoformat(),
        "database": os.path.exists(DB_PATH)
    }


@app.get("/api/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Returns executive dashboard metrics calculated directly from the real dataset.
    Explicitly clarifies field availability to maintain government data integrity.
    """
    total_records = db.query(MPLADRecord).count()
    if total_records == 0:
        return {
            "total_works": 0,
            "total_sanctioned_amount": 0.0,
            "total_allocated_amount": 0.0,
            "total_expenditure": None,
            "funds_released": None,
            "remaining_funds": None,
            "fund_utilization_pct": None,
            "total_anomalies": 0,
            "critical_risk_count": 0,
            "high_risk_count": 0,
            "data_schema_status": "No data loaded."
        }

    valid_allocations = db.query(func.sum(MPLADRecord.allocated_amount)).filter(MPLADRecord.allocated_amount.isnot(None)).scalar() or 0.0
    missing_count = db.query(MPLADRecord).filter(MPLADRecord.allocated_amount.is_(None)).count()
    total_anomalies = db.query(AnomalyFinding).count()
    critical_count = db.query(AnomalyFinding).filter(AnomalyFinding.risk_level == "Critical").count()
    high_count = db.query(AnomalyFinding).filter(AnomalyFinding.risk_level == "High").count()
    medium_count = db.query(AnomalyFinding).filter(AnomalyFinding.risk_level == "Medium").count()
    low_count = db.query(AnomalyFinding).filter(AnomalyFinding.risk_level == "Low").count()

    total_alerts = db.query(RiskAlert).count()
    pending_alerts = db.query(RiskAlert).filter(RiskAlert.status.in_(["New", "Under Review"])).count()
    resolved_alerts = db.query(RiskAlert).filter(RiskAlert.status.in_(["Verified Issue", "No Issue Found"])).count()

    # Query last import history
    last_import = db.query(ImportHistory).order_by(desc(ImportHistory.imported_at)).first()

    return {
        # Core Metrics derived from actual dataset
        "total_works": total_records,  # Total parliamentary constituencies / allocation allocations
        "total_allocated_amount": float(valid_allocations),
        "total_allocated_formatted": f"₹ {valid_allocations / 10000000:,.2f} Cr",
        "mean_allocation": float(valid_allocations / (total_records - missing_count)) if (total_records - missing_count) > 0 else 0.0,
        "missing_allocation_records": missing_count,
        "standard_baseline_amount": 147000000.0,
        
        # Unavailable fields in Constituency Allocated Limit schema — transparently marked
        "expenditure_field_available": False,
        "expenditure_field_notice": "Expenditure field unavailable in Constituency Allocation ledger — requires Work-Level Transaction Ledger.",
        "project_status_available": False,
        "project_status_notice": "Work execution status (Ongoing/Completed) unavailable in Allocation ledger.",
        "funds_released": None,
        "remaining_funds": None,
        "fund_utilization_pct": None,
        
        # Risk & Anomaly Metrics
        "total_anomalies": total_anomalies,
        "critical_risk_count": critical_count,
        "high_risk_count": high_count,
        "medium_risk_count": medium_count,
        "low_risk_count": low_count,
        "total_alerts": total_alerts,
        "pending_alerts": pending_alerts,
        "resolved_alerts": resolved_alerts,
        
        # Source Metadata
        "source_file": last_import.filename if last_import else "Allocated Limit for Honble MPs.csv",
        "last_updated": last_import.imported_at.isoformat() if last_import else datetime.utcnow().isoformat()
    }


@app.get("/api/works")
def get_works(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    search: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    sort_by: str = Query("sr_no"),
    sort_dir: str = Query("asc"),
    db: Session = Depends(get_db)
):
    """
    Searchable, sortable, paginated registry of all real MPLADS constituency records.
    """
    query = db.query(MPLADRecord)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                MPLADRecord.constituency.ilike(search_filter),
                MPLADRecord.mp_name.ilike(search_filter),
                MPLADRecord.state.ilike(search_filter),
                MPLADRecord.sr_no.ilike(search_filter)
            )
        )

    if state and state != "All":
        query = query.filter(MPLADRecord.state == state)

    if category and category != "All":
        query = query.filter(MPLADRecord.category == category)

    if risk_level and risk_level != "All":
        # Join with anomaly findings
        subq = db.query(AnomalyFinding.record_id).filter(AnomalyFinding.risk_level == risk_level).subquery()
        query = query.filter(MPLADRecord.id.in_(subq))

    total_items = query.count()

    # Sorting
    sort_col = getattr(MPLADRecord, sort_by, MPLADRecord.id)
    if sort_dir == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(sort_col)

    records = query.offset((page - 1) * page_size).limit(page_size).all()

    # Collect findings for these records
    record_ids = [r.id for r in records]
    findings_map = {}
    if record_ids:
        all_f = db.query(AnomalyFinding).filter(AnomalyFinding.record_id.in_(record_ids)).all()
        for f in all_f:
            if f.record_id not in findings_map:
                findings_map[f.record_id] = []
            findings_map[f.record_id].append({
                "id": f.id,
                "anomaly_type": f.anomaly_type,
                "risk_score": f.risk_score,
                "risk_level": f.risk_level,
                "reason": f.reason
            })

    items = []
    for r in records:
        f_list = findings_map.get(r.id, [])
        highest_risk = "Low"
        max_score = 0.0
        for f in f_list:
            if f["risk_score"] > max_score:
                max_score = f["risk_score"]
                highest_risk = f["risk_level"]

        items.append({
            "id": r.id,
            "sr_no": r.sr_no,
            "state": r.state,
            "mp_name": r.mp_name,
            "constituency": r.constituency,
            "allocated_amount": sanitize_float(r.allocated_amount),
            "raw_amount": r.raw_amount,
            "category": r.category,
            "source_filename": r.source_filename,
            "import_date": r.import_date.isoformat(),
            "data_quality_issues": r.data_quality_issues,
            "anomalies_count": len(f_list),
            "highest_risk_level": highest_risk if f_list else "None",
            "highest_risk_score": sanitize_float(max_score) if f_list else 0.0,
            "anomalies": f_list
        })

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": (total_items + page_size - 1) // page_size
    }


@app.get("/api/works/{record_id}")
def get_work_detail(record_id: int, db: Session = Depends(get_db)):
    """
    Detailed audit view for a specific constituency record.
    """
    record = db.query(MPLADRecord).filter(MPLADRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="MPLADS record not found")

    findings = db.query(AnomalyFinding).filter(AnomalyFinding.record_id == record_id).all()
    alerts = db.query(RiskAlert).filter(RiskAlert.record_id == record_id).all()

    # Find possible duplicate or same-constituency records
    peer_records = db.query(MPLADRecord).filter(
        MPLADRecord.constituency == record.constituency,
        MPLADRecord.id != record.id
    ).all()

    return {
        "record": {
            "id": record.id,
            "sr_no": record.sr_no,
            "state": record.state,
            "mp_name": record.mp_name,
            "constituency": record.constituency,
            "allocated_amount": record.allocated_amount,
            "raw_amount": record.raw_amount,
            "category": record.category,
            "source_filename": record.source_filename,
            "import_date": record.import_date.isoformat(),
            "data_quality_issues": record.data_quality_issues
        },
        "findings": [
            {
                "id": f.id,
                "anomaly_type": f.anomaly_type,
                "anomaly_category": f.anomaly_category,
                "risk_score": f.risk_score,
                "risk_level": f.risk_level,
                "reason": f.reason,
                "evidence": json.loads(f.evidence) if f.evidence else {},
                "suggested_action": f.suggested_action,
                "created_at": f.created_at.isoformat()
            }
            for f in findings
        ],
        "alerts": [
            {
                "id": a.id,
                "title": a.title,
                "status": a.status,
                "risk_score": a.risk_score,
                "risk_level": a.risk_level,
                "reviewer_notes": a.reviewer_notes,
                "assigned_to": a.assigned_to,
                "audit_history": json.loads(a.audit_history) if a.audit_history else [],
                "updated_at": a.updated_at.isoformat()
            }
            for a in alerts
        ],
        "peer_constituency_records": [
            {
                "id": pr.id,
                "sr_no": pr.sr_no,
                "mp_name": pr.mp_name,
                "allocated_amount": pr.allocated_amount,
                "raw_amount": pr.raw_amount
            }
            for pr in peer_records
        ]
    }


@app.get("/api/anomalies")
def get_anomalies(
    risk_level: Optional[str] = Query(None),
    anomaly_category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns detected anomalies sorted by risk score.
    """
    query = db.query(AnomalyFinding)

    if risk_level and risk_level != "All":
        query = query.filter(AnomalyFinding.risk_level == risk_level)

    if anomaly_category and anomaly_category != "All":
        query = query.filter(AnomalyFinding.anomaly_category == anomaly_category)

    if state and state != "All":
        query = query.filter(AnomalyFinding.state == state)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AnomalyFinding.constituency.ilike(search_filter),
                AnomalyFinding.mp_name.ilike(search_filter),
                AnomalyFinding.state.ilike(search_filter)
            )
        )

    findings = query.order_by(desc(AnomalyFinding.risk_score)).all()

    return [
        {
            "id": f.id,
            "record_id": f.record_id,
            "sr_no": f.sr_no,
            "constituency": f.constituency,
            "state": f.state,
            "mp_name": f.mp_name,
            "allocated_amount": sanitize_float(f.allocated_amount),
            "anomaly_type": f.anomaly_type,
            "anomaly_category": f.anomaly_category,
            "risk_score": sanitize_float(f.risk_score),
            "risk_level": f.risk_level,
            "reason": f.reason,
            "evidence": json.loads(f.evidence) if f.evidence else {},
            "suggested_action": f.suggested_action,
            "created_at": f.created_at.isoformat()
        }
        for f in findings
    ]


@app.post("/api/anomalies/run")
def trigger_anomaly_detection(db: Session = Depends(get_db)):
    """
    Triggers re-run of ML Isolation Forest and statistical anomaly algorithms.
    """
    summary = run_anomaly_detection_pipeline(db)
    return {
        "status": "success",
        "message": "Anomaly detection engine executed successfully.",
        "summary": summary
    }


@app.get("/api/alerts")
def get_alerts(
    status: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Alert management queue with investigation workflow.
    """
    query = db.query(RiskAlert)

    if status and status != "All":
        query = query.filter(RiskAlert.status == status)

    if risk_level and risk_level != "All":
        query = query.filter(RiskAlert.risk_level == risk_level)

    if state and state != "All":
        query = query.filter(RiskAlert.state == state)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                RiskAlert.constituency.ilike(search_filter),
                RiskAlert.mp_name.ilike(search_filter),
                RiskAlert.title.ilike(search_filter)
            )
        )

    alerts = query.order_by(desc(RiskAlert.risk_score)).all()

    return [
        {
            "id": a.id,
            "finding_id": a.finding_id,
            "record_id": a.record_id,
            "title": a.title,
            "constituency": a.constituency,
            "state": a.state,
            "mp_name": a.mp_name,
            "anomaly_type": a.anomaly_type,
            "risk_score": a.risk_score,
            "risk_level": a.risk_level,
            "status": a.status,
            "reviewer_notes": a.reviewer_notes,
            "assigned_to": a.assigned_to,
            "audit_history": json.loads(a.audit_history) if a.audit_history else [],
            "created_at": a.created_at.isoformat(),
            "updated_at": a.updated_at.isoformat()
        }
        for a in alerts
    ]


@app.patch("/api/alerts/{alert_id}")
def update_alert(alert_id: int, update_data: AlertUpdateRequest, db: Session = Depends(get_db)):
    """
    Updates investigation status, reviewer notes, and adds audit trail.
    """
    alert = db.query(RiskAlert).filter(RiskAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    history = json.loads(alert.audit_history) if alert.audit_history else []
    changes = []

    if update_data.status and update_data.status != alert.status:
        changes.append(f"Status changed from '{alert.status}' to '{update_data.status}'")
        alert.status = update_data.status

    if update_data.reviewer_notes is not None:
        alert.reviewer_notes = update_data.reviewer_notes
        changes.append("Updated reviewer notes")

    if update_data.assigned_to is not None:
        alert.assigned_to = update_data.assigned_to
        changes.append(f"Assigned to {update_data.assigned_to}")

    if changes:
        history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "action": "ALERT_UPDATED",
            "details": "; ".join(changes)
        })
        alert.audit_history = json.dumps(history)
        alert.updated_at = datetime.utcnow()
        db.commit()

    return {
        "status": "success",
        "id": alert.id,
        "new_status": alert.status,
        "reviewer_notes": alert.reviewer_notes,
        "updated_at": alert.updated_at.isoformat()
    }


@app.get("/api/analytics/financial")
def get_financial_analytics(db: Session = Depends(get_db)):
    """
    Comprehensive financial distribution metrics, percentiles, outlier ranges.
    """
    records = db.query(MPLADRecord).filter(MPLADRecord.allocated_amount.isnot(None)).all()
    if not records:
        return {"error": "No records found"}

    amounts = [r.allocated_amount for r in records]
    amounts_arr = np.array(amounts)

    q25, q50, q75 = np.percentile(amounts_arr, [25, 50, 75])
    iqr = q75 - q25

    # Allocation buckets
    bins = [0, 100000000, 146999999, 147000001, 160000000, 200000000, 250000000, 350000000]
    labels = ["< ₹10 Cr", "₹10 - ₹14.69 Cr", "₹14.70 Cr (Baseline)", "₹14.71 - ₹16 Cr", "₹16 - ₹20 Cr", "₹20 - ₹25 Cr", "> ₹25 Cr"]
    
    bucket_counts = {label: 0 for label in labels}
    for amt in amounts:
        for i in range(len(bins) - 1):
            if bins[i] <= amt < bins[i+1]:
                bucket_counts[labels[i]] += 1
                break

    distribution_data = [{"range": k, "count": v} for k, v in bucket_counts.items()]

    # Top highest and lowest
    highest = db.query(MPLADRecord).order_by(desc(MPLADRecord.allocated_amount)).limit(10).all()
    lowest = db.query(MPLADRecord).filter(MPLADRecord.allocated_amount.isnot(None)).order_by(MPLADRecord.allocated_amount).limit(10).all()

    return {
        "total_records_analyzed": len(amounts),
        "total_amount_sum": float(np.sum(amounts_arr)),
        "mean_amount": float(np.mean(amounts_arr)),
        "median_amount": float(q50),
        "std_amount": float(np.std(amounts_arr)),
        "min_amount": float(np.min(amounts_arr)),
        "max_amount": float(np.max(amounts_arr)),
        "q25": float(q25),
        "q75": float(q75),
        "iqr": float(iqr),
        "upper_fence": float(q75 + 1.5 * iqr),
        "upper_extreme_fence": float(q75 + 3.0 * iqr),
        "baseline": 147000000.0,
        "baseline_count": sum(1 for a in amounts if abs(a - 147000000.0) < 1.0),
        "distribution_buckets": distribution_data,
        "highest_allocations": [
            {"constituency": r.constituency, "state": r.state, "mp_name": r.mp_name, "amount": r.allocated_amount}
            for r in highest
        ],
        "lowest_allocations": [
            {"constituency": r.constituency, "state": r.state, "mp_name": r.mp_name, "amount": r.allocated_amount}
            for r in lowest
        ]
    }


@app.get("/api/analytics/regional")
def get_regional_analytics(db: Session = Depends(get_db)):
    """
    State-level aggregation of total allocated funds, MP count, and anomaly frequency.
    """
    records = db.query(MPLADRecord).all()
    if not records:
        return []

    # Map anomalies by state
    anomalies_by_state = {}
    for a in db.query(AnomalyFinding).all():
        st = a.state
        if st not in anomalies_by_state:
            anomalies_by_state[st] = {"total": 0, "critical": 0, "high": 0}
        anomalies_by_state[st]["total"] += 1
        if a.risk_level == "Critical":
            anomalies_by_state[st]["critical"] += 1
        elif a.risk_level == "High":
            anomalies_by_state[st]["high"] += 1

    states_dict = {}
    for r in records:
        st = r.state
        if st not in states_dict:
            states_dict[st] = {
                "state": st,
                "mp_count": 0,
                "total_allocated": 0.0,
                "missing_allocations": 0,
                "amounts": []
            }
        states_dict[st]["mp_count"] += 1
        if r.allocated_amount is not None:
            states_dict[st]["total_allocated"] += r.allocated_amount
            states_dict[st]["amounts"].append(r.allocated_amount)
        else:
            states_dict[st]["missing_allocations"] += 1

    result = []
    for st, d in states_dict.items():
        anom = anomalies_by_state.get(st, {"total": 0, "critical": 0, "high": 0})
        avg_amt = (d["total_allocated"] / len(d["amounts"])) if d["amounts"] else 0.0
        result.append({
            "state": st,
            "mp_count": d["mp_count"],
            "total_allocated": d["total_allocated"],
            "total_allocated_cr": round(d["total_allocated"] / 10000000, 2),
            "average_allocated": avg_amt,
            "average_allocated_cr": round(avg_amt / 10000000, 2),
            "missing_allocations": d["missing_allocations"],
            "anomalies_count": anom["total"],
            "critical_anomalies": anom["critical"],
            "high_anomalies": anom["high"]
        })

    # Sort by total allocated descending
    result.sort(key=lambda x: x["total_allocated"], reverse=True)
    return result


@app.get("/api/datasets/profile")
def get_dataset_profile(db: Session = Depends(get_db)):
    """
    Returns data profiling metrics and data quality report for the ingested dataset.
    """
    csv_path = r"D:\MPLAD\Allocated Limit for Honble MPs.csv"
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Dataset CSV file not found.")

    _, profile = parse_mplads_csv(csv_path)
    return profile


@app.post("/api/datasets/import")
def import_dataset(payload: ImportRequest, db: Session = Depends(get_db)):
    """
    Imports or reloads an updated CSV file without duplicating records.
    """
    file_path = payload.file_path or r"D:\MPLAD\Allocated Limit for Honble MPs.csv"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    res = ingest_mplads_data(db, file_path)
    # Re-run anomaly detection
    run_anomaly_detection_pipeline(db)
    return res


@app.get("/api/reports/summary")
def get_report_summary(db: Session = Depends(get_db)):
    """
    Structured report summary for display or export.
    """
    last_import = db.query(ImportHistory).order_by(desc(ImportHistory.imported_at)).first()
    total_records = db.query(MPLADRecord).count()
    valid_amount_sum = db.query(func.sum(MPLADRecord.allocated_amount)).scalar() or 0.0
    anomalies = db.query(AnomalyFinding).all()

    return {
        "report_title": "MPLADS AI Sentinel Scheme Monitoring & Anomaly Report",
        "generated_at": datetime.utcnow().isoformat(),
        "source_csv_filename": last_import.filename if last_import else "Allocated Limit for Honble MPs.csv",
        "import_timestamp": last_import.imported_at.isoformat() if last_import else None,
        "analyzed_records": total_records,
        "total_allocated_inr": valid_amount_sum,
        "total_allocated_crores": round(valid_amount_sum / 10000000, 2),
        "total_anomalies_detected": len(anomalies),
        "risk_breakdown": {
            "critical": sum(1 for a in anomalies if a.risk_level == "Critical"),
            "high": sum(1 for a in anomalies if a.risk_level == "High"),
            "medium": sum(1 for a in anomalies if a.risk_level == "Medium"),
            "low": sum(1 for a in anomalies if a.risk_level == "Low")
        },
        "methodologies_used": [
            "Deterministic Isolation Forest (n_estimators=100, seed=42)",
            "Interquartile Range (IQR) Outer and Inner Fence Outlier Detection",
            "Modified Z-Score via Median Absolute Deviation (MAD)",
            "Constituency Duplicate & Entity Lineage Checking",
            "Missing & Malformed Data Quality Validation"
        ],
        "schema_limitations": [
            "Dataset represents parliamentary constituency allocation ceiling limits (Macro level).",
            "Work-level expenditure, contract payments, and project milestone completion dates are not present in this allocation table.",
            "Findings denote administrative anomalies and allocation variances requiring official reconciliation; they do not establish wrongdoing or fraud."
        ]
    }


@app.get("/api/reports/export/csv")
def export_anomalies_csv(db: Session = Depends(get_db)):
    """
    Generates and downloads a CSV export of all detected anomalies and risk scores.
    """
    findings = db.query(AnomalyFinding).order_by(desc(AnomalyFinding.risk_score)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Finding ID", "Sr No", "Constituency", "State", "Hon'ble MP", 
        "Allocated Amount (INR)", "Anomaly Type", "Category", 
        "Risk Score", "Risk Level", "Reason", "Suggested Verification Action"
    ])

    for f in findings:
        writer.writerow([
            f.id, f.sr_no, f.constituency, f.state, f.mp_name,
            f.allocated_amount if f.allocated_amount is not None else "UNASSIGNED",
            f.anomaly_type, f.anomaly_category, f.risk_score, f.risk_level,
            f.reason, f.suggested_action
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=mplads_sentinel_anomalies_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"}
    )
