import pandas as pd
import re
import sqlite3
import yaml
from abc import ABC, abstractmethod
from pathlib import Path
import threading
import warnings
import os
import tempfile


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

        import time
        start_time = time.time()
        print(f"Creating image ID to record ID mapping for {self.dataset_name} dataset...")

        start_time = time.time()

        # Prefer fast preprocessed cache if available (parquet or pickle). This
        # greatly reduces startup time vs parsing large CSVs.
        metadata_path = Path(self.metadata_file_path)
        parquet_path = metadata_path.with_suffix('.parquet')
        pkl_path = metadata_path.with_suffix('.pkl')

        def _load_from_csv():
            # Load only required columns; explicit low_memory to False for speed/consistency
            return pd.read_csv(self.metadata_file_path, usecols=self.column_mapping.keys(), low_memory=False)

        df = None
        # Try parquet/pickle caches only if they are up-to-date vs CSV (mtime check)
        try:
            csv_mtime = metadata_path.stat().st_mtime

            def _safe_mtime(p: Path) -> float:
                try:
                    return p.stat().st_mtime
                except OSError:
                    return 0.0

            df = None
            parquet_m = _safe_mtime(parquet_path)
            pkl_m = _safe_mtime(pkl_path)

            # Prefer parquet if it's not older than CSV
            if parquet_path.exists() and parquet_m >= csv_mtime:
                try:
                    df = pd.read_parquet(parquet_path)
                    print(f"Loaded metadata for {self.dataset_name} from parquet cache: {parquet_path}")
                except Exception as e:
                    warnings.warn(f"Failed to read parquet cache {parquet_path}: {e}")

            # Then try pickle if parquet not used
            if df is None and pkl_path.exists() and pkl_m >= csv_mtime:
                try:
                    df = pd.read_pickle(pkl_path)
                    print(f"Loaded metadata for {self.dataset_name} from pickle cache: {pkl_path}")
                except Exception as e:
                    warnings.warn(f"Failed to read pickle cache {pkl_path}: {e}")

            # Fallback to CSV (or cache is stale)
            if df is None:
                df = _load_from_csv()

                # Build caches asynchronously (atomic replace) so next startup is faster
                def _write_caches_atomic(df_local):
                    # Parquet: create temp file in same directory as target so os.replace
                    # (which uses rename) works atomically even across filesystems.
                    try:
                        tf = tempfile.NamedTemporaryFile(dir=parquet_path.parent, prefix=parquet_path.name + '.tmp', delete=False)
                        tmp_path = Path(tf.name)
                        tf.close()
                        try:
                            df_local.to_parquet(tmp_path, index=False)
                            os.replace(str(tmp_path), str(parquet_path))
                            print(f"Atomically wrote parquet cache for {self.dataset_name} to {parquet_path}")
                        finally:
                            if tmp_path.exists():
                                try:
                                    tmp_path.unlink()
                                except Exception:
                                    pass
                    except Exception as e:
                        warnings.warn(f"Failed to write parquet cache {parquet_path}: {e}")

                    # Pickle: same pattern
                    try:
                        tf = tempfile.NamedTemporaryFile(dir=pkl_path.parent, prefix=pkl_path.name + '.tmp', delete=False)
                        tmp_path = Path(tf.name)
                        tf.close()
                        try:
                            df_local.to_pickle(tmp_path)
                            os.replace(str(tmp_path), str(pkl_path))
                            print(f"Atomically wrote pickle cache for {self.dataset_name} to {pkl_path}")
                        finally:
                            if tmp_path.exists():
                                try:
                                    tmp_path.unlink()
                                except Exception:
                                    pass
                    except Exception as e:
                        warnings.warn(f"Failed to write pickle cache {pkl_path}: {e}")

                threading.Thread(target=_write_caches_atomic, args=(df.copy(),), daemon=True).start()

            # assign
            self.df = df

        except FileNotFoundError as e:
            raise ValueError(f"Metadata file not found for dataset {self.dataset_name}: {e}")

        # Rename + reorder
        self.df.rename(columns=self.column_mapping, inplace=True)
        self.df = self.df[list(self.column_mapping.values())]

        # Reset record_id to count from 0
        self.df.reset_index(drop=True, inplace=True)   # drop old record_id
        self.df.index.name = "record_id"               # set new index name

        # --- Build mappings efficiently ---
        # Image ID <-> Record ID
        id_df = self.df[["image_id"]].reset_index()  # keep record_id from index
        self.image_id_to_record_id = id_df.set_index("image_id")["record_id"].to_dict()
        self.record_id_to_image_id = id_df.set_index("record_id")["image_id"].to_dict()
        print(f"First image_id: {list(self.image_id_to_record_id.keys())[0]}")
        print(f"First record_id: {list(self.record_id_to_image_id.keys())[0]}")
        print(f"Image ID <-> Record ID mappings created in {time.time() - start_time:.2f} seconds")
        print()

        # --- Unifying category subset ---
        self.unify_df = self.df[[self.unifying_category]].reset_index()
            

    
    @abstractmethod
    def get_dataset_name(self):
        pass      

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
        if self.dataset_name.startswith("aic25"):
            image_id = image_id[4:]
        return image_id
    
    def get_unifying_category_ids(self, record_ids):    
        temp_df = pd.DataFrame({"record_id": record_ids})
        result = temp_df.merge(self.unify_df, on="record_id", how="left") 
        return result[self.unifying_category].tolist()

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



class LSC24Dataset(ImageDataset):
    def get_dataset_name(self):
        return "lsc24"

class AIC25Dataset(ImageDataset):
    def get_dataset_name(self):
        return "aic25"

class AIC25LessonDataset(ImageDataset):
    def get_dataset_name(self):
        return "aic25_lesson"

class AIC25CookingDataset(ImageDataset):
    def get_dataset_name(self):
        return "aic25_cooking"

class V3CDataset(ImageDataset):
    def get_dataset_name(self):
        return "vbs25_v3c"

class MVKDataset(ImageDataset):
    def get_dataset_name(self):
        return "vbs25_mvk"

class LHEDataset(ImageDataset):
    def get_dataset_name(self):
        return "vbs25_lhe"
