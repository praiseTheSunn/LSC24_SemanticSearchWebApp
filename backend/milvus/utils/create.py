# # Pymilvus 2.4.0

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

# 2. Create schema
schema = MilvusClient.create_schema(auto_id=False, enable_dynamic_field=True)
# schema.add_field(field_name="id", datatype=DataType.INT64, is_primary=True, auto_id=True)
# schema.add_field(field_name="objects", datatype=DataType.VARCHAR, max_length=100)
# schema.add_field(field_name="location_categories", datatype=DataType.VARCHAR, max_length=100)
# schema.add_field(field_name="date", datatype=DataType.VARCHAR, max_length=8)
# schema.add_field(field_name="time", datatype=DataType.VARCHAR, max_length=8)
schema.add_field(field_name="url", datatype=DataType.VARCHAR, max_length=100, is_primary=True)
schema.add_field(field_name="embedding", datatype=DataType.FLOAT_VECTOR, dim=768)

# 3. Prepare the index parameters, add an index on the vector field.
index_params = MilvusClient.prepare_index_params()
index_params.add_index(
    metric_type="IP",               # COSINE, L2, IP
    field_name="embedding",
    index_type="HNSW",              # FLAT, IVF_FLAT, IVF_SQ8, IVF_PQ, HNSW, SCANN
    index_name="embedding_index",
    M=16,                           # number of clusters
    efConstruction=100,             # number of efConstruction
)

# 4. Create collection
client.create_collection(collection_name="lsc24_blip2", schema=schema, index_params=index_params)
# client.create_collection(collection_name="lsc24_clip", schema=schema, index_params=index_params)

# 5. Describe the collection
res = client.describe_index(collection_name="lsc24_blip2", index_name="embedding_index")
# res = client.describe_index(collection_name="lsc24_clip", index_name="embedding_index")
print(res)

collections = utility.list_collections()
print("List of collections: ", collections)