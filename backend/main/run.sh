sudo sysctl -w vm.max_map_count=262144
sudo docker start es01

source /root/miniconda3/etc/profile.d/conda.sh
conda init
conda activate main
conda env export > environment.yml

export SYSTEM_CONFIG=../configs/system_config.yaml
export DATASET_CONFIG=../configs/lsc24_config.yaml
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload