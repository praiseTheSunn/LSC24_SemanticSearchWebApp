import sqlite3
import pandas as pd

# Connect to SQLite database
conn = sqlite3.connect('metadata.db')
cursor = conn.cursor()

# Create a table to store image data
cursor.execute('''CREATE TABLE IF NOT EXISTS metadata (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filepath TEXT,
                date TEXT,
                time TEXT,
                day_of_week TEXT,
                location TEXT,
                location_displayed TEXT,
                location_id INTEGER,
                new_lat REAL,
                new_lng REAL,
                activity TEXT,
                activity_id INTEGER,
                event_id INTEGER,
                caption TEXT,
                ocr TEXT,
                object_tags TEXT
                )''')
conn.commit()

# Load metadata from CSV file
metadata = pd.read_csv("metadata_response_6.csv")
metadata.set_index('image_link', inplace=True)
count = 0
for filepath in metadata.index:
    date = metadata.loc[filepath, 'date']
    time = metadata.loc[filepath, 'time']
    day_of_week = metadata.loc[filepath, 'day_of_week']
    location = metadata.loc[filepath, 'location']
    location_displayed = metadata.loc[filepath, 'location_displayed']
    location_id = metadata.loc[filepath, 'location_id']
    new_lat = metadata.loc[filepath, 'new_lat']
    new_lng = metadata.loc[filepath, 'new_lng']
    activity = metadata.loc[filepath, 'activity']
    activity_id = metadata.loc[filepath, 'activity_id']
    event_id = metadata.loc[filepath, 'event_id']
    caption = metadata.loc[filepath, 'caption']
    ocr = metadata.loc[filepath, 'ocr']
    object_tags = metadata.loc[filepath, 'object_tags']

    cursor.execute('''INSERT INTO metadata (filepath, date, time, day_of_week, location, location_displayed, location_id, new_lat, new_lng, activity, activity_id, event_id, caption, ocr, object_tags)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                    (filepath, date, time, day_of_week, location, location_displayed, int(location_id), new_lat, new_lng, activity, int(activity_id), int(event_id), caption, ocr, object_tags))    
    count += 1
    if count % 1000 == 0:
        print(count)
conn.commit()

