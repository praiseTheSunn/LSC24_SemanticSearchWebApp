import time
import json


def save_log(user_id: str, category: str, log_infos: list[dict[str, str]], results: list[str]):
    timestamp = time.time()
    timestamp = int(timestamp * 1000)
    output =  {
        "timestamp": timestamp,
        "sortType": "rankingModel",
        "resultSetAvailability": "Top1000",
        "events": [],
        "results": []
    }
    for log_info in log_infos:
        for key, value in log_info.items():
            output["events"].append({
                "timestamp": timestamp,
                "category": category,
                "type": key,
                "value": value
            })
    for i, result in enumerate(results):
        output["results"].append({
            "answer": {
                "mediaItemName": result.split("/")[-1].split(".")[0],
            },
            "rank": i + 1
        })
    # save to json file
    json.dump(output, open(f"/home/pc/LSC24_SemanticSearchWebApp/backend/logs/{user_id}_{timestamp}.json", "w"))
    

# def save_result_log(category: str, type_value: dict[str, str]):
#     timestamp = time.time()
#     timestamp = int(timestamp * 1000)
#     output =  {
#         "timestamp": timestamp,
#         "events": []
#     }
#     for key, value in type_value.items():
#         output["events"].append({
#             "timestamp": timestamp,
#             "category": "TEXT",
#             "type": key,
#             "value": value
#         })
#     # save to json file
#     json.dump(output, open(f"{timestamp}.json", "w"))


# {
#   "timestamp": 0,
#   "events": [
#     {
#       "timestamp": 0,
#       "category": "TEXT",
#       "type": "string",
#       "value": "string"
#     }
#   ]
# }


# {
#   "timestamp": 0,
#   "sortType": "string",
#   "resultSetAvailability": "string",
#   "results": [
#     {
#       "answer": {
#         "text": "string",
#         "mediaItemName": "string",
#         "mediaItemCollectionName": "string",
#         "start": 0,
#         "end": 0
#       },
#       "rank": 0
#     }
#   ],
#   "events": [
#     {
#       "timestamp": 0,
#       "category": "TEXT",
#       "type": "string",
#       "value": "string"
#     }
#   ]
# }