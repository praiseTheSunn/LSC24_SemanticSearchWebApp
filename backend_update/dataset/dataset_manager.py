from typing import Dict, Type

class DatasetManager:
    _instance = None
    _datasets: Dict[str, object] = {}      # name → *singleton instance*

    # ---------- ① singleton boilerplate ----------
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    # ---------- registry API ----------
    @classmethod
    def register(cls, name: str, dataset_cls: Type):
        """
        Register a dataset *and* create its singleton instance right away.
        """
        if name in cls._datasets:
            raise KeyError(f"Dataset '{name}' already registered")

        instance = dataset_cls()            # <-- eager instantiation
        cls._datasets[name] = instance
        return instance                     # handy if caller wants the handle

    @classmethod
    def get_dataset(cls, name: str):
        """
        Retrieve the (already-created) singleton instance.
        """
        try:
            return cls._datasets[name]
        except KeyError:
            raise ValueError(f"Unknown or unregistered dataset: {name}")

    @classmethod
    def close_all(cls):
        for ds in cls._datasets.values():
            if hasattr(ds, "close"):
                ds.close()
        cls._datasets.clear()


# ------------------------- REGISTER DATASETS -------------------------
from dataset.image_dataset import LSC24Dataset, AIC25Dataset, AIC25LessonDataset, AIC25CookingDataset, V3CDataset, MVKDataset, LHEDataset
available_datasets = ["lsc24", "aic25", "vbs25_v3c", "vbs25_mvk", "vbs25_lhe"]

print("Initializing dataset manager...")
DatasetManager.register("lsc24", LSC24Dataset)
# DatasetManager.register("aic25", AIC25Dataset)
# DatasetManager.register("aic25_lesson", AIC25LessonDataset)
# DatasetManager.register("aic25_cooking", AIC25CookingDataset)
# DatasetManager.register("vbs25_v3c", V3CDataset)
# DatasetManager.register("vbs25_mvk", MVKDataset)
# DatasetManager.register("vbs25_lhe", LHEDataset)

print("Initialized dataset manager successfully.\n")
