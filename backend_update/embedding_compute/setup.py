import os
import yaml

def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

system_config_file = os.getenv('SYSTEM_CONFIG')
system_config = load_config(system_config_file)
available_models = system_config['available_models']