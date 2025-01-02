import sqlite3
import argparse


def drop_table(db_name: str, table_name: str):
    """Drops a table from the database."""
    connection = sqlite3.connect(db_name)
    cursor = connection.cursor()

    cursor.execute(f'''
        DROP TABLE IF EXISTS {table_name}
    ''')

    connection.commit()
    connection.close()


if __name__ == "__main__":
    args = argparse.ArgumentParser()
    args.add_argument("-t", "--table_name", type=str, required=True, help="Name of the table to drop")
    args = args.parse_args()

    db_name = "V3C.db"
    table_name = args.table_name

    drop_table(db_name, table_name)
