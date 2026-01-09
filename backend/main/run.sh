source /root/miniconda3/etc/profile.d/conda.sh
conda init
conda activate main
conda env export > environment.yml

export SYSTEM_CONFIG="/home/pc/LSC24_SemanticSearchWebApp/backend/configs/system_config.yaml"
export DATASET_CONFIG="/home/pc/LSC24_SemanticSearchWebApp/backend/configs/vbs25_config.yaml"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload