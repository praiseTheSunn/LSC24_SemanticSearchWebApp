import sqlite3
import csv
import re
import openpyxl

# Connect to SQLite database
conn = sqlite3.connect('image_data.db')
cursor = conn.cursor()

# Create a table to store image data
cursor.execute('''CREATE TABLE IF NOT EXISTS images (
                filename TEXT,
                object_name TEXT,
                top_left_x REAL,
                top_left_y REAL,
                bottom_right_x REAL,
                bottom_right_y REAL
                )''')

conn.commit()


def insert_data_from_csv(file_path):
    conn = sqlite3.connect('image_data.db')
    cursor = conn.cursor()
    
    if file_path.endswith('.csv'):
        with open(file_path, 'r') as file:
            reader = csv.reader(file)
            next(reader)  # Skip header row
            for row in reader:
                filename = row[0]
                for item in row[1:]:
                    # Use regex to extract object name and coordinates
                    matches = re.match(r'\[(.*?)\((.*?)\)\((.*?)\)\]', item)
                    if matches:
                        object_and_coordinates = matches.group(0)
                        object_name_end_index = None
                        top_left_x = None
                        top_left_y = None
                        bottom_right_x = None
                        bottom_right_y = None
                        if object_and_coordinates.count('(') == 3:
                            object_name_end_index = object_and_coordinates.index(')(') + 1
                            top_left = matches.group(3).split(')(')
                            top_left_x, top_left_y = map(float, top_left[0].split(';'))
                            bottom_right_x, bottom_right_y = map(float, top_left[1].split(';'))
                        else:
                            object_name_end_index = object_and_coordinates.index('(')
                            top_left_x, top_left_y = map(float, matches.group(2).split(';'))
                            bottom_right_x, bottom_right_y = map(float, matches.group(3).split(';'))
                        object_name = object_and_coordinates[:object_name_end_index].strip('[')                    
                        
                        cursor.execute('''INSERT INTO images (filename, object_name, top_left_x, top_left_y, bottom_right_x, bottom_right_y)
                                          VALUES (?, ?, ?, ?, ?, ?)''',
                                       (filename, object_name, top_left_x, top_left_y, bottom_right_x, bottom_right_y))
    conn.commit()


# Insert data from Excel files
def insert_data_from_xlsx(file_path):
    if file_path.endswith('.xlsx'):
        wb = openpyxl.load_workbook(file_path)
        sheet = wb.active
        for row in sheet.iter_rows(min_row=2, values_only=True):
            filename = row[0]
            # print(filename)
            for item in row[1:]:
                # print(item)
                if item is None:
                    continue
                matches = re.match(r'\[(.*?)\((.*?)\)\((.*?)\)\]', item)

                if matches:
                    object_and_coordinates = matches.group(0)
                    object_name_end_index = None
                    top_left_x = None
                    top_left_y = None
                    bottom_right_x = None
                    bottom_right_y = None
                    if object_and_coordinates.count('(') == 3:
                        object_name_end_index = object_and_coordinates.index(')(') + 1
                        top_left = matches.group(3).split(')(')
                        top_left_x, top_left_y = map(float, top_left[0].split(';'))
                        bottom_right_x, bottom_right_y = map(float, top_left[1].split(';'))
                    else:
                        object_name_end_index = object_and_coordinates.index('(')
                        top_left_x, top_left_y = map(float, matches.group(2).split(';'))
                        bottom_right_x, bottom_right_y = map(float, matches.group(3).split(';'))
                    object_name = object_and_coordinates[:object_name_end_index].strip('[')    
                    # uppercase first letter of object name
                    object_name = object_name[0].upper() + object_name[1:]                
                    
                    # print(filename, object_name, top_left_x, top_left_y, bottom_right_x, bottom_right_y)
                    cursor.execute('''INSERT INTO images (filename, object_name, top_left_x, top_left_y, bottom_right_x, bottom_right_y)
                                      VALUES (?, ?, ?, ?, ?, ?)''',
                                   (filename, object_name, top_left_x, top_left_y, bottom_right_x, bottom_right_y))
    
    conn.commit()


# Insert data from CSV files
# insert_data_from_csv("E:\\LSCDATA\\obj\\coordinates\\v8_boundary_percent.csv")
# print("v8 done")
# insert_data_from_xlsx("E:\\LSCDATA\\obj\\coordinates\\v9_boundary_percent.xlsx")
# print("v9 done")

# Commit changes and close connection
conn.commit()
conn.close()

