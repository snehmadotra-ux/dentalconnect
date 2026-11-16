import os
import sqlite3
from typing import Any, Dict, List, Optional, Tuple

# Database configuration
USE_SQLITE = os.getenv("USE_SQLITE", "false").lower() == "true"
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_USER = os.getenv("POSTGRES_USER", "dental_user")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "dental_secure_password")
POSTGRES_DB = os.getenv("POSTGRES_DB", "dentalconnect_db")

SQLITE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dentalconnect.db")

def get_connection():
    """Returns a database connection.
    Attempts psycopg2 connection to PostgreSQL; falls back to sqlite3 if unreachable or in local mode.
    """
    if not USE_SQLITE:
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            conn = psycopg2.connect(
                host=POSTGRES_HOST,
                port=POSTGRES_PORT,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                dbname=POSTGRES_DB,
                connect_timeout=2
            )
            return conn, "postgres"
        except Exception:
            pass

    # Fallback to local SQLite with dictionary row factory
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    return conn, "sqlite"

def query_all(sql: str, params: Tuple = ()) -> List[Dict[str, Any]]:
    """Execute raw SQL query and return all matching records as dictionaries."""
    conn, db_type = get_connection()
    try:
        if db_type == "postgres":
            from psycopg2.extras import RealDictCursor
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, params)
                return [dict(row) for row in cur.fetchall()]
        else:
            # SQLite uses ? instead of %s
            sqlite_sql = sql.replace("%s", "?")
            cur = conn.cursor()
            cur.execute(sqlite_sql, params)
            return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()

def query_one(sql: str, params: Tuple = ()) -> Optional[Dict[str, Any]]:
    """Execute raw SQL query and return a single record as dictionary."""
    conn, db_type = get_connection()
    try:
        if db_type == "postgres":
            from psycopg2.extras import RealDictCursor
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, params)
                row = cur.fetchone()
                return dict(row) if row else None
        else:
            sqlite_sql = sql.replace("%s", "?")
            cur = conn.cursor()
            cur.execute(sqlite_sql, params)
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()

def execute(sql: str, params: Tuple = ()) -> None:
    """Execute an INSERT, UPDATE, or DELETE raw SQL statement and commit."""
    conn, db_type = get_connection()
    try:
        if db_type == "postgres":
            with conn.cursor() as cur:
                cur.execute(sql, params)
                conn.commit()
        else:
            sqlite_sql = sql.replace("%s", "?")
            cur = conn.cursor()
            cur.execute(sqlite_sql, params)
            conn.commit()
    finally:
        conn.close()

def init_tables():
    """Create all clinical tables using pure standard SQL."""
    conn, db_type = get_connection()
    try:
        cur = conn.cursor()
        
        # 1. Users table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT,
            role TEXT NOT NULL DEFAULT 'PATIENT',
            is_active INTEGER NOT NULL DEFAULT 1,
            zitadel_id TEXT UNIQUE,
            created_at TEXT NOT NULL
        );
        """)

        # Safely migrate zitadel_id if table already existed without it
        try:
            cur.execute("ALTER TABLE users ADD COLUMN zitadel_id TEXT;")
            conn.commit()
        except Exception:
            if db_type == "postgres":
                conn.rollback()

        # 2. Dentist profiles
        cur.execute("""
        CREATE TABLE IF NOT EXISTS dentist_profiles (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL,
            license_number TEXT NOT NULL,
            specialization TEXT NOT NULL,
            years_of_experience TEXT,
            bio TEXT,
            consultation_fee REAL DEFAULT 75.0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 3. Patient profiles
        cur.execute("""
        CREATE TABLE IF NOT EXISTS patient_profiles (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL,
            date_of_birth TEXT,
            gender TEXT,
            blood_group TEXT,
            emergency_contact TEXT,
            medical_allergies TEXT,
            past_dental_history TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 4. Appointments
        cur.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            dentist_id TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'CONFIRMED',
            reason TEXT NOT NULL,
            clinical_notes TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
            FOREIGN KEY (dentist_id) REFERENCES dentist_profiles(id) ON DELETE CASCADE
        );
        """)

        # 5. Dental charts (Odontogram)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS dental_charts (
            id TEXT PRIMARY KEY,
            patient_id TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
        );
        """)

        # 6. Tooth records (1 to 32)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS tooth_records (
            id TEXT PRIMARY KEY,
            chart_id TEXT NOT NULL,
            tooth_number INTEGER NOT NULL,
            condition TEXT NOT NULL DEFAULT 'HEALTHY',
            surfaces TEXT,
            notes TEXT,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (chart_id) REFERENCES dental_charts(id) ON DELETE CASCADE
        );
        """)

        # 7. Prescriptions
        cur.execute("""
        CREATE TABLE IF NOT EXISTS prescriptions (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            dentist_id TEXT NOT NULL,
            appointment_id TEXT,
            clinical_notes TEXT,
            issued_at TEXT NOT NULL,
            FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
            FOREIGN KEY (dentist_id) REFERENCES dentist_profiles(id) ON DELETE CASCADE
        );
        """)

        # 8. Prescription items
        cur.execute("""
        CREATE TABLE IF NOT EXISTS prescription_items (
            id TEXT PRIMARY KEY,
            prescription_id TEXT NOT NULL,
            medication_name TEXT NOT NULL,
            dosage TEXT NOT NULL,
            frequency TEXT NOT NULL,
            duration TEXT NOT NULL,
            instructions TEXT,
            FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
        );
        """)

        # 9. Medical Files & X-Rays
        cur.execute("""
        CREATE TABLE IF NOT EXISTS medical_files (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            file_type TEXT NOT NULL DEFAULT 'XRAY_PANORAMIC',
            s3_key TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_size INTEGER,
            content_type TEXT DEFAULT 'image/jpeg',
            uploaded_at TEXT NOT NULL,
            FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
        );
        """)

        # 10. Practitioner Invitations (Invite-based onboarding)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS invitations (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            full_name TEXT,
            role TEXT NOT NULL DEFAULT 'DENTIST',
            specialization TEXT,
            token TEXT UNIQUE NOT NULL,
            invited_by TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used_at TEXT,
            created_at TEXT NOT NULL
        );
        """)

        # 11. Clinical Treatment Ledgers (Procedures, ADA CDT Codes, Ledger Records)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS treatment_records (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            dentist_id TEXT NOT NULL,
            appointment_id TEXT,
            tooth_number INTEGER,
            procedure_code TEXT,
            description TEXT NOT NULL,
            fee REAL DEFAULT 0.0,
            status TEXT NOT NULL DEFAULT 'COMPLETED',
            notes TEXT,
            performed_at TEXT NOT NULL,
            FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
            FOREIGN KEY (dentist_id) REFERENCES dentist_profiles(id) ON DELETE CASCADE
        );
        """)

        # 12. Clinical Documents Store (Radiographs, Consent Forms, Lab Slips)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS clinical_documents (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            dentist_id TEXT,
            category TEXT NOT NULL DEFAULT 'XRAY',
            title TEXT NOT NULL,
            file_name TEXT NOT NULL,
            s3_key TEXT NOT NULL,
            mime_type TEXT DEFAULT 'image/jpeg',
            file_size INTEGER,
            notes TEXT,
            uploaded_at TEXT NOT NULL,
            FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
            FOREIGN KEY (dentist_id) REFERENCES dentist_profiles(id) ON DELETE SET NULL
        );
        """)

        # Safely migrate verification_status and extra columns if upgrading existing db
        migrations = [
            ("users", "verification_status", "TEXT DEFAULT 'ACTIVE'"),
            ("dentist_profiles", "verification_status", "TEXT DEFAULT 'PENDING_VERIFICATION'"),
            ("dentist_profiles", "verified_at", "TEXT"),
            ("dentist_profiles", "verified_by", "TEXT"),
        ]
        for tbl, col, col_def in migrations:
            try:
                cur.execute(f"ALTER TABLE {tbl} ADD COLUMN {col} {col_def};")
                conn.commit()
            except Exception:
                if db_type == "postgres":
                    conn.rollback()

        conn.commit()
    finally:
        conn.close()
