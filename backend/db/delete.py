import sqlite3


def delete_metadata(db_name: str, table_name: str, record_id: int):
    """Deletes a metadata record by its ID from the specified table."""
    connection = sqlite3.connect(db_name)
    cursor = connection.cursor()

    cursor.execute(f'''
        DELETE FROM {table_name} WHERE id > ?
    ''', (record_id,))

    # Get the number of rows deleted
    deleted_count = cursor.rowcount

    connection.commit()
    connection.close()
    
    return deleted_count



if __name__ == "__main__":
    deleted_rows = delete_metadata("V3C.db", "keyframes", 720000)
    print(f"Number of records deleted: {deleted_rows}")