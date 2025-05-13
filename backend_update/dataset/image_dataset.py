import pandas as pd
import re
import sqlite3
import yaml
from abc import ABC, abstractmethod
from pymilvus import DataType


def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


class ImageDataset(ABC):
    """Abstract class for image datasets."""

    def __init__(self):
        self.dataset_name = self.get_dataset_name()  # Subclasses must implement this

        # Load config (column mapping, metadata file path)
        try:
            self.config = load_config(f"../configs/{self.dataset_name}_config.yaml")
        except FileNotFoundError:
            raise ValueError(f"Config file not found for dataset at path: ../configs/{self.dataset_name}_config.yaml")
        self.metadata_file_path = self.config.get("metadata_file_path")
        self.embedding_dir = self.config.get("embedding_dir")
        self.image_server_url = self.config.get("image_server_url")
        self.image_extension = self.config.get("image_extension")
        self.column_mapping = self.config.get("column_mapping")
        self.filters = self.config.get("filters", [])
        self.unifying_category = self.config.get("unifying_category", None)
        self.full_text_fields = self.config.get("full_text_fields", [])

        # # DB
        # self.db_path = f"../database/{self.dataset_name}.db"
        # self.init_db()

        # # Create a mapping from string image ID to integer image ID
        # self.cursor.execute("SELECT image_id, record_id FROM images")
        # rows = self.cursor.fetchall()
        # self.image_id_to_record_id = {row[0]: row[1] for row in rows}
        # self.record_id_to_image_id = {row[1]: row[0] for row in rows} 

        # self.cursor.execute("SELECT record_id, video_id FROM images")
        # self.record_id_to_video_id = {row[0]: row[1] for row in self.cursor.fetchall()}

        import time
        start_time = time.time()
        print(f"Creating image ID to record ID mapping for {self.dataset_name} dataset...")
        df = pd.read_csv(self.metadata_file_path)
        print(f"Metadata file loaded in {time.time() - start_time:.2f} seconds")
        id_column_mapping = {k: v for k, v in self.column_mapping.items() if v in ["image_id", "record_id"]}
        df = df[list(id_column_mapping.keys())]
        print(f"Columns filtered in {time.time() - start_time:.2f} seconds")
        df = df.rename(columns=id_column_mapping)
        print(f"Columns renamed in {time.time() - start_time:.2f} seconds")
        self.image_id_to_record_id = df.set_index("image_id")["record_id"].to_dict()
        print(f"Image ID to Record ID mapping created in {time.time() - start_time:.2f} seconds")
        self.record_id_to_image_id = df.set_index("record_id")["image_id"].to_dict()
        print(f"Record ID to Image ID mapping created in {time.time() - start_time:.2f} seconds")

    
    @abstractmethod
    def get_dataset_name(self):
        pass

    # def init_db(self):
    #     self.conn = sqlite3.connect(self.db_path)
    #     self.cursor = self.conn.cursor()        

    def __len__(self):
        """Returns the total number of images."""
        query = "SELECT COUNT(*) FROM images"
        return self.cursor.execute(query).fetchone()[0]

    def __getitem__(self, id):
        """Retrieves image metadata by index or image ID."""
        if isinstance(id, int):
            record_id = id
        else:
            image_id = self.standardize_image_id(id)
            record_id = self.image_id_to_record_id.get(image_id)
        query = "SELECT * FROM images WHERE record_id = ?"
        return self.cursor.execute(query, (record_id,)).fetchone()

    def standardize_image_id(self, image_id):
        """Converts a string ID to an integer ID."""
        # Step 1: Remove HTTP(S) and domain/IP with port
        image_id = re.sub(r'^https?://[^/]+:?[^/]*/', '', image_id)    
        # Step 2: Remove any leading domain/IP with port if present
        # image_id = re.sub(r'^[^/]+:?[^/]*/', '', image_id)          
        # Step 3: Remove file extension (if any)
        image_id = re.sub(r'\.\w+$', '', image_id)          
        return image_id    
    
    def get_unifying_category_ids(self, record_ids, unifying_category):
        # Create temp table with an index to preserve input order and duplicates
        self.cursor.execute("""
            CREATE TEMP TABLE IF NOT EXISTS temp_record_ids (
                idx INTEGER,
                record_id INTEGER
            )
        """)

        # Clear temp table
        self.cursor.execute("DELETE FROM temp_record_ids")

        # Insert with input order index
        self.cursor.executemany(
            "INSERT INTO temp_record_ids (idx, record_id) VALUES (?, ?)",
            [(i, rid) for i, rid in enumerate(record_ids)]
        )


        # # how many distinct record_ids in record_ids
        # # Get the count of distinct record_ids
        # query = "SELECT COUNT(DISTINCT record_id) FROM images"
        # self.cursor.execute(query)
        # distinct_count = self.cursor.fetchone()[0]
        # print(f"Distinct count of record_ids: {distinct_count}")

        # Join and order by idx to preserve input order and allow duplicates
        query = f"""
            SELECT i.{unifying_category}
            FROM temp_record_ids t
            LEFT JOIN images i ON i.record_id = t.record_id
            ORDER BY t.idx
        """
        self.cursor.execute(query)
        return [row[0] for row in self.cursor.fetchall()]
    
    def get_metadata_file_path(self):
        return self.metadata_file_path
    
    def get_embedding_dir(self):
        return self.embedding_dir

    def get_image_server_url(self):
        return self.image_server_url
    
    def get_image_extension(self):
        return self.image_extension
    
    def get_column_mapping(self):
        return self.column_mapping
    
    def get_filters(self):
        return self.filters
    
    def get_unifying_category(self):
        return self.unifying_category
    
    def get_full_text_fields(self):
        return self.full_text_fields



class LSC24Dataset(ImageDataset):
    def get_dataset_name(self):
        return "lsc24"

class LSC24aDataset(ImageDataset):
    def get_dataset_name(self):
        return "lsc24a"
    
class V3CDataset(ImageDataset):
    def get_dataset_name(self):
        return "vbs25_v3c"

class MVKDataset(ImageDataset):
    def get_dataset_name(self):
        return "vbs25_mvk"

class LHEDataset(ImageDataset):
    def get_dataset_name(self):
        return "vbs25_lhe"


# a = LSC24Dataset()
# print(a)
# print(a.get_dataset_name())
# print(a.column_mapping)
# print(a.standardize_image_id("https://example.com/image.jpg"))