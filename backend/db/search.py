import sqlite3
from typing import Any, Dict, List
from db.setup import db_path


def search_metadata(db_name: str, table_name: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Searches for metadata records in the specified table based on filters."""
    connection = sqlite3.connect(db_path[db_name])
    cursor = connection.cursor()

    query = f"SELECT * FROM {table_name} WHERE 1=1"
    params = {}

    for key, value in filters.items():
        query += f" AND {key} = :{key}"
        params[key] = value

    cursor.execute(query, params)
    rows = cursor.fetchall()

    connection.close()

    # Convert rows to a list of dictionaries
    return [
        {key: row[idx] for idx, key in enumerate([column[0] for column in cursor.description])}
        for row in rows
    ]


def search_metadata_by_ids(db_name: str, table_name: str, id_list: List[int]) -> List[Dict[str, Any]]:
    """
    Searches for metadata records in the specified table where the column `id` falls within a list of values.
    """
    if not id_list:
        return []  # Return an empty list if no IDs are provided

    connection = sqlite3.connect(db_path[db_name])
    cursor = connection.cursor()

    # Construct the query with placeholders for IDs
    placeholders = ', '.join(['?'] * len(id_list))
    order_by_case = ' '.join([f"WHEN id = ? THEN {i}" for i in range(len(id_list))])
    query = f"""
        SELECT * FROM {table_name} 
        WHERE id IN ({placeholders})
        ORDER BY CASE {order_by_case} END
    """

    # Execute the query with the list of IDs
    cursor.execute(query, id_list + id_list)
    rows = cursor.fetchall()

    # Retrieve column names
    column_names = [column[0] for column in cursor.description]

    # Close the connection
    connection.close()

    # Convert rows to a list of dictionaries
    return [dict(zip(column_names, row)) for row in rows]


if __name__ == "__main__":
    table_name = "keyframes"
    filters = {
        "id": 720000,
    }

    results = search_metadata("v3c", table_name, filters)
    for result in results:
        if isinstance(result["video_id"], bytes):
            result["video_id"] = int.from_bytes(result["video_id"], byteorder="little")
    
    print(results)