#!/bin/bash
#SBATCH --job-name=mvk2-ebd # create a short name for your job
#SBATCH --nodes=1 # node count
#SBATCH --ntasks=1 # total number of tasks across all nodes
#SBATCH --cpus-per-task=3 # cpu-cores per task (>1 if multi-threaded tasks)
#SBATCH --gres=gpu:1 # number of gpus per node
#SBATCH --time=36:00:00 # total run time limit (HH:MM:SS)
python CLIPS.py --input_folder "/home/hlmquan/VBSDATA/keyframes/LHE" --output_folder "/home/hlmquan/LSC24_SemanticSearchWebApp/backend_update/data/vbs25_lhe/embeddings" --device "cuda:0" --image_extension "png" --num_jobs 3