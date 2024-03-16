import settings
import pandas as pd

def fuzzy_search_frame(paths, query_text, ix, searcher, qp, limit=None):
    image_ids = [str(path)[-23:] for path in paths]  

    # Tạo truy vấn với từ khoá fuzzy
    query = qp.parse(query_text)

    # Thực hiện truy vấn và lấy kết quả 
    results = searcher.search(query, limit=limit)
    print(len(results))

    

    # Tạo một bảng hash map từ list_image để lưu thứ tự của từng ảnh
    image_ids_dict = {path[-23:]: order for order, path in enumerate(paths)}

    # # Chuyển đổi danh sách ảnh thành tập hợp các ImageID
    # image_ids_set = set(image_ids_dict)

    # Thực hiện truy vấn và lấy kết quả từ danh sách ảnh
    matched_image_ids = []
    matched_image_orders = []
    for hit in results:
        image_id = hit['ImageID']
        if image_id in image_ids_dict:
            ord = image_ids_dict[image_id]
            matched_image_ids.append(image_ids[ord])
            matched_image_orders.append(ord)

    # Sắp xếp kết quả theo thứ tự của list_keyframe
    matches = zip(matched_image_ids, matched_image_orders)
    matches = sorted(matches, key=lambda x: x[1])
    
    return matches[0]

# list_keyframe = ['E:\\LSCDATA\\keyframes\\201910\\05\\20191005_143152_000.jpg',
#                  'E:\\LSCDATA\\keyframes\\202006\\30\\20200630_205101_000.jpg',
#                  'E:\\LSCDATA\\keyframes\\201910\\05\\20191005_143239_000.jpg', 
#                  'E:\\LSCDATA\\keyframes\\201910\\05\\20191005_143135_000.jpg',
#                  'E:\\LSCDATA\\keyframes\\202006\\30\\20200630_212152_000.jpg', 
#                  'E:\\LSCDATA\\keyframes\\202006\\30\\20200630_212152_000.jpg']
# query_text = 'Bangkok'
# print(fuzzy_search_frame(list_keyframe, query_text))
