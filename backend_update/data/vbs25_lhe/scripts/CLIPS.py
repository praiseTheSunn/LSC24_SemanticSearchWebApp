import cv2
import os
import glob
import numpy as np
import open_clip
from open_clip import create_model_from_pretrained, get_tokenizer
import torch
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from pathlib import Path
from PIL import Image
from joblib import Parallel, delayed


# Suppress Future warnings
import warnings
warnings.simplefilter(action='ignore', category=FutureWarning)

# Print CUDA information
print(f"CUDA is available: {torch.cuda.is_available()}")
print(f"CUDA device count: {torch.cuda.device_count()}")
print(f"CUDA device name: {torch.cuda.get_device_name()}")


# Custom dataset for loading and preprocessing images
class ImageDataset(Dataset):
    def __init__(self, image_paths, preprocess):
        self.image_paths = image_paths
        self.preprocess = preprocess

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        image_path = self.image_paths[idx]
        raw_image = Image.open(image_path)
        image = self.preprocess(raw_image)
        return image

def get_batch_embeddings_from_loader(data_loader, model, device):
    """
    Get image embeddings using a DataLoader.
    """
    all_embeddings = []
    with torch.no_grad():
        for batch in data_loader:
            batch = batch.to(device)
            with torch.cuda.amp.autocast():
                batch_features = model.encode_image(batch)
                batch_features = F.normalize(batch_features, dim=-1)
            all_embeddings.append(batch_features)
    return torch.cat(all_embeddings, dim=0)


def process_subdirectory(subdirectory, args=None, model=None, preprocess=None):
    os.environ['CUDA_VISIBLE_DEVICES'] = os.getenv('CUDA_VISIBLE_DEVICES', '0')  # Ensure GPU visibility
    try:
        subdirectory_path = os.path.join(args.input_folder, subdirectory)
        output_dir_path = os.path.join(args.output_folder, subdirectory)
        keyframe_paths = sorted(glob.glob(os.path.join(subdirectory_path, f"*.{args.image_extension}")))
        if os.path.exists(output_dir_path) and len(os.listdir(output_dir_path)) != 0:
            print(f"Subdirectory {subdirectory} was already processed.")
            return
        
        # Create the subfolder and start        
        print(f"Extracting embeddings for subdirectory {subdirectory}...")           
        os.makedirs(output_dir_path, exist_ok=True) 

        # Create a dataset and dataloader
        dataset = ImageDataset(keyframe_paths, preprocess)
        data_loader = DataLoader(dataset, batch_size=args.batch_size, num_workers=2, pin_memory=True)

        # Extract embeddings using the DataLoader
        stacked_image_embeddings = get_batch_embeddings_from_loader(data_loader, model, args.device)

        print(f"Shape of embeddings of {subdirectory}: {stacked_image_embeddings.shape}")
        
        # # Define the output file path
        # output_filename = f"{subdirectory}.npy"
        # output_path = os.path.join(args.output_folder, output_filename)
        # print(f"Saving embeddings to {output_path}")
        
        # # Save the stacked image features as a .npy file
        # np.save(output_path, stacked_image_embeddings.cpu().numpy())

        # Save the embedding for each image in batch
        for i, keyframe_path in enumerate(keyframe_paths):
            image_filename = os.path.basename(keyframe_path)
            image_id = os.path.splitext(image_filename)[0]
            embedding = stacked_image_embeddings[i].cpu().numpy()
            output_path = os.path.join(args.output_folder, subdirectory, f"{image_id}.npy")
            np.save(output_path, embedding)
        print(f"Saved embeddings for {subdirectory}")

    except Exception as e:
        print(f"Failed to process {subdirectory}: {e}")

def process_folder(args, model, preprocess):
    if not torch.cuda.is_available() and args.device == 'cuda:0':
        print("CUDA is not available. Falling back to CPU.")
        args.device = 'cpu'

    Path(args.output_folder).mkdir(parents=True, exist_ok=True)

    subdirectories = sorted(os.listdir(args.input_folder))
    Parallel(n_jobs=args.num_jobs, backend='threading')(
        delayed(process_subdirectory)(subdirectory, args, model, preprocess) for subdirectory in subdirectories
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="CLIPS Embeddings Extraction")
    parser.add_argument("--input_folder", type=str, required=True, help="Path to input folder with images")
    parser.add_argument("--output_folder", type=str, required=True, help="Path to output folder for annotated images")
    # parser.add_argument("--model_name", type=str, default="yolov5s", help="Pre-trained model to use (default: yolov5s)")
    parser.add_argument("--num_jobs", type=int, default=4, help="Number of parallel jobs (default: 4)")
    parser.add_argument("--device", type=str, default="cuda:0", help="Device to use ('cuda:0' or 'cpu')")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size for processing images")
    parser.add_argument("--num_workers", type=int, default=16, help="Number of workers for DataLoader")
    parser.add_argument("--image_extension", type=str, default="png", help="Image file extension to process")
    args = parser.parse_args()

    model, preprocess = create_model_from_pretrained('hf-hub:UCSC-VLAA/ViT-L-14-CLIPS-Recap-DataComp-1B')
    # tokenizer = get_tokenizer('hf-hub:UCSC-VLAA/ViT-L-14-CLIPS-Recap-DataComp-1B')

    torch.cuda.empty_cache()
    model = model.to(args.device)

    process_folder(
        args=args,
        model=model,
        preprocess=preprocess,
        # tokenizer=tokenizer
    )
