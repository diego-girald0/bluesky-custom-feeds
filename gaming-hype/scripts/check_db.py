import sqlite3
import os

db_path = os.path.join(os.getcwd(), '..', 'db', 'database.sqlite')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT * FROM post LIMIT 10")

rows = cursor.fetchall()
if rows:
    for row in rows:
        print(row)
else:
    print("No posts found in the database.")

conn.close()
