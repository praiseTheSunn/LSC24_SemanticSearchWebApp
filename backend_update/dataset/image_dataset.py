from abc import ABC, abstractmethod
import re
import yaml
import sqlite3


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
            raise ValueError(f"Config file not found for dataset: {self.dataset_name}")
        self.metadata_file_path = self.config.get("metadata_file_path")
        self.column_mapping = self.config.get("column_mapping")

        # DB
        self.db_path = f"../database/{self.dataset_name}.db"
        self.init_db()

        # Create a mapping from string image ID to integer image ID
        self.cursor.execute("SELECT image_id, int_image_id FROM images")
        self.image_id_to_int_image_id = {row[0]: row[1] for row in self.cursor.fetchall()}

    
    @abstractmethod
    def get_dataset_name(self):
        pass

    def init_db(self):
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()        

    def __len__(self):
        """Returns the total number of images."""
        query = "SELECT COUNT(*) FROM images"
        return self.cursor.execute(query).fetchone()[0]

    def __getitem__(self, id):
        """Retrieves image metadata by index or image ID."""
        if isinstance(id, int):
            int_image_id = id
        else:
            image_id = self.standardize_image_id(id)
            int_image_id = self.image_id_to_int_image_id.get(image_id)
        query = "SELECT * FROM images WHERE int_image_id = ?"
        return self.cursor.execute(query, (int_image_id,)).fetchone()

    def standardize_image_id(self, image_id):
        """Converts a string ID to an integer ID."""
        # Step 1: Remove HTTP(S) and domain/IP with port
        image_id = re.sub(r'^https?://[^/]+:?[^/]*/', '', image_id)    
        # Step 2: Remove any leading domain/IP with port if present
        image_id = re.sub(r'^[^/]+:?[^/]*/', '', image_id)          
        # Step 3: Remove file extension (if any)
        image_id = re.sub(r'\.\w+$', '', image_id)          
        return image_id    


class LSC24Dataset(ImageDataset):
    def get_dataset_name(self):
        return "lsc24"

class V3CDataset(ImageDataset):
    def get_dataset_name(self):
        return "v3c"

class MVKDataset(ImageDataset):
    def get_dataset_name(self):
        return "mvk"

class LHEDataset(ImageDataset):
    def get_dataset_name(self):
        return "lhe"


a = LSC24Dataset()
print(a)
print(a.get_dataset_name())
print(a.column_mapping)
print(a.standardize_image_id("https://example.com/image.jpg"))