from nltk import word_tokenize
from multiprocessing import Pool


# Load stopwords and punctuation set
with open(f'stopwords.txt', 'r', encoding='utf-8') as file:
    stopwords = file.read().split("\n")
    stopwords = set(stopwords)
puct_set = set([c for c in '!"#$%&\'()*+,./:;<=>?@[\\]^`{|}~'])


# Generate bigram for a paper
def generateBigram(paper):
    words = paper.split()
    if len(words) == 1:
        return ''
    bigrams = [words[i] + '_' + words[i+1] for i in range(0, len(words) - 1)]
    return ' '.join(bigrams)


# Remove redundant words
def removeRedundant(text, redundantSet):
    words = text.split()
    for i in range(0, len(words)):
        if words[i].count('_') == 0 and (words[i] in redundantSet or words[i].isdigit()):
            words[i] = ''
        else:
            sub_words = words[i].split('_')
            if any(w in redundantSet or w.isdigit() for w in sub_words):
                words[i] = ''
    words = [w for w in words if w != '']
    words = ' '.join(words)
    return words


# Preprocessing
def preprocessing(text):
    text = ' '.join(word_tokenize(text))
    text = text.lower()
    text = ' '.join(text.split())
    text = text + ' ' + generateBigram(text)
    text = removeRedundant(text,puct_set | stopwords)
    return text


# pool = Pool(10)
# cleaned_documents = pool.map(preprocessing, documents)
# pool.terminate()


