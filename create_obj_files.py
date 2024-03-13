import os
import csv

object_folder = 'obj'  # Folder containing .csv files
output_category = 'obj_classes.txt'  # Output file containing object categories
merge_csv_file = 'merged_obj_detect.csv'  # Output file containing merged .csv files

# Function to retrieve object categories from all .csv files
def extract_objects_from_csv(folder_path):
    object_set = set()  # Set to store unique object categories
    
    # Iterate through each file in the folder
    for file_name in os.listdir(folder_path):
        if file_name.endswith('.csv'):
            file_path = os.path.join(folder_path, file_name)
            
            # Read each CSV file
            with open(file_path, 'r') as file:
                for line in file:
                    # Split the line and extract object categories
                    objects = line.strip().split(',')[1:]
                    object_set.update(objects)  # Add objects to the set
    
    # Sort the object categories in ascending order
    object_list = sorted(object_set)
    
    # Write object categories to a .txt file
    with open(output_category, 'w') as txt_file:
        for obj in object_list:
            txt_file.write(obj + '\n')

def merge_csv_files(folder_path, output_file):
    merged_records = {}  # Dictionary to store records based on image paths
    
    # Iterate through each file in the folder
    for file_name in os.listdir(folder_path):
        file_path = os.path.join(folder_path, file_name)
        if not file_name.endswith('.csv'):
            continue
        # Read each CSV file
        with open(file_path, 'r') as file:
            for line in file:
                image_path, *objects = line.strip().split(',')
                objects = set(objects)  # Convert objects to a set for uniqueness
                
                # Check if image path exists in the merged records
                if image_path in merged_records:
                    # Merge objects with existing record
                    merged_records[image_path].update(objects)
                else:
                    # Create new record
                    merged_records[image_path] = objects
    
    # Write merged records to a single CSV file
    with open(output_file, 'w') as merged_file:
        for image_path, objects in merged_records.items():
            # Convert objects back to a comma-separated string
            if objects:
                object_str = ','.join(objects)
                whole_line = f"{image_path},{object_str}\n"
                #check if there are two comma consecutively and replace with only one
                whole_line = whole_line.replace(',,',',')
                merged_file.write(whole_line)
            else:
                merged_file.write(f"{image_path}\n")         
                          

extract_objects_from_csv(object_folder)  # Call the function to extract object categories
merge_csv_files(object_folder, merge_csv_file)  # Call the function to merge .csv files