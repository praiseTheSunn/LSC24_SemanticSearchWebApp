import requests

def search_in_remote(text_query: str, model_name, mode):
    # return clip.calc_text_embedding(text_query)
    base_url = "http://34.124.236.208:8001"
    endpoint_url = f"{base_url}/search/search_with_text_query"

    try:
        data = {
            "text_query": text_query,
            "model": model_name,
            "mode": mode,
        }
        headers = {
            'Content-Type': 'application/json',
        }
        # print("Sending request to:", endpoint_url)
        response = requests.post(endpoint_url, json = data, headers = headers)
        # print("Received response")
        
        if response.status_code == 200:
            response_json = response.json()
            # print(response_json)
            # embeddings = np.array(response_json["text_embedding"])
            # print("Received text embedding shape:", text_embedding.shape)
            return response_json['urls']
        else:
            print("Failed to get text embedding. Status code:", response.status_code)
            return response.status_code

    except requests.exceptions.RequestException as e:
        print("Error:", e)
        return None

def load_tests(file_path):

    # Open the file in read mode
    with open(file_path, 'r', encoding='utf-8') as file:
        # Read each line from the file
        test = {}
        cur_test = None
        for line in file:
            # Print the line to the screen
            line = line.strip()
            if (line == ""):
                continue
            
            if line.startswith('LSC-') and line[4:].isdigit():
                # Extract the XXX part of the line
                xxx = line[4:]
                # Check if XXX is between '000' and '999'
                if '000' <= xxx <= '999':
                    # if (len(test) != 0):
                    #     print(test)
                    test[line] = {}
                    cur_test = line
                    test[cur_test]['query_text'] = []
                    test[cur_test]['expected_result'] = []
            
            if (line != cur_test):
                if (line[0].isdigit()):
                    test[cur_test]['expected_result'].append(line)
                else:
                    test[cur_test]['query_text'].append(line)
            # print(line)
    return test

def load_tests_lsc23(file_path):

    # Open the file in read mode
    with open(file_path, 'r', encoding='utf-8') as file:
        # Read each line from the file
        test = {}
        cur_test = None
        for line in file:
            # Print the line to the screen
            line = line.strip()
            if (line == ""):
                continue
            
            if line.startswith('LSC23-KIS'):
                print(line)
                # Extract the XXX part of the line
                xxx = line[-2:]
                print(xxx)
                # Check if XXX is between '000' and '999'
                if '00' <= xxx <= '99':
                    # if (len(test) != 0):
                    #     print(test)
                    test[line] = {}
                    cur_test = line
                    test[cur_test]['query_text'] = []
                    test[cur_test]['expected_result'] = []
            
            if (line != cur_test):
                if (line[0].isdigit()):
                    test[cur_test]['expected_result'].append(line)
                else:
                    test[cur_test]['query_text'].append(line)
            # print(line)
    return test


def load_tests_ntcir(test_file_ntcir, ntcir_file_answer_path):

    import xml.etree.ElementTree as ET
    import pandas as pd

    # Read the XML file
    tree = ET.parse(test_file_ntcir)
    root = tree.getroot()

    test = {}

    # Access the XML data as needed
    # Example: Print the tag and text of each element
    prev_id = None
    for element in root.iter():
        if (element.tag == 'id'):
                test_id = element.text
                test[test_id] = {}
                test[test_id]['query_text'] = []
                test[test_id]['expected_result'] = []
        if (element.tag == 'description'):
            test[test_id]['query_text'].append(element.text)
    # print(test)


    # Read the CSV file
    df = pd.read_csv(ntcir_file_answer_path)

    # Get values in columns 'query' and 'docid'
    queries = df['query'].tolist()
    docids = df['docid'].tolist()

    for i, query in enumerate(queries):
        test[str(query)]['expected_result'].append(docids[i])

    return test

def calculate_r_at_n(predictions, true_labels, n):
    # print('calculating: ', predictions[:n], true_labels, n)

    correct_count = 0

    for true_label in true_labels:
        for prediction in predictions[:n]:
            if true_label in prediction:
                correct_count += 1

    if (len(predictions) == 0):
        return 0
    r_at_n = correct_count / len(true_labels)
    return r_at_n