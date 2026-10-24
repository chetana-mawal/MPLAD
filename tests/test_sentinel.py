import os
import sys
import unittest
import numpy as np

# Ensure root directory is on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from backend.database import SessionLocal, engine, Base
from backend.models import MPLADRecord, AnomalyFinding, RiskAlert, ImportHistory
from backend.ingestion import ingest_mplads_data, parse_mplads_csv
from backend.ml_engine import run_anomaly_detection_pipeline, get_risk_level
from fastapi.testclient import TestClient
from backend.api import app

class TestMPLADSSentinel(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.db = SessionLocal()
        cls.csv_path = r"D:\MPLAD\Allocated Limit for Honble MPs.csv"
        # Ingest test data
        ingest_mplads_data(cls.db, cls.csv_path)
        run_anomaly_detection_pipeline(cls.db)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_csv_loading_and_reconciliation(self):
        """Verify data parsing, total rows, valid financial counts, and exact grand total match."""
        data_df, profile = parse_mplads_csv(self.csv_path)
        self.assertEqual(len(data_df), 543, "Should have 543 constituency records")
        self.assertEqual(profile["valid_financial_records"], 542, "Should have 542 valid allocation records")
        self.assertEqual(profile["missing_financial_records"], 1, "Should have 1 missing allocation record")
        self.assertAlmostEqual(
            profile["total_allocated_amount_sum"], 
            profile["grand_total_in_file"], 
            places=2, 
            msg="Computed sum must match Grand Total in CSV exactly (variance = 0)"
        )

    def test_02_idempotent_reimport(self):
        """Verify re-importing does not create accidental duplicate records in DB."""
        initial_count = self.db.query(MPLADRecord).count()
        res = ingest_mplads_data(self.db, self.csv_path)
        final_count = self.db.query(MPLADRecord).count()
        self.assertEqual(initial_count, final_count, "Re-importing must not increase total record count")
        self.assertEqual(res["new_records"], 0, "No new records should be inserted on identical reimport")
        self.assertEqual(res["updated_records"], 543, "All records should be safely updated")

    def test_03_duplicate_constituency_anomaly(self):
        """Verify NANDED constituency duplication is flagged with Critical priority."""
        nanded_records = self.db.query(MPLADRecord).filter(MPLADRecord.constituency == "NANDED").all()
        self.assertEqual(len(nanded_records), 2, "NANDED should have 2 records in database")
        
        nanded_anoms = self.db.query(AnomalyFinding).filter(
            AnomalyFinding.constituency == "NANDED",
            AnomalyFinding.anomaly_type == "DUPLICATE_CONSTITUENCY"
        ).all()
        self.assertGreaterEqual(len(nanded_anoms), 2, "Both NANDED records should be flagged as duplicates")
        for anom in nanded_anoms:
            self.assertEqual(anom.risk_level, "Critical", "Duplicate constituency should be Critical priority")
            self.assertGreaterEqual(anom.risk_score, 80.0)

    def test_04_missing_allocation_anomaly(self):
        """Verify record with NaN allocation is flagged as Data Quality anomaly."""
        missing_anom = self.db.query(AnomalyFinding).filter(
            AnomalyFinding.anomaly_type == "MISSING_ALLOCATION"
        ).first()
        self.assertIsNotNone(missing_anom, "Missing allocation must be detected")
        self.assertEqual(missing_anom.constituency, "NANDED")
        self.assertEqual(missing_anom.risk_level, "High")

    def test_05_isolation_forest_ml_scoring(self):
        """Verify Isolation Forest flags multi-feature statistical anomalies deterministically."""
        ml_anoms = self.db.query(AnomalyFinding).filter(
            AnomalyFinding.anomaly_type == "ISOLATION_FOREST_OUTLIER"
        ).all()
        self.assertGreater(len(ml_anoms), 0, "Isolation Forest should identify outlier points")
        for m in ml_anoms:
            self.assertGreaterEqual(m.risk_score, 0.0)
            self.assertLessEqual(m.risk_score, 100.0)

    def test_06_risk_scoring_scale_integrity(self):
        """Verify all risk scores are within [0, 100] and categorized accurately."""
        all_findings = self.db.query(AnomalyFinding).all()
        for f in all_findings:
            self.assertGreaterEqual(f.risk_score, 0.0, f"Score {f.risk_score} is below 0")
            self.assertLessEqual(f.risk_score, 100.0, f"Score {f.risk_score} is above 100")
            expected_tier = get_risk_level(f.risk_score)
            self.assertEqual(f.risk_level, expected_tier, f"Mismatch in risk level tier for score {f.risk_score}")

    def test_07_fastapi_endpoints(self):
        """Verify key FastAPI endpoints respond with valid JSON and expected schemas."""
        # Health check
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

        # Dashboard summary
        res = self.client.get("/api/dashboard/summary")
        self.assertEqual(res.status_code, 200)
        summary = res.json()
        self.assertEqual(summary["total_works"], 543)
        self.assertFalse(summary["expenditure_field_available"])
        self.assertIn("unavailable", summary["expenditure_field_notice"].lower())

        # Works endpoint
        res = self.client.get("/api/works?page=1&page_size=10")
        self.assertEqual(res.status_code, 200)
        works = res.json()
        self.assertEqual(len(works["items"]), 10)
        self.assertEqual(works["total_items"], 543)

        # Anomalies endpoint
        res = self.client.get("/api/anomalies")
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()), 0)

        # Alerts endpoint
        res = self.client.get("/api/alerts")
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()), 0)

        # Regional analytics
        res = self.client.get("/api/analytics/regional")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 36, "Should have 36 states and union territories")

        # Financial analytics
        res = self.client.get("/api/analytics/financial")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["baseline"], 147000000.0)

        # Reports summary
        res = self.client.get("/api/reports/summary")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["source_csv_filename"], "Allocated Limit for Honble MPs.csv")


if __name__ == "__main__":
    unittest.main()
