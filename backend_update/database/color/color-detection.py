import os
import glob
import cv2
import numpy as np
import sqlite3
import argparse
from pathlib import Path
from skimage import color
from sklearn.neighbors import KNeighborsClassifier
import json


class ColorDetector:
    def __init__(self, color_hex_file, batch_size=32, db_path='color_output.db'):
        """
        Initialize the ColorDetector with color palette and database.

        Args:
            color_hex_file: Path to .json file containing color-to-name mapping
            batch_size: Number of images to process in each batch
            db_path: Path to SQLite database file
        """
        self.batch_size = batch_size
        self.db_path = db_path
        self.knn = None

        # Load color mapping from JSON
        self.color_hex_values, self.color_names = self._read_hex_colors(color_hex_file)
        self.lab_colors = self._hex_colors_to_lab(self.color_hex_values)

        # Initialize database
        self._init_database()

    def _read_hex_colors(self, color_hex_file):
        """Reads color hex and name pairs from JSON file."""
        with open(color_hex_file, 'r') as f:
            color_dict = json.load(f)
        hex_values = list(color_dict.keys())
        color_names = list(color_dict.values())
        return hex_values, color_names

    def _hex_to_rgb(self, hex_color):
        """Convert hex color to RGB tuple normalized to [0,1]."""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i + 2], 16) / 255.0 for i in (0, 2, 4))

    def _hex_colors_to_lab(self, hex_values):
        """Convert a list of hex colors to CIELAB color space."""
        rgb_colors = np.array([self._hex_to_rgb(h) for h in hex_values])
        return color.rgb2lab(rgb_colors.reshape(1, -1, 3)).reshape(-1, 3)
    
    def _init_database(self):
        """Initialize SQLite database with required table."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS color_detection (
                image_id TEXT PRIMARY KEY,
                color TEXT NOT NULL
            )
        ''')
        conn.commit()
        conn.close()
        print(f"Database initialized at: {self.db_path}")
    
    def _map_color_to_image_equalized(self, image_path):
        """
        Map colors in image to closest palette colors using histogram equalization.
        
        Returns:
            two_closest_indices: indices of the two closest colors for each pixel
            two_closest_simi: distances of the two closest colors for each pixel
        """
        # Load and preprocess image
        image = cv2.imread(image_path)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # # Apply histogram equalization to each channel
        # image_rgb = np.stack([
        #     cv2.equalizeHist(image_rgb[:, :, i]) for i in range(3)
        # ], axis=-1)
        
        # Convert to LAB color space
        image_lab = color.rgb2lab(image_rgb)
        flat_image_lab = image_lab.reshape((-1, 3))
        
        # Initialize KNN if not already done
        if self.knn is None:
            self.knn = KNeighborsClassifier(n_neighbors=2)
            self.knn.fit(self.lab_colors, np.arange(self.lab_colors.shape[0]))
        
        # Find two nearest neighbors
        distances, indices = self.knn.kneighbors(flat_image_lab)
        
        # Reshape to original image dimensions
        two_closest_indices = indices.reshape(image_rgb.shape[0], image_rgb.shape[1], 2)
        two_closest_simi = distances.reshape(image_rgb.shape[0], image_rgb.shape[1], 2)
        
        return two_closest_indices, two_closest_simi
    
    def _adjust_colors(self, two_closest_indices, two_closest_simi):
        """
        Adjust second color based on similarity ratio.
        If second color is too different, set to -1.
        """
        adjusted_indices = np.copy(two_closest_indices)
        
        # Compute ratio of second to first similarity
        ratio = two_closest_simi[:, :, 1] / (two_closest_simi[:, :, 0] + 1e-10)
        
        # Filter out second color if ratio < 0.70
        condition = ratio < 0.70
        adjusted_indices[condition, 1] = -1
        
        return adjusted_indices
    
    def _find_colors_of_cell(self, cell_image):
        """
        Find colors that appear in more than 3% of the cell.
        
        Returns:
            unique color indices and their counts
        """
        unique, counts = np.unique(cell_image, return_counts=True)
        total = cell_image.size
        mask = counts > (total * 0.03)
        return unique[mask], counts[mask]
    
    def _get_global_color_encoding(self, two_closest_indices, grid_rows=9, grid_cols=9):
        """
        Extract global color encoding from image.
        
        Returns:
            String of space-separated color names present in the image
        """
        image_rows, image_cols, _ = two_closest_indices.shape
        cell_row_size = image_rows // grid_rows
        cell_col_size = image_cols // grid_cols
        
        color_set = set()
        
        for i in range(grid_rows):
            for j in range(grid_cols):
                # Get cell region
                row_start = i * cell_row_size
                row_end = (i + 1) * cell_row_size
                col_start = j * cell_col_size
                col_end = (j + 1) * cell_col_size
                
                # Find colors in first closest
                colors_1st, _ = self._find_colors_of_cell(
                    two_closest_indices[row_start:row_end, col_start:col_end, 0]
                )
                
                # Find colors in second closest
                colors_2nd, _ = self._find_colors_of_cell(
                    two_closest_indices[row_start:row_end, col_start:col_end, 1]
                )
                
                # Combine colors
                colors = set(colors_1st) | set(colors_2nd)
                
                for color_index in colors:
                    if color_index != -1:
                        color_set.add(self.color_names[color_index])
        
        return ' '.join(sorted(color_set))
    
    def process_image(self, image_path):
        """
        Process a single image and extract color encoding.
        
        Returns:
            Tuple of (image_id, color_encoding)
        """
        try:
            # Get image ID from filename
            image_id = Path(image_path).stem
            
            # Map colors
            two_closest_indices, two_closest_simi = self._map_color_to_image_equalized(image_path)
            
            # Adjust colors based on similarity
            adjusted_indices = self._adjust_colors(two_closest_indices, two_closest_simi)
            
            # Get global encoding
            color_encoding = self._get_global_color_encoding(adjusted_indices)
            
            return image_id, color_encoding
            
        except Exception as e:
            print(f"Error processing {image_path}: {e}")
            return None, None
    
    def save_to_database(self, results):
        """
        Save batch results to database.
        
        Args:
            results: List of (image_id, color_encoding) tuples
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Filter out None results
        valid_results = [(img_id, colors) for img_id, colors in results if img_id is not None]
        
        if valid_results:
            cursor.executemany(
                'INSERT OR REPLACE INTO color_detection (image_id, color) VALUES (?, ?)',
                valid_results
            )
            conn.commit()
        
        conn.close()
    
    def process_directory(self, image_dir, start_index=0, end_index=None):
        """
        Process a specific portion of images in a directory.

        Args:
            image_dir: Path to directory containing images
            start_index: Starting index (inclusive)
            end_index: Ending index (exclusive), or None for till end
        """
        # Get all image files recursively
        image_extensions = ('*.jpg', '*.jpeg', '*.png', '*.bmp')
        image_paths = []
        for ext in image_extensions:
            image_paths.extend(Path(image_dir).rglob(ext))
        image_paths = sorted(str(p) for p in image_paths)

        total_images = len(image_paths)
        end_index = end_index or total_images

        # Clip indices to valid range
        start_index = max(0, start_index)
        end_index = min(end_index, total_images)
        image_paths = image_paths[start_index:end_index]
        print(f"Processing range {start_index}:{end_index} of {total_images} total images")

        # Load processed image IDs from database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT image_id FROM color_detection')
        processed_ids = set(row[0] for row in cursor.fetchall())
        conn.close()

        # Filter out already processed images
        images_to_process = [p for p in image_paths if Path(p).stem not in processed_ids]
        total_to_process = len(images_to_process)

        print(f"Found {len(image_paths)} images in range, {total_to_process} to process, skipping {len(image_paths) - total_to_process} already done.")

        # Process in batches
        processed_count = 0
        for batch_start in range(0, total_to_process, self.batch_size):
            batch_end = min(batch_start + self.batch_size, total_to_process)
            batch_paths = images_to_process[batch_start:batch_end]

            # Process batch
            batch_results = [self.process_image(img_path) for img_path in batch_paths]

            # Save to database
            self.save_to_database(batch_results)

            processed_count += len(batch_paths)
            print(f"Processed {processed_count}/{total_to_process} in this range "
                f"({processed_count/total_to_process*100:.1f}%)")

        print(f"✅ Complete for range {start_index}:{end_index}! "
            f"Processed {processed_count} new images. Results saved to {self.db_path}")



def main():
    parser = argparse.ArgumentParser(description='Extract color encoding from images')
    parser.add_argument('image_dir', type=str, help='Directory containing images to process')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size for processing (default: 32)')
    parser.add_argument('--db-path', type=str, default='color_output.db', help='Output database path')
    parser.add_argument('--start', type=int, default=0, help='Start index of images to process')
    parser.add_argument('--end', type=int, default=None, help='End index of images to process (exclusive)')

    args = parser.parse_args()

    color_hex_file = './endesga_to_vocab.json'

    if not os.path.isdir(args.image_dir):
        print(f"Error: Image directory '{args.image_dir}' does not exist")
        return
    if not os.path.isfile(color_hex_file):
        print(f"Error: Color hex file '{color_hex_file}' does not exist")
        return

    detector = ColorDetector(
        color_hex_file=color_hex_file,
        batch_size=args.batch_size,
        db_path=args.db_path
    )

    print(f"Starting color detection on images in '{args.image_dir}'")
    print(f"Processing images from index {args.start} to {args.end if args.end is not None else 'end'}")

    detector.process_directory(args.image_dir, start_index=args.start, end_index=args.end)



if __name__ == '__main__':
    main()