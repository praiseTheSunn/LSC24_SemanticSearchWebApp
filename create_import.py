import os

def write_file_index(folder_path, output_file):
    with open(output_file, 'w') as f:
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                if file.endswith('.jpg'):
                    file_name = os.path.splitext(file)[0]
                    file_path = os.path.join(root, file)
                    f.write(f"import {file_name} from '{file_path}'\n")

def count_file(folder_path):
    count = 0
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if file.endswith('.jpg'):
                count += 1
    print(count)
    return count
# Specify the folder containing the .jpg files
folder_path = r'E:\\LSCDATA\\keyframes'

# Specify the output file
output_file = 'file_index.js'

# # Write the file index
# write_file_index(folder_path, output_file)
count_file(folder_path)
