import sqlite3
import yaml
import pandas as pd
from utils import infer_sqlite_types, load_config


class ImageDatabaseManager:
    def __init__(self, dataset_name: str):
        self.dataset_name = dataset_name
        self.db_path = f"{self.dataset_name}.db"
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()

        # Load config (column mapping, metadata file path)
        try:
            self.config = load_config(f"../configs/{self.dataset_name}_config.yaml")
        except FileNotFoundError:
            raise ValueError(f"Config file not found for dataset: {self.dataset_name}")
        self.metadata_file_path = self.config.get("metadata_file_path")
        self.column_mapping = self.config.get("column_mapping")

        # Ensure the tables exist before inserting data
        self.create_tables()


    def create_tables(self):
        inferred_types = infer_sqlite_types(self.metadata_file_path, self.column_mapping)

        # Create connection
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Define table structure
        table_name = "images"
        columns_def = ", ".join([f"{db_col} {db_col_type}" for db_col, db_col_type in inferred_types.items()])
        create_table_query = f"CREATE TABLE IF NOT EXISTS {table_name} ({columns_def})"
        print(create_table_query)

        self.cursor.execute(create_table_query)
        self.conn.commit()
        print(f"✅ Table created successfully for dataset: {self.dataset_name} at {self.db_path}")

    
    def batch_insert_images(self, batch_size=1000):
        df = pd.read_csv(self.metadata_file_path)
        df = df.rename(columns=self.column_mapping)

        # Convert dataframe to list of tuples for batch insertion
        data = df.to_records(index=False).tolist()
        columns = df.columns.tolist()
        standardized_columns = [self.column_mapping.get(col, col) for col in columns]

        # Insert data in batches
        insert_query = f"INSERT INTO images ({', '.join(standardized_columns)}) VALUES ({', '.join(['?' for _ in standardized_columns])})"

        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            self.cursor.executemany(insert_query, batch)
            self.conn.commit()
            print(f"✅ Inserted {i + batch_size} rows into {self.dataset_name}")

        print(f"🎉 Data loaded successfully for dataset: {self.dataset_name}")


    def close(self):
        self.conn.close()
