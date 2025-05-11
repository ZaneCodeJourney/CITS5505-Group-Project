import sqlite3
import os

def update_shares_table():
    print("Updating shares table with shared_with_user_id column...")
    
    # Connect to the SQLite database
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    
    # Check if the shared_with_user_id column already exists
    cursor.execute("PRAGMA table_info(shares);")
    columns = cursor.fetchall()
    column_names = [column[1] for column in columns]
    
    if 'shared_with_user_id' not in column_names:
        # Add the shared_with_user_id column to the shares table
        print("Adding shared_with_user_id column...")
        cursor.execute("ALTER TABLE shares ADD COLUMN shared_with_user_id INTEGER REFERENCES users(id);")
        conn.commit()
        print("Column added successfully!")
    else:
        print("Column already exists. Skipping...")
    
    # Close the connection
    conn.close()
    print("Database update completed.")

if __name__ == '__main__':
    update_shares_table() 