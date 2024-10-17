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

# 1. Set up a Milvus client
client = MilvusClient(uri=CLUSTER_ENDPOINT, token=TOKEN)
client.drop_collection(collection_name='lsc24_clip')


collections = utility.list_collections()
print("List of collections: ", collections)