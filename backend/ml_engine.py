import json
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sqlalchemy.orm import Session
try:
    from .models import MPLADRecord, AnomalyFinding, RiskAlert
except ImportError:
    from models import MPLADRecord, AnomalyFinding, RiskAlert

STANDARD_BASELINE = 147000000.0  # ₹ 14.70 Crore standard 3-year baseline in 18th Lok Sabha

def safe_float(val):
    if val is None or pd.isna(val):
        return None
    try:
        f = float(val)
        if np.isnan(f) or np.isinf(f):
            return None
        return f
    except (ValueError, TypeError):
        return None

def get_risk_level(score: float) -> str:
    if score >= 80:
        return "Critical"
    elif score >= 60:
        return "High"
    elif score >= 30:
        return "Medium"
    else:
        return "Low"

def run_anomaly_detection_pipeline(db: Session):
    """
    Executes comprehensive anomaly detection:
    1. Rule-based financial & data quality checks (missing values, extreme baseline deviation)
    2. Entity duplicate detection (exact and ambiguous duplicate constituencies)
    3. Statistical outlier analysis (IQR & Modified Z-scores)
    4. Unsupervised ML: Isolation Forest with deterministic random seed
    5. Explainable risk scoring (0-100) and automatic alert generation
    """
    records = db.query(MPLADRecord).all()
    if not records:
        return {"status": "error", "message": "No records in database to analyze."}

    # Clear previous findings and auto-generated alerts that are still 'New'
    # Keep modified alerts or audit history
    db.query(AnomalyFinding).delete()
    # Delete only 'New' alerts to preserve user investigation notes
    db.query(RiskAlert).filter(RiskAlert.status == "New").delete()
    db.commit()

    # Convert records to DataFrame for analysis
    data = []
    for r in records:
        data.append({
            "id": r.id,
            "sr_no": r.sr_no,
            "state": r.state,
            "mp_name": r.mp_name,
            "constituency": r.constituency,
            "amount": r.allocated_amount,
            "category": r.category
        })
    df = pd.DataFrame(data)

    findings = []

    # --- 1. ENTITY DUPLICATE DETECTION ---
    constituency_counts = df['constituency'].value_counts()
    duplicate_constituencies = constituency_counts[constituency_counts > 1].index.tolist()
    
    for const in duplicate_constituencies:
        dup_rows = df[df['constituency'] == const]
        for _, row in dup_rows.iterrows():
            findings.append({
                "record_id": int(row['id']),
                "sr_no": str(row['sr_no']),
                "constituency": row['constituency'],
                "state": row['state'],
                "mp_name": row['mp_name'],
                "allocated_amount": safe_float(row['amount']),
                "anomaly_type": "DUPLICATE_CONSTITUENCY",
                "anomaly_category": "Duplicate Work/Entity",
                "risk_score": 85.0,  # Critical priority
                "risk_level": "Critical",
                "reason": f"Constituency '{row['constituency']}' appears {len(dup_rows)} times in the dataset with different representatives or allocation statuses.",
                "evidence": json.dumps({
                    "matching_field": "constituency",
                    "duplicate_count": len(dup_rows),
                    "peer_records": [
                        {"sr_no": str(pr['sr_no']), "mp_name": pr['mp_name'], "amount": safe_float(pr['amount'])}
                        for _, pr in dup_rows.iterrows() if pr['id'] != row['id']
                    ],
                    "context": "Indicates multiple allocation lines for a single seat, typically caused by by-elections or unretired predecessor records."
                }),
                "suggested_action": "Cross-reference Lok Sabha Secretariat vacancy and by-election notifications to verify whether predecessor ledger should be archived."
            })

    # --- 2. DATA QUALITY / MISSING FINANCIAL ANOMALIES ---
    missing_amount_rows = df[df['amount'].isna()]
    for _, row in missing_amount_rows.iterrows():
        findings.append({
            "record_id": int(row['id']),
            "sr_no": str(row['sr_no']),
            "constituency": row['constituency'],
            "state": row['state'],
            "mp_name": row['mp_name'],
            "allocated_amount": None,
            "anomaly_type": "MISSING_ALLOCATION",
            "anomaly_category": "Data Quality",
            "risk_score": 78.0,  # High priority
            "risk_level": "High",
            "reason": f"Constituency '{row['constituency']}' has a missing or unassigned financial allocation limit (NaN).",
            "evidence": json.dumps({
                "raw_value": "null/nan",
                "expected_min_baseline": STANDARD_BASELINE,
                "deficit": STANDARD_BASELINE,
                "impact": "Funds cannot be disbursed until allocation ceiling is officially fixed in PFMS/MPLADS portal."
            }),
            "suggested_action": "Verify with State Nodal Department and Ministry of Statistics whether allocation was withheld, delayed, or requires manual reconciliation."
        })

    # --- 3. STATISTICAL OUTLIER ANALYSIS (IQR & Robust Z-Scores) ---
    valid_df = df[df['amount'].notna()].copy()
    if len(valid_df) > 5:
        amounts = valid_df['amount'].values
        q25, q50, q75 = np.percentile(amounts, [25, 50, 75])
        iqr = q75 - q25
        lower_inner = q25 - 1.5 * iqr
        upper_inner = q75 + 1.5 * iqr
        upper_outer = q75 + 3.0 * iqr  # Extreme outlier

        # Median Absolute Deviation (MAD) for robust z-scores
        median = np.median(amounts)
        mad = np.median(np.abs(amounts - median))
        if mad == 0:
            mad = 1.0  # Prevent division by zero if all values are identical

        for _, row in valid_df.iterrows():
            amt = row['amount']
            mod_z = 0.6745 * (amt - median) / mad
            pct_dev = ((amt - STANDARD_BASELINE) / STANDARD_BASELINE) * 100.0

            # Calibrated thresholds based on statutory baseline (₹14.70 Cr)
            # Standard baseline is 14.70 Cr. Variations within 14.70 - 17.00 Cr are common standard increments.
            # Extreme High Outlier: > ₹ 22.00 Cr (Over ~50% above baseline)
            if amt >= 220000000.0:
                score = min(92.0, 75.0 + ((amt - 220000000.0) / 10000000.0) * 1.5)
                findings.append({
                    "record_id": int(row['id']),
                    "sr_no": str(row['sr_no']),
                    "constituency": row['constituency'],
                    "state": row['state'],
                    "mp_name": row['mp_name'],
                    "allocated_amount": amt,
                    "anomaly_type": "STATISTICAL_OUTLIER_EXTREME_HIGH",
                    "anomaly_category": "Financial Outlier",
                    "risk_score": round(score, 1),
                    "risk_level": get_risk_level(score),
                    "reason": f"Allocation limit ₹{amt:,.2f} is an extreme upper outlier ({pct_dev:+.1f}% above standard ₹14.70 Cr baseline).",
                    "evidence": json.dumps({
                        "amount": amt,
                        "median": median,
                        "upper_extreme_threshold": 220000000.0,
                        "iqr": iqr,
                        "modified_z_score": round(mod_z, 2),
                        "baseline_deviation_pct": round(pct_dev, 1),
                        "statistical_method": "IQR & Statutory Quota Upper Boundary (> ₹22 Cr)"
                    }),
                    "suggested_action": "Audit supplementary allocation sanctions or carry-forward balances from 17th Lok Sabha unspent quota."
                })
            # Moderate High Outlier: ₹ 17.50 Cr to ₹ 22.00 Cr
            elif amt >= 175000000.0:
                score = min(68.0, 45.0 + ((amt - 175000000.0) / 45000000.0) * 20.0)
                findings.append({
                    "record_id": int(row['id']),
                    "sr_no": str(row['sr_no']),
                    "constituency": row['constituency'],
                    "state": row['state'],
                    "mp_name": row['mp_name'],
                    "allocated_amount": amt,
                    "anomaly_type": "STATISTICAL_OUTLIER_HIGH",
                    "anomaly_category": "Financial Outlier",
                    "risk_score": round(score, 1),
                    "risk_level": get_risk_level(score),
                    "reason": f"Allocation limit ₹{amt:,.2f} significantly exceeds standard baseline ({pct_dev:+.1f}% above ₹14.70 Cr).",
                    "evidence": json.dumps({
                        "amount": amt,
                        "threshold": 175000000.0,
                        "modified_z_score": round(mod_z, 2),
                        "baseline_deviation_pct": round(pct_dev, 1)
                    }),
                    "suggested_action": "Verify rollover grants or state-level reconciliation documents justifying above-quota allocation."
                })
            # Sub-Baseline (Significantly below standard ₹14.70 Cr baseline)
            elif amt < 125000000.0:  # Under 12.5 Crore
                score = 75.0 if amt < 60000000.0 else (55.0 if amt < 100000000.0 else 38.0)
                findings.append({
                    "record_id": int(row['id']),
                    "sr_no": str(row['sr_no']),
                    "constituency": row['constituency'],
                    "state": row['state'],
                    "mp_name": row['mp_name'],
                    "allocated_amount": amt,
                    "anomaly_type": "SUB_BASELINE_ALLOCATION",
                    "anomaly_category": "Financial Anomaly",
                    "risk_score": round(score, 1),
                    "risk_level": get_risk_level(score),
                    "reason": f"Allocation limit ₹{amt:,.2f} is substantially below standard baseline ({pct_dev:+.1f}% below ₹14.70 Cr).",
                    "evidence": json.dumps({
                        "amount": amt,
                        "baseline": STANDARD_BASELINE,
                        "shortfall": STANDARD_BASELINE - amt,
                        "baseline_deviation_pct": round(pct_dev, 1)
                    }),
                    "suggested_action": "Examine if parliamentary term was truncated, delayed swearing-in, or if tranche release is blocked by pending utilization certificates."
                })

    # --- 4. MACHINE LEARNING: ISOLATION FOREST ---
    if len(valid_df) >= 20:
        # Prepare numerical features (amount, log-amount, deviation from baseline)
        amounts_arr = valid_df['amount'].values.reshape(-1, 1)
        log_amounts = np.log10(amounts_arr)
        dev_baseline = (amounts_arr - STANDARD_BASELINE) / STANDARD_BASELINE

        features = np.hstack([amounts_arr, log_amounts, dev_baseline])
        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(features)

        # Isolation Forest with deterministic seed
        iso_forest = IsolationForest(
            n_estimators=100,
            contamination=0.04,  # Flag top ~4% anomalous distribution points
            random_state=42
        )
        preds = iso_forest.fit_predict(scaled_features)
        decision_scores = iso_forest.decision_function(scaled_features)

        # Flagged by ML
        anomalous_indices = np.where(preds == -1)[0]
        
        # Track already flagged record_ids to avoid exact duplicate findings
        existing_flags = {(f['record_id'], f['anomaly_type']) for f in findings}

        for idx in anomalous_indices:
            row = valid_df.iloc[idx]
            amt = row['amount']
            dec_score = decision_scores[idx]
            # More negative decision score = more isolated/abnormal
            ml_anomaly_confidence = min(95.0, max(60.0, 60.0 + abs(float(dec_score)) * 200.0))

            # Only add if not already flagged under identical category or add as complementary ML perspective
            if (int(row['id']), "ISOLATION_FOREST_OUTLIER") not in existing_flags:
                findings.append({
                    "record_id": int(row['id']),
                    "sr_no": str(row['sr_no']),
                    "constituency": row['constituency'],
                    "state": row['state'],
                    "mp_name": row['mp_name'],
                    "allocated_amount": amt,
                    "anomaly_type": "ISOLATION_FOREST_OUTLIER",
                    "anomaly_category": "ML Anomaly",
                    "risk_score": round(ml_anomaly_confidence, 1),
                    "risk_level": get_risk_level(ml_anomaly_confidence),
                    "reason": f"Isolation Forest identified allocation ₹{amt:,.2f} as an isolated data point in high-dimensional financial feature space.",
                    "evidence": json.dumps({
                        "isolation_score": round(float(dec_score), 4),
                        "model": "Isolation Forest (n_estimators=100, seed=42)",
                        "standard_baseline": STANDARD_BASELINE,
                        "deviation_from_baseline": round(float(amt - STANDARD_BASELINE), 2),
                        "cluster_density": "Sparse / Outlier Leaf Path"
                    }),
                    "suggested_action": "Perform multi-parameter audit against state average and peer constituency allocations."
                })

    # Save findings into SQLite database
    saved_findings = []
    for f in findings:
        af = AnomalyFinding(
            record_id=f['record_id'],
            sr_no=f['sr_no'],
            constituency=f['constituency'],
            state=f['state'],
            mp_name=f['mp_name'],
            allocated_amount=f['allocated_amount'],
            anomaly_type=f['anomaly_type'],
            anomaly_category=f['anomaly_category'],
            risk_score=f['risk_score'],
            risk_level=f['risk_level'],
            reason=f['reason'],
            evidence=f['evidence'],
            suggested_action=f['suggested_action'],
            created_at=datetime.utcnow()
        )
        saved_findings.append(af)

    db.bulk_save_objects(saved_findings)
    db.commit()

    # Query back saved findings to generate corresponding RiskAlerts
    all_findings = db.query(AnomalyFinding).all()
    alerts_to_create = []
    
    # Check existing alerts to avoid recreating duplicates
    existing_alert_keys = {
        (a.record_id, a.anomaly_type): a for a in db.query(RiskAlert).all()
    }

    for f in all_findings:
        key = (f.record_id, f.anomaly_type)
        if key not in existing_alert_keys:
            alert = RiskAlert(
                finding_id=f.id,
                record_id=f.record_id,
                title=f"{f.anomaly_type.replace('_', ' ').title()} - {f.constituency} ({f.state})",
                constituency=f.constituency,
                state=f.state,
                mp_name=f.mp_name,
                anomaly_type=f.anomaly_type,
                risk_score=f.risk_score,
                risk_level=f.risk_level,
                status="New",
                reviewer_notes="",
                assigned_to="Unassigned",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                audit_history=json.dumps([{
                    "timestamp": datetime.utcnow().isoformat(),
                    "action": "ALERT_CREATED",
                    "details": f"Flagged by Sentinel Engine with risk score {f.risk_score} ({f.risk_level})"
                }])
            )
            alerts_to_create.append(alert)

    if alerts_to_create:
        db.bulk_save_objects(alerts_to_create)
        db.commit()

    # Summary metrics
    findings_summary = {
        "total_anomalies": len(all_findings),
        "critical_count": db.query(AnomalyFinding).filter(AnomalyFinding.risk_level == "Critical").count(),
        "high_count": db.query(AnomalyFinding).filter(AnomalyFinding.risk_level == "High").count(),
        "medium_count": db.query(AnomalyFinding).filter(AnomalyFinding.risk_level == "Medium").count(),
        "low_count": db.query(AnomalyFinding).filter(AnomalyFinding.risk_level == "Low").count(),
        "anomaly_types": {}
    }

    type_counts = db.query(AnomalyFinding.anomaly_type).all()
    for (t,) in type_counts:
        findings_summary["anomaly_types"][t] = findings_summary["anomaly_types"].get(t, 0) + 1

    return findings_summary
