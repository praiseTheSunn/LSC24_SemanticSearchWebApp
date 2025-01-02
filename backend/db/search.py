import sqlite3
from typing import Any, Dict, List


V3C_CONNECTION = sqlite3.connect("V3C.db")


def search_metadata(connection: sqlite3.Connection, table_name: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Searches for metadata records in the specified table based on filters."""
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


if __name__ == "__main__":
    table_name = "keyframes"
    filters = {
        "id": 720000,
    }

    results = search_metadata(V3C_CONNECTION, table_name, filters)
    for result in results:
        if isinstance(result["video_id"], bytes):
            result["video_id"] = int.from_bytes(result["video_id"], byteorder="little")
    
    print(results)