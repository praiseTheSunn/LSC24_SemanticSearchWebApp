from enum import Enum

class ModelOptions(str, Enum):
    option1 = "clip"
    option2 = "blip2"
    option3 = "beit3"

class ModeOptions(str, Enum):
    option1 = "vec"
    option2 = "vec_kw"
    option3 = "kw"

class DatasetOptions(str, Enum):
    option1 = "aic24"
    option2 = "aic24_lesson"
    option3 = "aic24_cooking"
    option4 = "lsc24"