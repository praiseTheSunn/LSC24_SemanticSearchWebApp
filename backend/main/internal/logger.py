import time
import json


def save_query_log(category: str, type_value: dict[str, str]):
    timestamp = time.time()
    timestamp = int(timestamp * 1000)
    output =  {
        "timestamp": timestamp,
        "events": []
    }
    for key, value in type_value.items():
        output["events"].append({
            "timestamp": timestamp,
            "category": "TEXT",
            "type": key,
            "value": value
        })
    # save to json file
    json.dump(output, open(f"{timestamp}.json", "w"))
    

def save_result_log(category: str, type_value: dict[str, str]):
    timestamp = time.time()
    timestamp = int(timestamp * 1000)
    output =  {
        "timestamp": timestamp,
        "events": []
    }
    for key, value in type_value.items():
        output["events"].append({
            "timestamp": timestamp,
            "category": "TEXT",
            "type": key,
            "value": value
        })
    # save to json file
    json.dump(output, open(f"{timestamp}.json", "w"))


{
  "timestamp": 0,
  "events": [
    {
      "timestamp": 0,
      "category": "TEXT",
      "type": "string",
      "value": "string"
    }
  ]
}


{
  "timestamp": 0,
  "sortType": "string",
  "resultSetAvailability": "string",
  "results": [
    {
      "answer": {
        "text": "string",
        "mediaItemName": "string",
        "mediaItemCollectionName": "string",
        "start": 0,
        "end": 0
      },
      "rank": 0
    }
  ],
  "events": [
    {
      "timestamp": 0,
      "category": "TEXT",
      "type": "string",
      "value": "string"
    }
  ]
}