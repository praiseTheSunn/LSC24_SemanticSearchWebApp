import sqlite3
import argparse


def initialize_database(db_name: str, table_name: str, schema: str):
    """Creates a database and a specified table with the given schema if they don't exist."""
    connection = sqlite3.connect(db_name)
    cursor = connection.cursor()

    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS {table_name} (
            {schema}
        )
    ''')

    connection.commit()
    connection.close()


def check_table_exists(db_name: str, table_name: str) -> bool:
    """Checks if a table exists in the database."""
    connection = sqlite3.connect(db_name)
    cursor = connection.cursor()

    cursor.execute(f'''
        SELECT name FROM sqlite_master WHERE type='table' AND name=?
    ''', (table_name,))
    result = cursor.fetchone()

    connection.close()

    return result is not None


def get_table_schema(db_name: str, table_name: str) -> str:
    """Returns the schema of a table in the database."""
    connection = sqlite3.connect(db_name)
    cursor = connection.cursor()

    cursor.execute(f'''
        PRAGMA table_info({table_name})
    ''')
    rows = cursor.fetchall()

    connection.close()

    return ', '.join(f"{row[1]} {row[2]}" for row in rows)


if __name__ == "__main__":    
    parser = argparse.ArgumentParser()
    parser.add_argument("-t", "--table_name", type=str, required=True, help="Name of the table to init")
    args = parser.parse_args()
    
    db_name = "lsc.db"              # MVK.db, V3C.db
    table_name = args.table_name
    schema = ""

    if table_name == "videos":
        schema = """
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            dataset TEXT NOT NULL
        """
    elif table_name == "contexts":
        schema = """
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            video_id INTEGER NOT NULL
        """
    # elif table_name == "keyframes":
    #     schema = """
    #         id INTEGER PRIMARY KEY,
    #         name TEXT NOT NULL,
    #         timestamp INTEGER NOT NULL,
    #         context_id INTEGER NOT NULL,
    #         video_id INTEGER NOT NULL
    #     """    
    elif table_name == "keyframes":
        schema = """
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        """    

    initialize_database(db_name, table_name, schema)
    print(check_table_exists(db_name, table_name))
    print(get_table_schema(db_name, table_name))




    # db_name = "V3C.db"
    # table_name = "videos"
    # schema = """
    #     id INTEGER PRIMARY KEY AUTOINCREMENT,
    #     name TEXT NOT NULL,
    #     dataset TEXT NOT NULL
    # """

    # db_name = "V3C.db"
    # table_name = "contexts"
    # schema = """
    #     id INTEGER PRIMARY KEY AUTOINCREMENT,
    #     name TEXT NOT NULL,
    #     video_id INTEGER NOT NULL
    # """

    # db_name = "V3C.db"
    # table_name = "keyframes"
    # schema = """
    #     id INTEGER PRIMARY KEY AUTOINCREMENT,
    #     name TEXT NOT NULL,
    #     timestamp INTEGER NOT NULL,
    #     context_id INTEGER NOT NULL,
    #     video_id INTEGER NOT NULL
    # """