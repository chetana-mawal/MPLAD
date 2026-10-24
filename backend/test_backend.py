import sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from database import SessionLocal, engine, Base
from models import MPLADRecord, AnomalyFinding, RiskAlert
from ingestion import ingest_mplads_data
from ml_engine import run_anomaly_detection_pipeline

def run_tests():
    print("--- 1. Testing Database Initialization ---")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("--- 2. Testing Data Ingestion from Real CSV ---")
    csv_path = r"D:\MPLAD\Allocated Limit for Honble MPs.csv"
    res = ingest_mplads_data(db, csv_path)
    print(f"Ingested: {res['new_records']} new, {res['updated_records']} updated. Total: {res['total_records']}")
    
    total_db_records = db.query(MPLADRecord).count()
    print(f"Total MPLADRecord rows in DB: {total_db_records}")
    assert total_db_records == 543, f"Expected 543 constituency records, got {total_db_records}"

    print("--- 3. Testing Anomaly & ML Engine ---")
    summary = run_anomaly_detection_pipeline(db)
    print(f"Pipeline findings summary: {summary}")
    
    anom_count = db.query(AnomalyFinding).count()
    alert_count = db.query(RiskAlert).count()
    print(f"Total AnomalyFinding records: {anom_count}")
    print(f"Total RiskAlert records: {alert_count}")
    assert anom_count > 0, "Expected anomalies to be detected"
    assert alert_count > 0, "Expected risk alerts to be generated"

    # Verify duplicate detection
    dup_anoms = db.query(AnomalyFinding).filter(AnomalyFinding.anomaly_type == "DUPLICATE_CONSTITUENCY").all()
    print(f"Duplicate constituency findings count: {len(dup_anoms)}")
    for da in dup_anoms:
        print(f"  -> Constituency: {da.constituency}, MP: {da.mp_name}, Risk: {da.risk_score}")

    # Verify missing allocation detection
    missing_anoms = db.query(AnomalyFinding).filter(AnomalyFinding.anomaly_type == "MISSING_ALLOCATION").all()
    print(f"Missing allocation findings count: {len(missing_anoms)}")
    for ma in missing_anoms:
        print(f"  -> Constituency: {ma.constituency}, MP: {ma.mp_name}, Reason: {ma.reason}")

    # Verify Isolation Forest and Outliers
    ml_anoms = db.query(AnomalyFinding).filter(AnomalyFinding.anomaly_type == "ISOLATION_FOREST_OUTLIER").all()
    print(f"Isolation Forest outlier findings count: {len(ml_anoms)}")
    for m in ml_anoms[:3]:
        print(f"  -> {m.constituency} ({m.state}): ₹{m.allocated_amount:,.2f}, Score: {m.risk_score}")

    print("--- 4. Testing Idempotent Re-import ---")
    res2 = ingest_mplads_data(db, csv_path)
    total_after_reimport = db.query(MPLADRecord).count()
    print(f"Total records after second import: {total_after_reimport}")
    assert total_after_reimport == 543, f"Duplicate records were created on re-import! Count: {total_after_reimport}"
    print(f"Reimport verified: 0 new records created, {res2['updated_records']} records updated without duplication.")

    db.close()
    print("\nALL BACKEND & ML ENGINE TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
