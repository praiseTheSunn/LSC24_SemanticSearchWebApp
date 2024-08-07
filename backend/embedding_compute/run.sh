# conda init 
source /home/pc/miniconda3/etc/profile.d/conda.sh
conda activate embedding_compute
conda env export > environment.yml

export SYSTEM_CONFIG=../configs/system_config.yaml
python3 -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload