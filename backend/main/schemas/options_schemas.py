from enum import Enum

class ModelOptions(str, Enum):
    option1 = "clips"
    option2 = "appleclip"

class ModeOptions(str, Enum):
    option1 = "vec"
    option2 = "vec_kw"
    option3 = "kw"

class DatasetOptions(str, Enum):
    option1 = "vbs25"
    option2 = "aic24"
    option3 = "aic24_lesson"
    option4 = "aic24_cooking"