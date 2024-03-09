from ultralytics import YOLO
import json
import os

# Build a YOLOv9c model from pretrained weight
# model = YOLO('weights/yolov9e.pt')
model = YOLO('weights/yolov8x-oiv7.pt')

# set of object write to a csv file name 'obj.csv'
def write_obj_to_csv(obj_list, img_name, folder_name):
    with open(f'{folder_name}_obj.csv', 'a') as f:
        f.write(img_name + ',')
        for obj in obj_list:
            #lower case all object names
            obj = obj.lower()
            f.write(obj)
            if obj != obj_list[-1]:
                f.write(',')
        f.write('\n')


def run_model(input_img_lists, folder_name):
    #inference. Output: Results list
    result_list = model(input_img_lists)

    for index, result in enumerate(result_list):
        #image file name
        img_name = os.path.basename(input_img_lists[index])

        # Process results list
        obj_list = set()
        # result.show()

        json_res = json.loads(result.tojson())
        for obj in json_res:
            if obj['confidence'] > 0.2:
                obj_list.add(obj['name'])
        obj_list = list(obj_list) # convert set to list
        print("result:", img_name, obj_list)
        
        write_obj_to_csv(obj_list, img_name, folder_name)
        
def process_images_in_batches(folder_names):
    print("Processing images in batches...", folder_names)
    # Iterate through each folder name
    for folder_name in folder_names:
        print(f"Processing folder: {folder_name}")
        # Generate folder path
        year_month_path = f"E:\\LSCDATA\\keyframes\\{folder_name}\\"
        print(year_month_path, os.path.exists(year_month_path))

        # Check if year_month_path exists
        if os.path.exists(year_month_path):
            # Iterate through day folders dynamically
            for day_folder in os.listdir(year_month_path):
                day_folder_path = os.path.join(year_month_path, day_folder)

                # Check if day_folder_path is a directory
                if os.path.isdir(day_folder_path):
                    image_paths = []  # List to store image paths for the batch

                    # Iterate through .jpg files in the day folder
                    for file_name in os.listdir(day_folder_path):
                        if file_name.endswith('.jpg'):
                            # Construct full file path
                            file_path = os.path.join(day_folder_path, file_name)
                            image_paths.append(file_path)
                            print(file_path)

                            # Process batch of 10 images
                            if len(image_paths) == 10:
                                run_model(image_paths, folder_name)
                                image_paths = []  # Reset batch

                    # Process remaining images (if any) in the last batch
                    if image_paths:
                        run_model(image_paths, folder_name)

# img = ["E:\\LSCDATA\\keyframes\\201901\\01\\20190101_135224_000.jpg", "E:\\LSCDATA\\keyframes\\201901\\01\\20190101_140734_000.jpg"]

folder_names = ['201909']
process_images_in_batches(folder_names)
