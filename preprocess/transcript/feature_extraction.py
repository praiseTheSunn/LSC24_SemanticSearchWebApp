import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD

vectorizer = TfidfVectorizer(token_pattern = "\S+", min_df = 2)


def get_svd_vectors(preprocessed_documents: list[str]):
    vectors = vectorizer.fit_transform(preprocessed_documents)
    print("Tf-idf shape: " + str(vectors.shape))
    svd = TruncatedSVD(n_components=100, n_iter=10, random_state=42)
    svd_vectors = svd.fit_transform(vectors)
    return svd_vectors


def get_ebd_vectors(preprocess_documents: list[str], model):
    ebd_vectors = model.encode(preprocess_documents)
    print(ebd_vectors.shape)
    return ebd_vectors