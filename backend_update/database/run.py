import sys
sys.path.append("..")
from database.image_database import ImageDatabase

# db_manager = ImageDatabase("lsc24")
db_manager = ImageDatabase("vbs25_v3c")
db_manager.batch_insert_images()
db_manager.close()