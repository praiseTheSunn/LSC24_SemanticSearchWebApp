from dataset.image_dataset import ImageDataset, LSC24Dataset, V3CDataset, MVKDataset, LHEDataset
from database.db_manager import ImageDatabaseManager

available_datasets = ["lsc24", "v3c", "mvk", "lhe"]

class DatasetManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatasetManager, cls).__new__(cls)
            cls._instance._datasets = {}  # Instance-level cache
        return cls._instance

    @classmethod
    def get_dataset(cls, dataset_name):
        """Returns a dataset instance based on type (Singleton-based)."""
        instance = cls()
        if dataset_name not in available_datasets:
            raise ValueError(f"Unknown dataset: {dataset_name}")
        if dataset_name not in instance._datasets:
            if dataset_name == "lsc24":
                instance._datasets[dataset_type] = LSC24Dataset()
            elif dataset_name == "v3c":
                instance._datasets[dataset_type] = V3CDataset()
            elif dataset_name == "mvk":
                instance._datasets[dataset_type] = MVKDataset()
            elif dataset_name == "lhe":
                instance._datasets[dataset_type] = LHEDataset()
            else:
                raise ValueError(f"Dataset not implemented: {dataset_type}")
        return instance._datasets[dataset_type]

    @classmethod
    def close_all(cls):
        """Closes all dataset connections."""
        instance = cls()
        for dataset in instance._datasets.values():
            dataset.close()
        instance._datasets.clear()
