import os
import yaml

# configs
def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

system_config_file = os.getenv('SYSTEM_CONFIG')
system_config = load_config(system_config_file)
available_datasets = system_config.get("available_datasets", [])
available_models = system_config.get("available_models", [])
dataset_configs = {}

for dataset_name in available_datasets:
    dataset_config_file = f'../configs/{dataset_name}_config.yaml'  # Default config path
    dataset_config = load_config(dataset_config_file)
    dataset_configs[dataset_name] = dataset_config
    print(f"Dataset name: {dataset_name}")
    print(f"Dataset config: {dataset_config}")



# SPACY
import spacy
# nlp = spacy.load(config.NLP_MODEL_PATH)
nlp = spacy.load('en_core_web_sm')


