import aiosqlite
from config import DB_PATH, DEFAULT_PASSCODE


async def get_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS media_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_path TEXT UNIQUE NOT NULL,
                filename TEXT NOT NULL,
                media_type TEXT NOT NULL,
                taken_at DATETIME,
                week_year INTEGER,
                week_number INTEGER,
                gps_lat REAL,
                gps_lng REAL,
                address TEXT,
                thumbnail_path TEXT,
                width INTEGER,
                height INTEGER,
                duration REAL,
                family_member TEXT,
                sub_folder TEXT,
                is_hidden BOOLEAN DEFAULT 0,
                face_count INTEGER,
                ai_reviewed BOOLEAN DEFAULT 0,
                file_size INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS weekly_diaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                week_year INTEGER NOT NULL,
                week_number INTEGER NOT NULL,
                week_start DATE,
                audio_path TEXT,
                text_content TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(week_year, week_number)
            );

            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_media_taken_at ON media_files(taken_at);
            CREATE INDEX IF NOT EXISTS idx_media_family_member ON media_files(family_member);
            CREATE INDEX IF NOT EXISTS idx_media_sub_folder ON media_files(sub_folder);
            CREATE INDEX IF NOT EXISTS idx_media_week ON media_files(week_year, week_number);
            CREATE INDEX IF NOT EXISTS idx_media_hidden ON media_files(is_hidden);
            CREATE INDEX IF NOT EXISTS idx_diary_week ON weekly_diaries(week_year, week_number);
        """)

        # Insert default settings
        await db.execute(
            """
            INSERT OR IGNORE INTO app_settings (key, value) VALUES
                ('passcode', ?),
                ('root_media_path', '/media/family'),
                ('ai_service_url', 'http://192.168.1.100:8100'),
                ('thumbnail_dir', 'thumbnails'),
                ('session_secret', 'change-me-in-production')
            """,
            (DEFAULT_PASSCODE,),
        )
        await db.commit()

        # Migration: add sub_folder column for existing databases
        try:
            await db.execute("ALTER TABLE media_files ADD COLUMN sub_folder TEXT")
            await db.execute("CREATE INDEX IF NOT EXISTS idx_media_sub_folder ON media_files(sub_folder)")
            await db.commit()
        except Exception:
            pass  # Column already exists
