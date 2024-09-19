source /home/pc/miniconda3/etc/profile.d/conda.sh
conda activate milvus
conda env export > environment.yml
sudo docker compose up -d

export DATASET_CONFIG=../configs/aic24_config.yaml
python3 -m uvicorn main:app --host 0.0.0.0 --port 8004 --reload