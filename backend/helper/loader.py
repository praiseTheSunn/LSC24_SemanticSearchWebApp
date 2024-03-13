import settings
import pandas as pd

def load_object_list():
    object_list = []
    with open(settings.object_list_path, 'r') as file:
        for line in file:
            object = line.strip()
            object_list.append(object)
    return object_list

def load_location_category_list():
    location_category_list = []
    location_category_list = pd.read_csv(settings.location_category_list_path)
    return location_category_list['location_category'].tolist()