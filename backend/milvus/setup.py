from pymilvus import connections, utility, MilvusException, Collection
connections.connect(host="localhost", port="19530")

try:
    collection_names = utility.list_collections()
    print("List of collections: ", collection_names)
    for collection_name in collection_names:
        
        collection = Collection(collection_name)
        print(collection_name, collection.num_entities)

except MilvusException as e:
    print(e)

from pymilvus import MilvusClient, DataType
CLUSTER_ENDPOINT = "http://localhost:19530"
TOKEN = "root:Milvus"
milvus_client = MilvusClient(uri=CLUSTER_ENDPOINT, token=TOKEN)