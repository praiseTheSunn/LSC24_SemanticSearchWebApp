from whoosh.index import open_dir
from whoosh.qparser import QueryParser
from whoosh.qparser.plugins import FuzzyTermPlugin
import settings
import pandas as pd

def fuzzy_search_frame(list_keyframe, query_text, limit=None):
    list_image = [str(keyframe)[-23:] for keyframe in list_keyframe]
    
    # Mở chỉ mục từ file
    index_dir = settings.fuzzy_index_path  # Đường dẫn đến thư mục chứa chỉ mục Whoosh, có trên onedrive
    ix = open_dir(index_dir)

    # Tạo một đối tượng Searcher từ chỉ mục đã mở
    searcher = ix.searcher()

    # Tạo trình phân tích truy vấn với FuzzyTermPlugin
    analyzer = FuzzyTermPlugin()    

    # Tạo trình phân tích truy vấn với FuzzyTermPlugin
    qp = QueryParser("place", schema=ix.schema)
    qp.add_plugin(FuzzyTermPlugin())

    # Tạo truy vấn với từ khoá fuzzy
    query = qp.parse(query_text)

    # Thực hiện truy vấn và lấy kết quả 
    results = searcher.search(query, limit=limit)

    # Chuyển đổi danh sách ảnh thành tập hợp các ImageID
    image_set = set(list_image)

    # Tạo một bảng hash map từ list_image để lưu thứ tự của từng ảnh
    image_order = {image: order for order, image in enumerate(list_image)}

    # Thực hiện truy vấn và lấy kết quả từ danh sách ảnh
    matching_keyframes = []
    for hit in results:
        if hit['ImageID'] in image_set:
            matching_keyframes.append(list_keyframe[image_order[hit['ImageID']]])

    # Sắp xếp kết quả theo thứ tự của list_keyframe
    matching_keyframes.sort(key=lambda x: list_keyframe.index(x))
    
    return matching_keyframes

# list_keyframe = ['E:\\LSCDATA\\keyframes\\201910\\05\\20191005_143152_000.jpg',
#                  'E:\\LSCDATA\\keyframes\\202006\\30\\20200630_205101_000.jpg',
#                  'E:\\LSCDATA\\keyframes\\201910\\05\\20191005_143239_000.jpg', 
#                  'E:\\LSCDATA\\keyframes\\201910\\05\\20191005_143135_000.jpg',
#                  'E:\\LSCDATA\\keyframes\\202006\\30\\20200630_212152_000.jpg', 
#                  'E:\\LSCDATA\\keyframes\\202006\\30\\20200630_212152_000.jpg']
# query_text = 'Bangkok'
# print(fuzzy_search_frame(list_keyframe, query_text))
