import sqlite3
import logging
from pathlib import Path
from .config import DATABASE_URL, backend_dir

logger = logging.getLogger("civic_ai.migrations")

def run_migrations():
    """
    Safe, additive SQLite migrations.
    Never drops or modifies existing data. Adds missing columns and tables.
    """
    db_path = backend_dir / "civic_ai.db"
    if not db_path.exists():
        logger.info(f"Database at {db_path} does not exist yet. It will be initialized by SQLAlchemy.")
        return

    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    try:
        # 1. Check email_log table columns
        cursor.execute("PRAGMA table_info(email_log)")
        existing_email_cols = {row[1] for row in cursor.fetchall()}

        if "attempt_count" not in existing_email_cols:
            logger.info("Migrating email_log: adding column attempt_count")
            cursor.execute("ALTER TABLE email_log ADD COLUMN attempt_count INTEGER DEFAULT 1")

        if "retryable" not in existing_email_cols:
            logger.info("Migrating email_log: adding column retryable")
            cursor.execute("ALTER TABLE email_log ADD COLUMN retryable BOOLEAN DEFAULT 0")

        # 2. Check complaints table columns
        cursor.execute("PRAGMA table_info(complaints)")
        existing_complaint_cols = {row[1] for row in cursor.fetchall()}

        if "assigned_team_id" not in existing_complaint_cols:
            logger.info("Migrating complaints: adding column assigned_team_id")
            cursor.execute("ALTER TABLE complaints ADD COLUMN assigned_team_id VARCHAR")

        if "assignment_score" not in existing_complaint_cols:
            logger.info("Migrating complaints: adding column assignment_score")
            cursor.execute("ALTER TABLE complaints ADD COLUMN assignment_score FLOAT")

        if "assignment_reason" not in existing_complaint_cols:
            logger.info("Migrating complaints: adding column assignment_reason")
            cursor.execute("ALTER TABLE complaints ADD COLUMN assignment_reason TEXT")

        if "is_demo" not in existing_complaint_cols:
            logger.info("Migrating complaints: adding column is_demo")
            cursor.execute("ALTER TABLE complaints ADD COLUMN is_demo BOOLEAN DEFAULT 0")

        if "reopen_count" not in existing_complaint_cols:
            logger.info("Migrating complaints: adding column reopen_count")
            cursor.execute("ALTER TABLE complaints ADD COLUMN reopen_count INTEGER DEFAULT 0")

        if "reopened_at" not in existing_complaint_cols:
            logger.info("Migrating complaints: adding column reopened_at")
            cursor.execute("ALTER TABLE complaints ADD COLUMN reopened_at DATETIME")

        if "closed_at" not in existing_complaint_cols:
            logger.info("Migrating complaints: adding column closed_at")
            cursor.execute("ALTER TABLE complaints ADD COLUMN closed_at DATETIME")

        if "closure_reason" not in existing_complaint_cols:
            logger.info("Migrating complaints: adding column closure_reason")
            cursor.execute("ALTER TABLE complaints ADD COLUMN closure_reason TEXT")

        if "tracking_token" not in existing_complaint_cols:
            logger.info("Migrating complaints: adding column tracking_token")
            cursor.execute("ALTER TABLE complaints ADD COLUMN tracking_token VARCHAR(64)")

        # Backfill tracking_token for existing complaints if null
        cursor.execute("SELECT id FROM complaints WHERE tracking_token IS NULL OR tracking_token = ''")
        untokened = cursor.fetchall()
        if untokened:
            import secrets
            for (cid,) in untokened:
                token = f"tr_{secrets.token_urlsafe(16)}"
                cursor.execute("UPDATE complaints SET tracking_token = ? WHERE id = ?", (token, cid))
            logger.info(f"Backfilled secure tracking tokens for {len(untokened)} existing complaints.")

        # 3. Check status_history table columns
        cursor.execute("PRAGMA table_info(status_history)")
        existing_history_cols = {row[1] for row in cursor.fetchall()}

        if "actor" not in existing_history_cols:
            logger.info("Migrating status_history: adding column actor")
            cursor.execute("ALTER TABLE status_history ADD COLUMN actor VARCHAR")

        if "notes" not in existing_history_cols:
            logger.info("Migrating status_history: adding column notes")
            cursor.execute("ALTER TABLE status_history ADD COLUMN notes TEXT")

        # 4. Check officers table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='officers'")
        if not cursor.fetchone():
            logger.info("Creating officers table...")
            cursor.execute("""
                CREATE TABLE officers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email VARCHAR(120) UNIQUE NOT NULL,
                    full_name VARCHAR(120) NOT NULL,
                    badge_number VARCHAR(50) NOT NULL,
                    department VARCHAR(100) NOT NULL,
                    role VARCHAR(50) NOT NULL DEFAULT 'Officer',
                    password_hash VARCHAR(255) NOT NULL,
                    salt VARCHAR(64) NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """)

        # Seed default officers if table is empty
        cursor.execute("SELECT COUNT(*) FROM officers")
        if cursor.fetchone()[0] == 0:
            from .auth import DEFAULT_SEEDED_OFFICERS, hash_password
            logger.info("Seeding default municipal officers...")
            for off in DEFAULT_SEEDED_OFFICERS:
                pwd_hash, salt = hash_password(off["password"])
                cursor.execute("""
                    INSERT INTO officers (email, full_name, badge_number, department, role, password_hash, salt, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                """, (off["email"], off["full_name"], off["badge_number"], off["department"], off["role"], pwd_hash, salt))
            logger.info(f"Seeded {len(DEFAULT_SEEDED_OFFICERS)} municipal officers into database.")

        conn.commit()
        logger.info("Database migrations applied successfully.")
    except Exception as e:
        logger.error(f"Migration error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migrations()
