# conda init 
source /root/miniconda3/etc/profile.d/conda.sh
conda activate ebd
conda env export > environment.yml

export SYSTEM_CONFIG=../configs/system_config.yaml
CUDA_VISIBLE_DEVICES=0 python3 -m uvicorn main:app --host 0.0.0.0 --port 20724 --reload