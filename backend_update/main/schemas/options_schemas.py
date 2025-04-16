from enum import Enum

class ModelOptions(str, Enum):
    option1 = "clips"
    option2 = "appleclip"

class ModeOptions(str, Enum):
    option1 = "vec"
    option2 = "vec_kw"
    option3 = "kw"

class DatasetOptions(str, Enum):
    option1 = "vbs25_v3c"
    option2 = "vbs25_mvk"
    option3 = "vbs25_lhe"
    option4 = "aic24"
    option5 = "aic24_lesson"
    option6 = "aic24_cooking"
    option7 = "lsc24"