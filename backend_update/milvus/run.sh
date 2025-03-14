source /root/miniconda3/etc/profile.d/conda.sh
conda activate milvus
conda env export > environment.yml

export SYSTEM_CONFIG=../configs/system_config.yaml
python3 -m uvicorn main:app  --reload --host 0.0.0.0 --port 20713