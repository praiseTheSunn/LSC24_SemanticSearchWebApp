from enum import Enum

class ModelOptions(str, Enum):
    option1 = "clip"
    option2 = "blip2"
    option3 = "beit3"
    option4 = "stfm"

class ModeOptions(str, Enum):
    option1 = "smt"
    option2 = "smt-mm-dtin"
    option3 = "smt-3m-dtin"