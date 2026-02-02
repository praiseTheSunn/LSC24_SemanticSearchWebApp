#!/usr/bin/env python3
import os
from pathlib import Path
import argparse

def parse_args():
    ap = argparse.ArgumentParser("Batch OCR with PaddleOCR (mirrored folder output)")
    ap.add_argument("--input_root", default="~/VBSDATA/keyframes/V3C")
    ap.add_argument("--output_root", default="/home/hlmquan/LSC24_SemanticSearchWebApp/backend_update/data/vbs25_v3c/ocr")
    ap.add_argument("--cuda_visible_devices", default="1")
    ap.add_argument("--overwrite", action="store_true")
    ap.add_argument("--log_every", type=int, default=2000, help="Print progress every N images")
    ap.add_argument("--start_subfolder", type=str, default=None, help="If set, only process images under this subfolder of input_root")
    ap.add_argument("--end_subfolder", type=str, default=None, help="If set, only process images before this subfolder of input_root")
    return ap.parse_args()

def iter_pngs_alpha(root: Path):
    """
    Stream files in alphabetical order by relative path, without building a giant list.
    This does a depth-first traversal where each directory's entries are sorted by name.
    """
    root = root.resolve()

    def _walk(dir_path: Path):
        try:
            with os.scandir(dir_path) as it:
                entries = list(it)  # only this directory, not whole tree
        except PermissionError:
            return

        # Sort once per directory
        entries.sort(key=lambda e: e.name)

        # Dirs first, then files, to match path-lexicographic traversal
        for e in entries:
            if e.is_dir(follow_symlinks=False):
                yield from _walk(Path(e.path))

        for e in entries:
            if e.is_file(follow_symlinks=False) and e.name.lower().endswith(".png"):
                yield Path(e.path)

    yield from _walk(root)

def main():
    args = parse_args()

    # IMPORTANT: env vars BEFORE importing paddleocr/paddle
    os.environ["DISABLE_MODEL_SOURCE_CHECK"] = "True"
    os.environ["CUDA_VISIBLE_DEVICES"] = str(args.cuda_visible_devices)

    from paddleocr import PaddleOCR  # noqa: E402

    input_root = Path(args.input_root).expanduser().resolve()
    output_root = Path(args.output_root).expanduser().resolve()

    ocr = PaddleOCR(
        # models (fastest stable combo)
        text_detection_model_name="PP-OCRv5_mobile_det",
        text_recognition_model_name="latin_PP-OCRv5_mobile_rec",

        # disable unused stages
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,

        # device
        device="gpu:0",
    )

    print(f"Input root : {input_root}")
    print(f"Output root: {output_root}")

    count = 0
    subfolders = sorted(os.listdir(input_root))

    for subfolder in subfolders:
        if args.start_subfolder and (subfolder < args.start_subfolder):
            continue
        if args.end_subfolder and (subfolder > args.end_subfolder):
            continue
        print(f"Processing subfolder: {subfolder}")

        for img_path in iter_pngs_alpha(input_root / subfolder):
            count += 1
            rel = img_path.relative_to(input_root)
            out_json = (output_root / rel).with_suffix(".json")
            out_json.parent.mkdir(parents=True, exist_ok=True)

            if out_json.exists() and not args.overwrite:
                if args.log_every and (count % args.log_every == 0):
                    print(f"[{count}] ... (skipping existing outputs)")
                continue

            if args.log_every and (count % args.log_every == 0):
                print(f"[{count}] OCR {rel}")

            try:
                results = ocr.predict(str(img_path))
            except Exception as e:
                print(f"  [Error] OCR failed for image {rel}: {e}")
                continue

            if len(results) == 1:
                results[0].save_to_json(save_path=str(out_json))
            else:
                for j, res in enumerate(results):
                    res.save_to_json(
                        save_path=str(out_json),
                        indent=0,               # no pretty-print
                        ensure_ascii=False,
                    )
                    

    print(f"Done. Processed {count} images discovered.")

if __name__ == "__main__":
    main()
