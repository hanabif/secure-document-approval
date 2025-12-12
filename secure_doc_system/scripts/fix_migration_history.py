import sqlite3
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / 'db.sqlite3'

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

def has_migration(app, name):
    cur.execute("SELECT COUNT(1) FROM django_migrations WHERE app=? AND name=?", (app, name))
    return cur.fetchone()[0] > 0

def insert_migration(app, name):
    applied = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.%f')
    cur.execute("INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, ?)", (app, name, applied))
    conn.commit()
    print(f"Inserted migration {app}.{name}")

def main():
    # If authtoken is applied but accounts isn't, insert accounts initial migration to fix history
    if has_migration('authtoken', '0001_initial') and not has_migration('accounts', '0001_initial'):
        insert_migration('accounts', '0001_initial')
    else:
        print('No inconsistent migration history detected or nothing to fix.')

if __name__ == '__main__':
    main()
