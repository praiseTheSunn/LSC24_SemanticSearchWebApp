import sqlite3
from typing import Any, Dict, List
import sys
sys.path.append("..")
from db.setup import db_path


def search_metadata(db_name: str, table_name: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Searches for metadata records in the specified table based on filters."""
    print(db_path[db_name])
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
        return []

    connection = sqlite3.connect(db_path[db_name])
    cursor = connection.cursor()

    # Create a temporary table to contain the list of keyframe IDs
    cursor.execute("""
        CREATE TEMPORARY TABLE IF NOT EXISTS tmp_ids (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            keyframe_id INTEGER
        );
    """)

    # Insert values into the temporary table
    insert_query = "INSERT INTO tmp_ids (keyframe_id) VALUES " + ", ".join(["(?)"] * len(id_list))
    cursor.execute(insert_query, id_list)

    # Fetch records by joining the temporary table with the main table
    if db_name == "vbs25_mvk":
        query = f"""
            SELECT
                m.id,
                m.name,
                m.timestamp,
                d.fish_list,
                tmp.id as order_id
            FROM tmp_ids AS tmp
            INNER JOIN {table_name} AS m ON tmp.keyframe_id = m.id
            LEFT JOIN object_detect AS d ON tmp.keyframe_id = d.id
            ORDER BY tmp.id ASC;
        """
    elif db_name == "vbs25_lhe":
        query = f"""
            SELECT
                m.id,
                m.name,
                m.timestamp,
                d.object_tags,
                tmp.id as order_id
            FROM tmp_ids AS tmp
            INNER JOIN {table_name} AS m ON tmp.keyframe_id = m.id
            LEFT JOIN lhe_detect AS d ON tmp.keyframe_id = d.id
            ORDER BY tmp.id ASC;
        """
    elif db_name == "vbs25_v3c":
        query = f"""
            SELECT
                m.id,
                m.name,
                m.timestamp,
                tmp.id as order_id
            FROM tmp_ids AS tmp
            INNER JOIN {table_name} AS m
            ON tmp.keyframe_id = m.id
            ORDER BY tmp.id ASC;
        """
    elif db_name == "lsc":
        query = f"""
            SELECT
                m.id,
                m.name,
                tmp.id as order_id
            FROM tmp_ids AS tmp
            INNER JOIN {table_name} AS m
            ON tmp.keyframe_id = m.id
            ORDER BY tmp.id ASC;
        """

    # Execute the query
    cursor.execute(query)
    rows = cursor.fetchall()

    # Retrieve column names
    column_names = [column[0] for column in cursor.description]

    # Close the connection
    connection.close()

    # Convert rows to a list of dictionaries
    return [dict(zip(column_names, row)) for row in rows]


def search_video_ids_by_ids(db_name: str, table_name: str, id_list: List[int]) -> List[int]:
    """
    Searches for video IDs in the specified table where the column `id` falls within a list of values.
    """
    if not id_list:
        return []  # Return an empty list if no IDs are provided

    connection = sqlite3.connect(db_path[db_name])
    cursor = connection.cursor()

    # Create a temporary table to contain the list of keyframe IDs
    cursor.execute("""
        CREATE TEMPORARY TABLE IF NOT EXISTS tmp_ids (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            keyframe_id INTEGER
        );
    """)

    # Insert values into the temporary table
    insert_query = "INSERT INTO tmp_ids (keyframe_id) VALUES " + ", ".join(["(?)"] * len(id_list))
    cursor.execute(insert_query, id_list)

    # Fetch records by joining the temporary table with the main table
    query = f"""
        SELECT
            m.video_id
        FROM tmp_ids AS tmp
        INNER JOIN {table_name} AS m
        ON tmp.keyframe_id = m.id
        ORDER BY tmp.id ASC;
    """

    # Execute the query
    cursor.execute(query)
    rows = cursor.fetchall()

    # Close the connection
    connection.close()

    # Convert rows to a list of integers
    return [row[0] for row in rows]


if __name__ == "__main__":
    table_name = "object_detect"
    filters = {
        "id": 47753,
    }

    results = search_metadata("vbs25_mvk", table_name, filters)
    # for result in results:
        # if isinstance(result["video_id"], bytes):
        #     result["video_id"] = int.from_bytes(result["video_id"], byteorder="little")
    
    print(results)