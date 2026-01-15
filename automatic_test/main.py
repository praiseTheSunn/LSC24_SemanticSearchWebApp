import requests
import pandas as pd
from pprint import pprint

API_TEXT_SEARCH = "http://localhost:20721/search/search_with_text_query"

text_queries = {
    "LSC22-109": "I think it was the second time I visited the house with the stone shed / hovel.  The shed was under green trees on a beautiful sunny day. It takes 2 hours to drive there and two hours to drive back home. It was in the middle of  Ireland on the 29th April 2020.",
    "LSC22-114": "Greek wine on a Sunday. I was in a Greek restaurant drinking a small bottle of wine and eating Greek food (chips and meat) with a salad. I was sitting at a white tiled table. It was in Thessaloniki in Greece in January 2019.",
    "LSC22-118": "'Get back' on the roof. I was watching the Beatles rooftop concert on tv (not in music metadata). I was at home watching youtube on TV for about 90 minutes, after doing some computer work at home. It was in April 2019.",
    "LSC22-119": "Zombies on the platform? I was waiting for a train in a station was featured in the movie 'Last Train To Busan'. But there were no zombies, just my friends, one of whom was wearing a blue jacket. I had taken a taxi to Daejeon station in January 2020.",
    "LSC22-120": "Preaching to a full room. My hands were out in front of me, I was speaking to a room of about 200 people seated at dinner tables. It was in Korea in January 2020 at the MMM conference.",
    "LSC23-KIS03": "When did I buy that model train? I remember it was a marklin brand train and I bought it at the weekend. Jer convinced me to buy it when having coffee and I bought it immediately after coffee. It was in June 2019.",
    "LSC23-KIS05": "Having lunch with Dermot, who was a guest speaker at my lecture. After lunch, he gave a lecture to my class about Lessons in Innovation & Entrepreneurship while I was sitting in the front row. It was in November 2019.",
    "LSC23-KIS06": "I remember a man in a blue coat walking a dog in the countryside in Ireland on a sunny afternoon in December on Christmas Day.",
    "LSC23-KIS07": "At a hungry lunchtime, I was eating sandwiches with small tomatoes on top. The tomatoes were held in place with sticks. I think they were chicken sandwiches and there were also small hamburgers. I was eating with someone wearing a stripey sweater who was sitting in front of a large plant (probably a fake one). After eating, we went straight back to meetings in a meeting room.",
    "LSC23-KIS08": "There was a man in the front row with a yellow hat on. I was on a stage in a room with a lot of people  watching. I was on some sort of panel and writing notes on paper. I  remember the man had a blue sweater/top on also. It was in France at ACM MM2019.",
    "LSC24-KIST01": "Eating lunch beside a river with colleagues, with Saigon brand beers. It was after spending a morning in a classroom looking at talks. I got a taxi from the university to lunch. I was in Vietnam. It was May 2019 I think.",
    "LSC24-KIS02": "Japanese pens are the best, so I bought some on that wet evening. I remember it was a very wet evening when I visited the stationary store in a mall. There were lots of colourful pens. Since it was wet outside, I needed to wait in the rain to get a taxi. It was in May 2015 in Bangkok.",
    "LSC24-KIS04": "It was as if the meeting took place on the Starship Enterprise. I remember the wall had yellow lighted shapes and designs, with a yellow lighting on the ceiling. There were 3 or 4 people in the meeting room with me. It was a formal boardroom. Afterwards I got a taxi back to my hotel in Bangkok.",
    "LSC24-KIS05": "There was a problem with my drains at home so I called out an expert. He had a portable machine with a camera and screen. It was yellow I think. We were at the side of the house. The company specialised in drain clearing & CCTV pipeline investigations. He was dressed in yellow or green",
    "LSC24-KIS10": "Find the moment when I was shopping for Ouzo (a Greek alcohol). Afterwards I drank a glass of wine. It was at the duty free shop I think. It was definitely at an airport in Greece, before I took a flight in winter 2019.",
}

activities = {
    "LSC22-109": "walking outdoor",
    "LSC22-114": "drinking",
    "LSC22-118": "watching tv or digital displays",
    "LSC22-119": "taking a train",
    "LSC22-120": "attending a presentation",
    "LSC23-KIS03": "shopping",
    "LSC23-KIS05": "eating",
    "LSC23-KIS06": "wallking outdoor",
    "LSC23-KIS07": "eating",
    "LSC23-KIS08": "attending a presentation",
    "LSC24-KIST01": "eating",
    "LSC24-KIS02": "shopping",
    "LSC24-KIS04": "attending a meeting",
    "LSC24-KIS05": "walking outdoor",
    "LSC24-KIS10": "shopping"
}

def text_search(text_query, dataset="lsc24", model="clips"):
    data = {
        "dataset": dataset,
        "model": model,
        "text_query": text_query,
    }

    response = requests.post(API_TEXT_SEARCH, json=data)
    if response.status_code == 200:
        raw_results = response.json()
        metadata = raw_results["data"]
        return metadata
    else:
        return None
    

def extract_ranked_results(results):
    ranked_results = []
    for result in results:
        image_id = result["image_id"].split("/")[-1]
        ranked_results.append(image_id)
    return ranked_results


def calculate_hit_at_k(image_ids, ranked_list, k):
    hits = 0
    for i in range(k):
        if ranked_list[i] in image_ids:
            hits = 1
    return hits


def calculate_precision_at_k(image_ids, ranked_list, k):
    hits = 0
    for i in range(k):
        if ranked_list[i] in image_ids:
            hits += 1
    print("Precision: ", hits, k)
    return hits / k


def calculate_recall_at_k(image_ids, ranked_list, k):
    hits = 0
    for i in range(k):
        if ranked_list[i] in image_ids:
            hits += 1
    print("Recall: ", hits, len(image_ids))
    return hits / len(image_ids)


def calculate_rank_of_1st_hit(image_ids, ranked_list):
    for i, image_id in enumerate(ranked_list):
        if image_id in image_ids:
            return i + 1
    return 1000  # Return 1000 if no hits are found
    


if __name__ == "__main__":
    df = pd.read_csv("/home/hlmquan/LSC24_SemanticSearchWebApp/backend_update/main/routers/thesis_query.csv")
    groupeds = df.groupby("Question")

    evaluation_results = []
    for query_id, group in groupeds:
        # if query_id != "LSC22-119":
        #     continue

        image_ids = group["Answer"].tolist()
        print(f"Image IDs: {image_ids}")
        
        text_query = text_queries[query_id]
        activity = activities[query_id]
        # search_results = text_search(text_query)
        search_results = text_search(f"{text_query} -a {activity}")
        ranked_list = extract_ranked_results(search_results)

        print(f"Ranked List: {ranked_list[:20]}")

        # for k in [1, 5, 10, 20, 100]:
        #     print(f"k value: {k}")
        #     hit_at_k = calculate_hit_at_k(image_ids, ranked_list, k)
        #     precision_at_k = calculate_precision_at_k(image_ids, ranked_list, k)
        #     recall_at_k = calculate_recall_at_k(image_ids, ranked_list, k)
        #     evaluation_results.append({
        #         "query_id": query_id,
        #         "k": k,
        #         "hit_at_k": hit_at_k,
        #         "precision_at_k": precision_at_k,
        #         "recall_at_k": recall_at_k
        #     })

        evaluation_results.append({
            "query_id": query_id,
            "rank_of_1st_hit": calculate_rank_of_1st_hit(image_ids, ranked_list)
        })

    # Save the evaluation results to a CSV file
    evaluation_df = pd.DataFrame(evaluation_results)
    # evaluation_df.to_csv("eval_reciprocal_no_act.csv", index=False)
    evaluation_df.to_csv("eval_reciprocal_act_0.2.csv", index=False)



