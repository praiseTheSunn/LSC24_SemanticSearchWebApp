import settings
from helper import setup
import numpy as np

def fuzzy_search_frame(image_ids, query_text, searcher, qp, limit=None):

    # Tạo truy vấn với từ khoá fuzzy
    query = qp.parse(query_text)

    # Thực hiện truy vấn và lấy kết quả 
    results = searcher.search(query, limit=limit)

    image_ids_dict = {image_id: setup.all_image_ids_dict[image_id] for image_id in image_ids}

    # Thực hiện truy vấn và lấy kết quả từ danh sách ảnh
    locsem_similarities = []
    locsem_indices = []
    for hit in results:
        image_id = hit['ImageID']
        score = hit.score
        try:
            idx = image_ids_dict[image_id]
            locsem_similarities.append(score)
            locsem_indices.append(idx)
        except:
            pass

    return np.array(locsem_indices), np.array(locsem_similarities)

    # # Sắp xếp kết quả theo thứ tự của list_keyframe
    # if len(matched_image_ids) == 0:
    #     return []
    # matches = zip(matched_image_ids, matched_image_orders)
    # matches = sorted(matches, key=lambda x: x[1])
    
    # return matches[0]

# list_keyframe = ['E:\\LSCDATA\\keyframes\\201910\\05\\20191005_143152_000.jpg',
#                  'E:\\LSCDATA\\keyframes\\202006\\30\\20200630_205101_000.jpg',
#                  'E:\\LSCDATA\\keyframes\\201910\\05\\20191005_143239_000.jpg', 
#                  'E:\\LSCDATA\\keyframes\\201910\\05\\20191005_143135_000.jpg',
#                  'E:\\LSCDATA\\keyframes\\202006\\30\\20200630_212152_000.jpg', 
#                  'E:\\LSCDATA\\keyframes\\202006\\30\\20200630_212152_000.jpg']
# query_text = 'Bangkok'
# print(fuzzy_search_frame(list_keyframe, query_text))
