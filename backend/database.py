
import sqlite3
import os

# Database location
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "mindcare.db")


# Create database and tables
def init_db():

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Store chatbot conversations and AI sentiment
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_message TEXT NOT NULL,
            bot_reply TEXT NOT NULL,
            sentiment TEXT,
            confidence REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Store manually selected moods
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mood_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mood TEXT NOT NULL,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mood_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        insight TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")
    # Store completed wellness activities
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS completed_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_title TEXT NOT NULL,
        activity_date TEXT NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(activity_title, activity_date)
        )
    """)

    conn.commit()
    conn.close()

    print("MindCare database initialized successfully!")


# Save chatbot conversation
def save_conversation(user_message, bot_reply, sentiment, confidence):

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO conversations
        (user_message, bot_reply, sentiment, confidence)
        VALUES (?, ?, ?, ?)
    """, (user_message, bot_reply, sentiment, confidence))

    conn.commit()
    conn.close()
    
def get_chat_history():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, user_message, bot_reply, created_at
        FROM conversations
        ORDER BY created_at DESC
    """)

    conversations = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return conversations


# Save manually selected mood
def save_mood(mood, note=""):

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO mood_entries (mood, note)
        VALUES (?, ?)
    """, (mood, note))

    conn.commit()
    conn.close()
    
def get_moods():

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, mood, note, created_at
        FROM mood_entries
        ORDER BY created_at DESC
    """)

    moods = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return moods


    
def save_mood_insight(insight):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO mood_insights (insight)
        VALUES (?)
    """, (insight,))

    conn.commit()
    conn.close()


def get_mood_insights():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, insight, created_at
        FROM mood_insights
        ORDER BY created_at DESC, id DESC
    """)

    insights = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return insights

def save_completed_activity(activity_title):
    from datetime import date

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT OR IGNORE INTO completed_activities
        (activity_title, activity_date)
        VALUES (?, ?)
    """, (activity_title, date.today().isoformat()))

    conn.commit()
    saved = cursor.rowcount > 0
    conn.close()

    return saved

def get_completed_activities():
    from datetime import date

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, activity_title, activity_date, completed_at
        FROM completed_activities
        WHERE activity_date = ?
        ORDER BY completed_at DESC
    """, (date.today().isoformat(),))

    activities = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return activities
    
def get_weekly_completed_activities():
    from datetime import date, timedelta

    today = date.today()
    start_date = today - timedelta(days=6)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("""
        SELECT activity_date, COUNT(*) AS total
        FROM completed_activities
        WHERE activity_date BETWEEN ? AND ?
        GROUP BY activity_date
        ORDER BY activity_date ASC
    """, (start_date.isoformat(), today.isoformat()))

    activities = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return activities


def get_activity_dates():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT DISTINCT activity_date
        FROM completed_activities
        ORDER BY activity_date ASC
    """)

    dates = [row[0] for row in cursor.fetchall()]

    conn.close()

    return dates




if __name__ == "__main__":
    init_db()

