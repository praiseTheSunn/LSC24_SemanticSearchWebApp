from pymilvus import connections, utility, MilvusException
connections.connect(host="localhost", port="19530")
try:
    collections = utility.list_collections()
    print("List of collections: ", collections)
except MilvusException as e:
    print(e)



from pymilvus import MilvusClient, DataType
CLUSTER_ENDPOINT = "http://localhost:19530"
TOKEN = "root:Milvus"
client = MilvusClient(uri=CLUSTER_ENDPOINT, token=TOKEN)

data = [
    {
        "embedding": [1/768 * i for i in range(768)],
        "path": "abc/xyz",
        "objects": "car, trees, playground",
        "location_categories": "park",
        "date": "20190901",
        "time": "7920"
    }, {
        "embedding": [1/768 * i for i in range(768)],
        "path": "abc/xyz",
        "objects": "car, trees, playground",
        "location_categories": "park",
        "date": "20190902",
        "time": "7920"
    }, {
        "embedding": [1/768 * i for i in range(768)],
        "path": "abc/xyz",
        "objects": "car, trees, playground",
        "location_categories": "park",
        "date": "20190903",
        "time": "7920"
    }, {
        "embedding": [1/768 * i for i in range(768)],
        "path": "abc/xyz",
        "objects": "car, trees, playground",
        "location_categories": "park",
        "date": "20190904",
        "time": "7920"
    }, {
        "embedding": [1/768 * i for i in range(768)],
        "path": "abc/xyz",
        "objects": "car, trees, playground",
        "location_categories": "park",
        "date": "20190905",
        "time": ""
        # "time": "7920"
    }
]

res = client.insert(collection_name="aic24_clip_b32", data=data)
print(res)