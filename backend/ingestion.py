import os
import re
import json
from datetime import datetime
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
try:
    from .models import MPLADRecord, ImportHistory
except ImportError:
    from models import MPLADRecord, ImportHistory

def clean_amount_val(val):
    if pd.isna(val) or val is None:
        return None
    val_str = str(val).strip().replace(',', '').replace('\u20b9', '').replace('Rs.', '').replace(' ', '')
    if val_str == '' or val_str.lower() in ('nan', 'null', 'none', '-'):
        return None
    try:
        return float(val_str)
    except (ValueError, TypeError):
        return None

def extract_category(constituency_str):
    if not constituency_str:
        return "General"
    upper = constituency_str.upper()
    if "(SC)" in upper or " SC" in upper:
        return "SC"
    elif "(ST)" in upper or " ST" in upper:
        return "ST"
    return "General"

def parse_mplads_csv(file_path: str):
    """
    Parses and profiles the MPLADS CSV file with robust encoding, format handling,
    footer isolation, and reconciliation.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"CSV file not found at: {file_path}")

    # Detect encoding
    encodings = ['utf-8', 'utf-8-sig', 'cp1252', 'latin1']
    df = None
    used_encoding = None
    for enc in encodings:
        try:
            df = pd.read_csv(file_path, encoding=enc, dtype=str)
            used_encoding = enc
            break
        except UnicodeDecodeError:
            continue

    if df is None:
        raise ValueError(f"Could not decode file {file_path} with standard encodings.")

    # Normalize column names
    col_map = {}
    for col in df.columns:
        norm = col.strip().lower()
        if 'sr' in norm and 'no' in norm:
            col_map[col] = 'sr_no'
        elif 'state' in norm:
            col_map[col] = 'state'
        elif 'member' in norm or 'mp' in norm:
            col_map[col] = 'mp_name'
        elif 'constituency' in norm:
            col_map[col] = 'constituency'
        elif 'amount' in norm or 'allocated' in norm or '\u20b9' in col:
            col_map[col] = 'allocated_amount'

    df = df.rename(columns=col_map)
    required = ['state', 'mp_name', 'constituency', 'allocated_amount']
    missing_cols = [c for c in required if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns in CSV: {missing_cols}. Found: {df.columns.tolist()}")

    # Separate Grand Total row if present
    grand_total_in_file = None
    is_footer = df['sr_no'].astype(str).str.contains('total', case=False, na=False) | \
                df['state'].astype(str).str.contains('total', case=False, na=False) | \
                df['constituency'].astype(str).str.contains('total', case=False, na=False)

    footer_rows = df[is_footer]
    if not footer_rows.empty:
        raw_gt = footer_rows.iloc[0]['allocated_amount']
        grand_total_in_file = clean_amount_val(raw_gt)

    data_df = df[~is_footer].copy()

    # Clean text values (replace non-breaking spaces, strip whitespace)
    for c in ['state', 'mp_name', 'constituency']:
        if c in data_df.columns:
            data_df[c] = data_df[c].astype(str).str.replace('\xa0', ' ').str.strip()

    if 'sr_no' in data_df.columns:
        data_df['sr_no'] = data_df['sr_no'].astype(str).str.strip()

    # Clean amount and raw copy
    data_df['raw_amount'] = data_df['allocated_amount'].fillna('').astype(str).str.strip()
    data_df['amount_clean'] = data_df['allocated_amount'].apply(clean_amount_val)
    data_df['category'] = data_df['constituency'].apply(extract_category)

    # Calculate data quality issues per row
    def check_row_quality(row):
        issues = []
        if pd.isna(row['amount_clean']) or row['amount_clean'] is None:
            issues.append("MISSING_AMOUNT: Financial allocation limit is null/unassigned.")
        elif row['amount_clean'] <= 0:
            issues.append("INVALID_AMOUNT: Allocation amount is zero or negative.")
        if not row['mp_name'] or row['mp_name'] in ('', 'nan', 'null'):
            issues.append("MISSING_MP_NAME: Representative name is blank.")
        if not row['constituency'] or row['constituency'] in ('', 'nan', 'null'):
            issues.append("MISSING_CONSTITUENCY: Constituency name is blank.")
        return "; ".join(issues) if issues else None

    data_df['quality_issues'] = data_df.apply(check_row_quality, axis=1)

    # Profiling summary
    total_records = len(data_df)
    valid_amounts = int(data_df['amount_clean'].count())
    missing_amounts = int(data_df['amount_clean'].isna().sum())
    total_allocated_sum = float(data_df['amount_clean'].sum())
    
    # State-level stats
    state_breakdown = data_df.groupby('state').agg(
        mp_count=('constituency', 'count'),
        total_allocated=('amount_clean', 'sum'),
        mean_allocated=('amount_clean', 'mean'),
        min_allocated=('amount_clean', 'min'),
        max_allocated=('amount_clean', 'max'),
        missing_count=('amount_clean', lambda s: s.isna().sum())
    ).reset_index().to_dict(orient='records')

    # Detect duplicate constituencies
    dup_constituencies = data_df[data_df.duplicated('constituency', keep=False)]
    duplicate_records_info = []
    if not dup_constituencies.empty:
        for name, group in dup_constituencies.groupby('constituency'):
            duplicate_records_info.append({
                "constituency": name,
                "occurrences": len(group),
                "records": group[['sr_no', 'state', 'mp_name', 'amount_clean']].to_dict(orient='records')
            })

    profile_report = {
        "source_filename": os.path.basename(file_path),
        "source_filepath": file_path,
        "encoding_used": used_encoding,
        "total_rows_in_file": len(df),
        "total_constituency_records": total_records,
        "valid_financial_records": valid_amounts,
        "missing_financial_records": missing_amounts,
        "total_allocated_amount_sum": total_allocated_sum,
        "grand_total_in_file": grand_total_in_file,
        "reconciliation_variance": total_allocated_sum - grand_total_in_file if grand_total_in_file else 0.0,
        "unique_states": int(data_df['state'].nunique()),
        "unique_constituencies": int(data_df['constituency'].nunique()),
        "duplicate_constituencies_count": len(duplicate_records_info),
        "duplicate_constituencies": duplicate_records_info,
        "state_breakdown": state_breakdown,
        "amount_stats": {
            "mean": float(data_df['amount_clean'].mean()) if valid_amounts else 0,
            "median": float(data_df['amount_clean'].median()) if valid_amounts else 0,
            "std": float(data_df['amount_clean'].std()) if valid_amounts else 0,
            "min": float(data_df['amount_clean'].min()) if valid_amounts else 0,
            "max": float(data_df['amount_clean'].max()) if valid_amounts else 0,
            "mode": float(data_df['amount_clean'].mode()[0]) if not data_df['amount_clean'].mode().empty else 0
        }
    }

    return data_df, profile_report


def ingest_mplads_data(db: Session, file_path: str = r"D:\MPLAD\Allocated Limit for Honble MPs.csv"):
    """
    Ingests cleaned records into SQLite database.
    Updates existing records without duplicating them.
    """
    data_df, profile_report = parse_mplads_csv(file_path)
    filename = os.path.basename(file_path)

    # Load existing records mapped by (sr_no, constituency, mp_name) to avoid duplicates
    existing_records = {
        (r.sr_no, r.constituency, r.mp_name): r 
        for r in db.query(MPLADRecord).all()
    }

    records_to_add = []
    updated_count = 0
    new_count = 0

    for _, row in data_df.iterrows():
        key = (str(row.get('sr_no', '')), str(row['constituency']), str(row['mp_name']))
        
        if key in existing_records:
            # Update existing record
            rec = existing_records[key]
            rec.state = str(row['state'])
            rec.raw_amount = str(row.get('raw_amount', ''))
            rec.allocated_amount = row['amount_clean'] if not pd.isna(row['amount_clean']) else None
            rec.category = row['category']
            rec.source_filename = filename
            rec.data_quality_issues = row['quality_issues']
            updated_count += 1
        else:
            # Insert new record
            new_rec = MPLADRecord(
                sr_no=str(row.get('sr_no', '')),
                state=str(row['state']),
                mp_name=str(row['mp_name']),
                constituency=str(row['constituency']),
                raw_amount=str(row.get('raw_amount', '')),
                allocated_amount=row['amount_clean'] if not pd.isna(row['amount_clean']) else None,
                category=row['category'],
                source_filename=filename,
                import_date=datetime.utcnow(),
                data_quality_issues=row['quality_issues']
            )
            records_to_add.append(new_rec)
            new_count += 1

    if records_to_add:
        db.bulk_save_objects(records_to_add)

    # Save ImportHistory entry
    history = ImportHistory(
        filename=filename,
        file_path=file_path,
        total_rows=profile_report['total_constituency_records'],
        valid_records=profile_report['valid_financial_records'],
        missing_records=profile_report['missing_financial_records'],
        total_allocated_amount=profile_report['total_allocated_amount_sum'],
        grand_total_in_file=profile_report['grand_total_in_file'],
        imported_at=datetime.utcnow(),
        status="SUCCESS",
        quality_summary=json.dumps(profile_report)
    )
    db.add(history)
    db.commit()

    return {
        "status": "success",
        "new_records": new_count,
        "updated_records": updated_count,
        "total_records": profile_report['total_constituency_records'],
        "profile": profile_report
    }
