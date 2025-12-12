import sqlite3
import sys

DB = 'db.sqlite3'
conn = sqlite3.connect(DB)
c = conn.cursor()
print('Before:')
for row in c.execute("SELECT id, app, name FROM django_migrations WHERE app='admin'"):
    print(row)

c.execute("DELETE FROM django_migrations WHERE app='admin'")
conn.commit()
print('Deleted admin rows. After:')
for row in c.execute("SELECT id, app, name FROM django_migrations WHERE app='admin'"):
    print(row)

conn.close()
print('Done')
