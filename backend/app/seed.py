import uuid
from datetime import datetime, timedelta, timezone, date
from app.core.db import init_tables, query_one, execute
from app.core.security import get_password_hash

def seed_database():
    print("🌱 Initializing Tables & Seeding Database (Raw SQL)...")
    init_tables()

    now_iso = datetime.now(timezone.utc).isoformat()

    # 0. Clinic Super Administrator (one-time bootstrap)
    existing_admin = query_one("SELECT id FROM users WHERE email = %s", ("admin@dentalconnect.com",))
    if not existing_admin:
        admin_user_id = str(uuid.uuid4())
        execute(
            """
            INSERT INTO users (id, email, hashed_password, full_name, phone, role, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                admin_user_id,
                "admin@dentalconnect.com",
                get_password_hash("AdminSecure123!"),
                "System Administrator",
                "+1 (555) 000-0001",
                "ADMIN",
                1,
                now_iso,
            ),
        )
        print("  + Seeded Admin: admin@dentalconnect.com")

    # Check if clinical demo data already seeded
    existing = query_one("SELECT id FROM users WHERE email = %s", ("dr.vance@dentalconnect.com",))
    if existing:
        print("✓ Clinical demo data is already seeded.")
        return

    # 1. Demo Dentist
    dentist_user_id = str(uuid.uuid4())
    execute(
        """
        INSERT INTO users (id, email, hashed_password, full_name, phone, role, is_active, verification_status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            dentist_user_id,
            "dr.vance@dentalconnect.com",
            get_password_hash("Password123!"),
            "Dr. Sarah Vance, DDS",
            "+1 (555) 234-5678",
            "DENTIST",
            1,
            "ACTIVE",
            now_iso,
        ),
    )

    dentist_profile_id = str(uuid.uuid4())
    execute(
        """
        INSERT INTO dentist_profiles (id, user_id, license_number, specialization, years_of_experience, bio, consultation_fee, verification_status, verified_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            dentist_profile_id,
            dentist_user_id,
            "DDS-98421-CA",
            "Cosmetic & Restorative Dentistry",
            "12 years",
            "Specialist in painless restorative dentistry, endodontics, and clear aligners.",
            90.0,
            "ACTIVE",
            now_iso,
        ),
    )

    # 2. Demo Patient
    patient_user_id = str(uuid.uuid4())
    execute(
        """
        INSERT INTO users (id, email, hashed_password, full_name, phone, role, is_active, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            patient_user_id,
            "alex@example.com",
            get_password_hash("Password123!"),
            "Alex Miller",
            "+1 (555) 987-6543",
            "PATIENT",
            1,
            now_iso,
        ),
    )

    patient_profile_id = str(uuid.uuid4())
    execute(
        """
        INSERT INTO patient_profiles (id, user_id, date_of_birth, gender, blood_group, emergency_contact, medical_allergies, past_dental_history)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            patient_profile_id,
            patient_user_id,
            "1994-06-15",
            "Male",
            "O+",
            "Emily Miller (+1 555-432-1098)",
            "Penicillin allergy",
            "Wisdom teeth extracted in 2018. Regular cleaning every 6 months.",
        ),
    )

    # 3. Create Odontogram Dental Chart (32 teeth)
    chart_id = str(uuid.uuid4())
    execute(
        "INSERT INTO dental_charts (id, patient_id, created_at, updated_at) VALUES (%s, %s, %s, %s)",
        (chart_id, patient_profile_id, now_iso, now_iso),
    )

    demo_conditions = {
        3: ("CROWN", "MOD", "Porcelain crown placed 2021"),
        14: ("CARIES", "O", "Occlusal decay detected - composite filling needed"),
        19: ("ROOT_CANAL", "MOD", "Endodontic therapy completed"),
        30: ("FILLING", "MO", "Existing amalgam restoration intact"),
        1: ("MISSING", None, "Wisdom tooth extracted"),
        16: ("MISSING", None, "Wisdom tooth extracted"),
        17: ("MISSING", None, "Wisdom tooth extracted"),
        32: ("MISSING", None, "Wisdom tooth extracted"),
    }

    for tooth_num in range(1, 33):
        cond, surfaces, notes = demo_conditions.get(tooth_num, ("HEALTHY", None, None))
        execute(
            """
            INSERT INTO tooth_records (id, chart_id, tooth_number, condition, surfaces, notes, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (str(uuid.uuid4()), chart_id, tooth_num, cond, surfaces, notes, now_iso),
        )

    # 4. Sample Appointment
    appt_id = str(uuid.uuid4())
    start_time = (datetime.now(timezone.utc) + timedelta(days=2, hours=3)).isoformat()
    end_time = (datetime.now(timezone.utc) + timedelta(days=2, hours=4)).isoformat()
    execute(
        """
        INSERT INTO appointments (id, patient_id, dentist_id, start_time, end_time, status, reason, clinical_notes, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            appt_id,
            patient_profile_id,
            dentist_profile_id,
            start_time,
            end_time,
            "CONFIRMED",
            "Filling procedure for Tooth #14 (Upper Left First Molar)",
            "Scheduled for composite filling under local anesthesia.",
            now_iso,
        ),
    )

    # 5. Sample Prescription
    rx_id = str(uuid.uuid4())
    execute(
        """
        INSERT INTO prescriptions (id, patient_id, dentist_id, appointment_id, clinical_notes, issued_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            rx_id,
            patient_profile_id,
            dentist_profile_id,
            appt_id,
            "Post-procedure pain management and infection control.",
            now_iso,
        ),
    )

    execute(
        """
        INSERT INTO prescription_items (id, prescription_id, medication_name, dosage, frequency, duration, instructions)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            str(uuid.uuid4()),
            rx_id,
            "Amoxicillin 500mg (Oral Capsule)",
            "500mg",
            "Three times daily (every 8 hours)",
            "7 days",
            "Take after meals with plenty of water. Finish entire course.",
        ),
    )

    execute(
        """
        INSERT INTO prescription_items (id, prescription_id, medication_name, dosage, frequency, duration, instructions)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            str(uuid.uuid4()),
            rx_id,
            "Ibuprofen 600mg (Oral Tablet)",
            "600mg",
            "Every 6 to 8 hours as needed for dental pain",
            "3 days",
            "Do not exceed 2400mg per day. Take with food.",
        ),
    )

    print("✅ Seed completed!")
    print("  - Admin:   admin@dentalconnect.com (AdminSecure123!)")
    print("  - Dentist: dr.vance@dentalconnect.com (Password123!)")
    print("  - Patient: alex@example.com (Password123!)")

if __name__ == "__main__":
    seed_database()
