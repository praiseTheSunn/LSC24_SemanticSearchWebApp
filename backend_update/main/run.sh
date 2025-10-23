source /root/miniconda3/etc/profile.d/conda.sh
conda init
conda activate main
conda env export > environment.yml

export SYSTEM_CONFIG="/home/hlmquan/LSC24_SemanticSearchWebApp/backend_update/configs/system_config.yaml"
python3 -m uvicorn main:app --host 0.0.0.0 --port 20721