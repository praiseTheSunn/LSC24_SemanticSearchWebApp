import os
import re
import time           # NEW
import random         # NEW
from urllib.parse import urlparse, parse_qs
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pandas as pd

# ===================== #
# 1) CODE GỐC CỦA BẠN   #
# ===================== #
try:
    from youtube_transcript_api import YouTubeTranscriptApi
except Exception:
    raise SystemExit("Chưa cài youtube-transcript-api. Cài bằng: pip install youtube-transcript-api")

# ---- Tham số chống bị chặn (có thể chỉnh) ----
JITTER_RANGE = (10, 20)   # Ngủ ngẫu nhiên (giây) trước MỖI request
RETRY_BACKOFF = (6.0, 12.0) # Ngủ ngẫu nhiên (giây) khi lỗi rồi thử lại
MAX_RETRIES = 1             # Số lần thử lại tối đa

def _rand_sleep(a: float, b: float):
    """Ngủ một khoảng ngẫu nhiên [a, b] giây."""
    time.sleep(random.uniform(a, b))

def fetch_all_transcripts(video_id: str) -> List[Dict]:
    """
    GIỮ NGUYÊN THEO BẠN + thêm pause ngẫu nhiên & retry:
    - Ưu tiên: ytt_api = YouTubeTranscriptApi(); ytt_api.fetch(video_id, languages=['vi'])
    - Trả List[Dict]: [{'text':..., 'start':..., 'duration':...}, ...]
    """
    transcript_list: List[Dict] = []

    # Thử nhiều lần với backoff khi gặp lỗi mạng/tạm thời
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            # Pause ngẫu nhiên trước request để tránh burst
            _rand_sleep(*JITTER_RANGE)

            ytt_api = YouTubeTranscriptApi()
            if hasattr(ytt_api, "fetch"):
                print(f"[try {attempt}/{MAX_RETRIES}] Fetching best transcript for video ID {video_id} using YouTubeTranscriptApi.fetch()")
                fetched_transcript = ytt_api.fetch(video_id, languages=["vi"])
                snippets = fetched_transcript.snippets

                # Chuyển về list[dict] như bạn đã làm
                transcript_list = []
                for snippet in snippets:
                    transcript_list.append({
                        "text": snippet.text,
                        "start": snippet.start,
                        "duration": snippet.duration
                    })
            # Thành công -> break
            break

        except Exception as e:
            print(f"  Failed to fetch (attempt {attempt}/{MAX_RETRIES}): {e}")
            if attempt < MAX_RETRIES:
                # Backoff lâu hơn một chút trước khi thử lại
                _rand_sleep(*RETRY_BACKOFF)
            else:
                # Hết retry
                pass

    return transcript_list or []


# ============================== #
# 2) PHẦN THÊM TỐI THIỂU CỦA MÌNH #
# ============================== #

# --- cấu hình nhỏ ---
METADATA_PATH = "metadata_v1.csv"
OUT_DIR = Path("./transcripts")
MAX_WORKERS = 1
# MAX_WORKERS = max(4, os.cpu_count() or 4)
print(f"Using up to {MAX_WORKERS} threads")

# parse id YouTube từ URL để gọi API (nhưng TÊN FILE sẽ dùng cột video_id của metadata)
_YT_ID_RE = re.compile(r"[A-Za-z0-9_-]{11}")
def _parse_youtube_id(url: str) -> Optional[str]:
    try:
        u = urlparse(url)
    except Exception:
        return None
    # youtu.be/<id>
    if u.netloc in {"youtu.be"}:
        vid = u.path.lstrip("/").split("/")[0]
        return vid if _YT_ID_RE.fullmatch(vid) else None
    # youtube.com/watch?v=<id> hoặc /shorts/<id>
    if "youtube.com" in u.netloc or "m.youtube.com" in u.netloc or "music.youtube.com" in u.netloc:
        qs = parse_qs(u.query)
        if "v" in qs and qs["v"] and _YT_ID_RE.fullmatch(qs["v"][0]):
            return qs["v"][0]
        parts = [p for p in u.path.split("/") if p]
        if len(parts) >= 2 and parts[0] in {"shorts","embed","live"} and _YT_ID_RE.fullmatch(parts[1]):
            return parts[1]
    return None

def _save_transcript_csv(rows: List[Dict], out_csv: Path) -> None:
    df = pd.DataFrame(rows, columns=["text","start","duration"])
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_csv, index=False, encoding="utf-8")

def _worker(meta_video_id: str, video_url: str) -> Tuple[str, int, str]:
    """
    meta_video_id: ID từ cột 'video_id' trong metadata (dùng để ĐẶT TÊN FILE).
    video_url: URL YouTube (dùng để PARSE id thật gọi API).
    """
    yt_id = _parse_youtube_id(video_url or "")
    if not yt_id:
        return (meta_video_id, 0, "bad_url_or_id")

    out_csv = OUT_DIR / f"{meta_video_id}.csv"  # <-- tên file theo cột metadata
    # check if already exists
    if out_csv.exists():
        n_existing = sum(1 for _ in pd.read_csv(out_csv, usecols=["text"], chunksize=1000))
        return (meta_video_id, n_existing, "already_exists")

    # Stagger nhẹ giữa các thread để tránh cùng lúc bắn request
    _rand_sleep(0.0, 1.5)  # NEW: dãn nhịp khởi động mỗi worker

    rows = fetch_all_transcripts(yt_id)
    if not rows:
        return (meta_video_id, 0, "no_transcript")

    out_csv = OUT_DIR / f"{meta_video_id}.csv"  # <-- tên file theo cột metadata
    _save_transcript_csv(rows, out_csv)
    return (meta_video_id, len(rows), "")

# --- 3) chạy ---
def main():
    # 3.1) load metadata và lấy unique (video_id, video_url)
    meta = pd.read_csv(METADATA_PATH)
    if not {"video_id","video_url"}.issubset(meta.columns):
        raise SystemExit("metadata_v1.csv cần có cột: video_id, video_url")

    pairs_df = meta[["video_id","video_url"]].dropna().drop_duplicates(subset=["video_id"], keep="first")
    video_map: Dict[str, str] = dict(zip(pairs_df["video_id"].astype(str), pairs_df["video_url"].astype(str)))

    # Ví dụ bạn đang cắt từ index 540:
    video_map = dict(list(video_map.items())[1121:])
    print(f"Loaded {len(video_map)} unique entries")

    # 3.2) đa luồng (có jitter ở worker + fetch)
    results = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        fut2vid = {ex.submit(_worker, vid, url): vid for vid, url in video_map.items()}
        for fut in as_completed(fut2vid):
            vid = fut2vid[fut]
            try:
                mvid, nrows, err = fut.result()
                results.append((mvid, nrows, err))
                if err:
                    print(f"[{mvid}] ERROR: {err}")
                else:
                    print(f"[{mvid}] saved {nrows} rows")
            except Exception as e:
                results.append((vid, 0, f"exception: {e}"))
                print(f"[{vid}] EXCEPTION: {e}")

    # 3.3) summary
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(results, columns=["video_id","rows","error"]).to_csv(OUT_DIR / "_summary.csv", index=False, encoding="utf-8")
    print("Done. See:", str(OUT_DIR.resolve()))

if __name__ == "__main__":
    main()
