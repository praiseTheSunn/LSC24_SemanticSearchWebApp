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

def calculate_r_at_n(predictions, true_labels, n):
    print('calculating: ', predictions[:n], true_labels, n)

    correct_count = 0

    for true_label in true_labels:
        if true_label in predictions[:n]:
            correct_count += 1

    print(correct_count, len(predictions))

    if (len(predictions) == 0):
        return 0
    r_at_n = correct_count / len(predictions)
    return r_at_n