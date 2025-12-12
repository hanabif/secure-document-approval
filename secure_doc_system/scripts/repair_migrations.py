import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / 'db.sqlite3'

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

def show_migrations():
    cur.execute("SELECT app, name, applied FROM django_migrations ORDER BY app, name")
    rows = cur.fetchall()
    for r in rows:
        print(r)

def delete_migration(app, name=None):
    if name:
        cur.execute("DELETE FROM django_migrations WHERE app=? AND name=?", (app, name))
        print(f"Deleted migration row: {app}.{name}")
    else:
        cur.execute("DELETE FROM django_migrations WHERE app=?", (app,))
        print(f"Deleted all migration rows for app: {app}")
    conn.commit()

if __name__ == '__main__':
    print('Current migrations:')
    show_migrations()
    # Remove possibly-inconsistent entries so migrate can run in correct order
    # Remove problematic entries: delete accounts initial and all authtoken entries
    # Also remove admin/auth/contenttypes/sessions so migrations can be re-applied in correct order
    delete_migration('accounts', '0001_initial')
    delete_migration('authtoken')
    delete_migration('admin')
    delete_migration('auth')
    delete_migration('contenttypes')
    delete_migration('sessions')
    print('\nMigrations after deletion:')
    show_migrations()
