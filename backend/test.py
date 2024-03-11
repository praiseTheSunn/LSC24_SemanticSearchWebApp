import sys
sys.path.append('D:\\VSCode\\LSC24_SemanticSearchWebApp\\LSC24_SemanticSearchWebApp\\backend\\helper')
sys.path.remove('d:\\vscode\\generativeimage2text')
print(sys.path)

import loader
import setup

device, model, preprocess, keyframe_paths = setup.setup()
print()

from embedding_helper import search_text_query
search_text_query(keyframe_paths, model, "red traffic light")