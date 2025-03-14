from database_manager import ImageDatabaseManager

db_manager = ImageDatabaseManager("lsc24")
db_manager.batch_insert_images()
db_manager.close()