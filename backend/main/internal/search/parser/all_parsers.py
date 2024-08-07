import sys
sys.path.append('.')
import setup
import textblob
from internal.search.parser import time_helpers

def parse_object_tags(text_query: str) -> str:
    """
    Parse the object_tags field of the query
    """
    # Process our query
    doc = setup.nlp(text_query)

    # Use blob to find words that are nouns
    blob = textblob.TextBlob(doc.text)
    all_nouns = [word for word, tag in blob.tags if tag in ['NN', 'NNS']]

    # Extract noun_chunks, then extract the root from each noun_chunk
    all_noun_chunks = [chunk.text for chunk in doc.noun_chunks if str(chunk.root) in all_nouns]
    if len(all_noun_chunks) == 0:
        return ""
    return ", ".join(all_noun_chunks)



def parse_location(text_query: str) -> str:
    """
    Parse the location field of the query
    """
    doc = setup.nlp(text_query)
    results = []
    for ent in doc.ents:
        if ent.label_ in ['GPE', 'LOC', 'FAC', 'ORG']:
            results.append(ent.text)
    if len(results) == 0:
        return ""
    return ", ".join(results)



def parse_date_time(text_query: str) -> tuple[int, int]:

    # initialize date and time
    date1, time1, date2, time2 = -1, -1, -1, -1

    # extract entities
    date_entities, time_entities = time_helpers.extract_date_time_entities(text_query)

    # find date and time
    if len(date_entities) > 0:
        date_text = " ".join(date_entities)
        date1, date2 = time_helpers.find_date(date_text)
    if len(time_entities) > 0:
        time1, time2 = time_helpers.find_time(time_entities)

    # return the result
    print("Datetime parsed: ", date1, time1, date2, time2)
    return date1, time1, date2, time2
