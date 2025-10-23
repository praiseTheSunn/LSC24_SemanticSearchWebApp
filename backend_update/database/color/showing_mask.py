import cv2
import numpy as np

def create_color_mask(image, color_hex_values, color_labels, threshold=20, background="black", save_path=None):
    """
    Create and optionally save a color mask image showing detected color regions.

    Args:
        image (str | np.ndarray): Path to image file or RGB/BGR array.
        color_hex_values (list[str]): List of color hex strings.
        color_labels (list[str]): Human-readable names matching the hex list.
        threshold (int): Distance threshold for color detection in LAB space.
        background (str): 'black' or 'transparent'
        save_path (str | None): Optional output file path to save the mask image.

    Returns:
        np.ndarray: RGB color mask.
    """
    # --- Load image ---
    if isinstance(image, str):
        img = cv2.imread(image)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    else:
        img = image.copy()
        if img.shape[2] == 4:
            img = img[:, :, :3]

    lab_img = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)

    # --- Initialize blank mask ---
    if background == "transparent":
        mask = np.zeros((*img.shape[:2], 4), dtype=np.uint8)
    else:
        mask = np.zeros_like(img, dtype=np.uint8)

    # --- Color detection loop ---
    for hex_color in color_hex_values:
        rgb = tuple(int(hex_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
        lab = cv2.cvtColor(np.uint8([[rgb]]), cv2.COLOR_RGB2LAB)[0][0]
        dist = np.linalg.norm(lab_img - lab, axis=2)
        region_mask = (dist < threshold).astype(np.uint8)

        # Apply detected color
        for c in range(3):
            mask[..., c] = np.where(region_mask, rgb[c], mask[..., c])

        # If transparent background, set alpha channel
        if background == "transparent":
            mask[..., 3] = np.where(region_mask, 255, mask[..., 3])

    # --- Save if requested ---
    if save_path:
        out_img = cv2.cvtColor(mask, cv2.COLOR_RGBA2BGRA if background == "transparent" else cv2.COLOR_RGB2BGR)
        cv2.imwrite(save_path, out_img)
        print(f"✅ Saved color mask to {save_path}")

    return mask


import json

# Load your palette
with open("/home/hlmquan/LSC24_SemanticSearchWebApp/backend_update/database/color/endesga_to_vocab.json") as f:
    color_map = json.load(f)

hex_values = list(color_map.keys())
labels = list(color_map.values())

# Create and save only the mask
mask = create_color_mask(
    "/home/hlmquan/LSCDATA/keyframes/201901/01/20190101_103925_000.jpg",
    color_hex_values=hex_values,
    color_labels=labels,
    threshold=25,
    background="black",           # or "transparent"
    save_path="color_mask.png"
)
