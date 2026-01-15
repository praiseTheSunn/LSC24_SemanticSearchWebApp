import pandas as pd
import yaml

def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)
        
def infer_sqlite_types(csv_path, column_mapping):
    """
    Reads a sample of the CSV file and infers SQL column types.
    
    :param csv_path: Path to the CSV file.
    :param column_mapping: Dictionary mapping CSV columns to DB columns.
    :return: Dictionary of column names with inferred SQL types.
    """
    df = pd.read_csv(csv_path, nrows=10)  # Read a sample
    csv_cols = df.columns.tolist()

    sql_types = {}
    for csv_col in csv_cols:
        dtype = df[csv_col].dtype

        if pd.api.types.is_integer_dtype(dtype):
            sql_type = "INTEGER"
        elif pd.api.types.is_float_dtype(dtype):
            sql_type = "REAL"
        elif pd.api.types.is_bool_dtype(dtype):
            sql_type = "BOOLEAN"
        else:
            sql_type = "TEXT"

        db_col = column_mapping.get(csv_col, csv_col)
        sql_types[db_col] = sql_type

    return sql_types
