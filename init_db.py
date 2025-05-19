import sqlite3

db_path = 'users.db'
conn = sqlite3.connect(db_path)
try:
    with conn:
        cursor = conn.cursor()
        # 1. Create the table if it doesn't exist (without profile_pic column)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            );
        """)
        # 2. Check if 'profile_pic' column exists
        cursor.execute(
            "SELECT COUNT(*) FROM pragma_table_info('users') WHERE name='profile_pic'"
        )
        if cursor.fetchone()[0] == 0:
            # 3. Add the column if it is missing
            cursor.execute("ALTER TABLE users ADD COLUMN profile_pic TEXT")
    print("Database setup complete.")
except sqlite3.Error as e:
    print(f"Database error: {e}")
finally:
    conn.close()
