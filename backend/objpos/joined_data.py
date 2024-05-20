import sqlite3

# Connect to the image_data.db and metadata.db databases
conn_images = sqlite3.connect('image_data.db')
conn_metadata = sqlite3.connect('metadata.db')

# Attach the metadata.db database to the image_data.db connection
conn_images.execute("ATTACH DATABASE 'metadata.db' AS metadata")

# Create a connection to the new database or open an existing one
conn_joined = sqlite3.connect('joined_data.db')

# Create a cursor for each connection
cursor_images = conn_images.cursor()
cursor_metadata = conn_metadata.cursor()
cursor_joined = conn_joined.cursor()

# Create the joined_data table in the joined_data.db database
cursor_joined.execute('''
CREATE TABLE IF NOT EXISTS joined_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filepath TEXT,
    score REAL,
    date TEXT,
    time TEXT,
    location TEXT,
    new_lat REAL,
    new_lng REAL,
    caption TEXT,
    ocr TEXT,
    activity TEXT,
    top_left_x REAL,
    top_left_y REAL,
    bottom_right_x REAL,
    bottom_right_y REAL,
    object_name TEXT
)
''')

# Join the tables and insert the data into the joined_data table
cursor_images.execute('''
SELECT i.filepath, i.object_name, i.top_left_x, i.top_left_y, i.bottom_right_x, i.bottom_right_y,
       m.date, m.time, m.location, m.new_lat, m.new_lng, m.caption, m.ocr, m.activity
FROM images i
JOIN metadata m ON i.filepath = m.filepath
''')

# Fetch all joined rows
joined_rows = cursor_images.fetchall()

# Insert joined rows into the joined_data table
cursor_joined.executemany('''
INSERT INTO joined_data (filepath,object_name, top_left_x, top_left_y, bottom_right_x, bottom_right_y,
                         date, time, location, new_lat, new_lng, caption, ocr, activity)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
''', joined_rows)

# Commit and close the connections
conn_joined.commit()
conn_images.close()
conn_metadata.close()
conn_joined.close()
