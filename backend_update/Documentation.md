(# SnapSeek — Backend Documentation)

## Introduction

This folder (`backend_update`) contains the backend services for SnapSeek — an interactive multimedia retrieval system built from small, focused FastAPI services. The backend provides:
- an entrypoint API ("main") for search, exploration, feedback and evaluation flows;
- an embedding service to compute text/image embeddings;
- a Milvus-backed vector search service (with metadata & embedding fetch endpoints);
- dataset utilities and local database helpers for metadata management.

The design separates responsibilities so each service can scale or be replaced independently (e.g., swap embedding model, change vector DB).

## Overview — services

Number of services (in this folder): 3 main FastAPI services plus helpers and utilities:

- **main** (API router for user-facing operations): `backend_update/main` — exposes endpoints for searching, exploring, feedback, submit and evaluation. Inside there is `backend_update/main/internal` — internal business logic such as search, explore, feedback, postprocessing, logging,...
- **embedding_compute** (embedding service): `backend_update/embedding_compute` — computes text and image embeddings.
- **milvus** (vector store + fetch): `backend_update/milvus` — exposes search and fetch endpoints that wrap the Milvus client.

Additionally there are supporting modules:

- `backend_update/dataset` — dataset loader and registry (`DatasetManager`, `ImageDataset` subclasses).
- `backend_update/database` — utilities and `ImageDatabase` for creating/populating local SQLite DBs.
- `backend_update/configs` — YAML configs (per-dataset and `system_config.yaml`).

## How the dataset subfolder / configs control the system

Configuration is primarily controlled by the YAML files in `backend_update/configs` and dataset classes in `backend_update/dataset`:

- `system_config.yaml`
	- Global values such as `server_ip`, `available_models`, and `available_datasets`.
	- Services read this via their `setup.py` modules (e.g., `embedding_compute/setup.py`, `milvus/setup.py`). Then each `main.py` file imports the `setup` module to apply to ...

- Per-dataset config files (e.g. `lsc24_config.yaml`, `aic25_config.yaml`)
	- Contain keys used by `ImageDataset` subclasses: `metadata_file_path`, `embedding_dir`, `image_server_url`, `image_extension`, `column_mapping`, `filters`, `unifying_category`.
	- `ImageDataset` uses these values to load metadata (Pandas), create mappings (image_id ↔ record_id), and expose dataset-specific helpers.

Dataset registration (in `dataset/dataset_manager.py`) eagerly instantiates dataset singletons via `DatasetManager.register(name, DatasetClass)`. The `DatasetManager.get_dataset(name)` is the canonical way to access dataset-specific behavior and metadata throughout the backend.

Because dataset YAMLs define the metadata schema and the `filters` map (including whether a field is stored as a sparse vector, BM25 index, lowercase settings, and shortened_field_name used for CLI-like filters), changing these YAMLs affects:

- how queries are parsed and mapped to database / Milvus filters;
- what metadata fields are returned and renamed by the API (column mapping);
- how the `search_dense` routine constructs expressions and whether sparse-vector BM25 components are searched.

## How services interact (main first, then others)

High-level call flow for a user request (text or image search):

1. Client → main API (FastAPI in `main/main.py`) — user-facing endpoints in `main/routers/`.
	 - Endpoints include: `/search/*`, `/explore/*`, `/feedback`, `/submit`, `/evaluate`.
2. main/routers handlers call internal business logic (in `main/internal/`):
	 - `internal.search` orchestrates text and image searches.
	 - `internal.explore` and `internal.feedback` implement exploration and feedback logic.
	 - `internal.postprocess` transforms raw record ids into response objects with `img_link`, neighbor info and other fields.
3. Embedding step: when a text or image needs embedding, `internal.api_handler` forwards a POST to the embedding service:
	 - `embedding_compute` exposes `/embedding/text` and `/embedding/image`.
	 - The embedding service uses a `ModelManager` (singleton) that loads model(s) (e.g., `clips`) and returns vectors.
4. Vector search: once embeddings are available, `internal.api_handler.search_dense` posts to Milvus service:
	 - `milvus` exposes `/search/search_dense` (and `/fetch/*` for metadata/embeddings).
	 - The Milvus service performs dense or hybrid searches using its `internal` implementation and the `pymilvus` client.
5. Metadata & embeddings: `main/internal/postprocess.prepare_response` uses dataset metadata (via `DatasetManager.get_dataset(...)`) to build the final, human-friendly response. When needed, it calls Milvus fetch endpoints for metadata and embeddings.

Notes about communication:
- Services communicate over HTTP (local loopback in dev) using JSON payloads (Pydantic models are used for validation on each service).
- The main service treats the embedding and milvus services as black boxes with defined request/response schemas.

## Principal APIs — list, inputs & outputs

All endpoints described below are implemented as FastAPI routes in the `backend_update` folder.

1) Main API (user-facing) — `backend_update/main`

- POST /search/search_with_image_query
	- Input (RequestSearchByImageQuery): { image_base64: str, dataset?: str, model: str, display_window_size: int }
	- Output: JSONResponse with keys like { status, message, data } where `data` is a list of record objects (fields like img_link, date, time, location, activity, score, neighbors).
	- Flow: compute image embedding → call Milvus search → postprocess metadata → return results.

- POST /search/search_with_text_query
	- Input (RequestSearchByTextQuery): { text_query: str, filters: dict, dataset: str, model: str, use_temporal_window: bool, temporal_window_size: int, display_window_size: int, subset_record_ids: list }
	- Output: same shape as image search (status/message/data with a list of result records).
	- Flow: parse query into clauses → compute text embedding(s) → Milvus search(s) (possibly temporal) → postprocess.

- POST /explore/explore_similar_images
	- Input (RequestExploreSimilarImages): { image_ids?: [str], image_urls?: [str], dataset: str, model: str, display_window_size: int }
	- Output: list of similar images (response wrapper similar to above).
	- Flow: fetch embeddings for given images → compute mean embedding → Milvus search → postprocess.

- POST /explore/explore_neighbor_images
	- Input (RequestExploreNeighborImages): { image_id?: str, image_url?: str, span: int, dataset: str }
	- Output: neighbor images in temporal window (postprocessed metadata)

- POST /feedback
	- Input (RequestFeedback) — structured payload with `like` and `dislike` lists (ids & limits), `model`, `dataset`.
	- Output: JSONResponse with `like` and `dislike` lists of records.
	- Flow: use provided positive/negative prototypes to search for more/less relevant images.

- POST /submit
	- Input (RequestLogSubmit): { user_id, (media_item_name xor text), ... }
	- Output: confirmation JSON (status + description). Also logs saved.

- POST /evaluate
	- Input: small schema { query_id, user_id, image_id }
	- Output: status with message CORRECT/INCORRECT based on CSV file in `main/routers/thesis_query.csv`.

2) Embedding service — `backend_update/embedding_compute`

- POST /embedding/text
	- Input (TextEmbeddingRequest): { text_query: str, model: str }
	- Output: { text_embedding: [float] }
	- Implementation: uses `ModelManager` and `ClipSModel` to encode text and normalize vector.

- POST /embedding/image
	- Input (ImageEmbeddingRequest): { image_base64: str, model: str }
	- Output: { image_embedding: [float] } (note: some model outputs are wrapped to match expected shapes).

3) Milvus service — `backend_update/milvus`

- POST /search/search_dense
	- Input (SearchRequest): { dataset: Enum, model: Enum, embedding: List[List[float]], filters: Dict[str,str], limit: int, subset_record_ids: List[int] }
	- Output: { response: [ { record_id: int, distance: float }, ... ] }
	- Implementation: calls `internal.search.search_dense`, constructs hybrid/dense+BM25 requests and returns serialized hits.

- POST /fetch/fetch_metadata
	- Input (FetchMetadataRequest): { dataset: Enum, model: Enum, record_ids: [int] }
	- Output: { response: [ { record_id, ...metadata fields... }, ... ] }

- POST /fetch/fetch_embeddings
	- Input (FetchRequest): { collection_name: str, record_ids: [int] }
	- Output: { response: { record_ids: [int], embeddings: [[float]] } }

## Principal classes and data shapes (communication & computation)

Below are the important classes and why they matter.

1) Pydantic request/response schemas (communication layer)
- `main/schemas/request_schemas.py` — RequestSearchByTextQuery, RequestSearchByImageQuery, RequestExploreSimilarImages, RequestExploreNeighborImages, RequestFeedback, RequestLogSubmit
	- Role: validate/structure inputs to the main API. Changing these changes the public contract.

- `main/schemas/response_schemas.py` — ResponseURLs, ResponseEmbeddings
	- Role: response validation for API documentation and client expectations.

- `embedding_compute/schemas.py` — TextEmbeddingRequest, ImageEmbeddingRequest
	- Role: contract for embedding service. If model names or parameter formats change, update here.

- `milvus/schemas.py` — SearchRequest, FetchMetadataRequest, FetchRequest
	- Role: used by main → milvus interactions. They encode the embedding payload shapes and filter/limit semantics.

2) Dataset / metadata classes (computation & data access)
- `dataset/image_dataset.py` → `ImageDataset` (abstract) and concrete subclasses `LSC24Dataset`, `AIC25Dataset`, etc.
	- Purpose: load per-dataset YAML config, ingest metadata CSV into a Pandas DataFrame, provide image_id ↔ record_id mappings, and dataset-level utilities (filters, column mapping, image server URL).
	- Important params in YAML (column_mapping, filters, unifying_category) affect search filtering, metadata returned, and temporal grouping.

- `dataset/dataset_manager.py` → `DatasetManager` (singleton registry)
	- Purpose: a global registry of dataset singletons. Use `DatasetManager.get_dataset(name)` across services to access dataset behaviour.

3) Embedding & model classes
- `embedding_compute/models.py` → `ModelBase`, `ClipSModel`, `ModelManager`
	- `ModelBase`: base class contract for embedding models.
	- `ClipSModel`: concrete model wrapper that loads OpenCLIP/CLIP-based models and exposes `calc_text_embedding` and `calc_image_embedding`.
	- `ModelManager`: singleton that instantiates and returns model objects by name. Affects memory footprint and model initialization time.

4) Milvus / vector search classes
- `pymilvus` classes used by `milvus/internal/*`: `AnnSearchRequest`, `WeightedRanker`, `MilvusClient`, etc.
	- Purpose: construct hybrid search requests (dense embedding + sparse BM25-like fields), rank results and return them to the caller.

5) Misc / algorithmic
- `main/internal/search/scorer.py` contains numeric combination/normalization functions: `get_standardized_scores`, `get_combine_score`, `get_combined_scores`.
	- Purpose: standardize distances into comparable scores across modalities and combine them via harmonic mean.

- `main/internal/search/temporal.py` — routines to expand temporal clauses and aggregate results across clauses using the `unifying_category` (e.g., context_id).
	- Purpose: supports temporal-window searches (two-clause temporal queries) by fetching neighbor embeddings and computing combined scores.

## Main service: ways to search

The main service (`main`) supports several search modes exposed to clients:

1) Image query search (/search/search_with_image_query)
	- Input: an image (base64) and model name.
	- Flow: compute image embedding → Milvus search by vector → metadata postprocessing.

2) Text query search (/search/search_with_text_query)
	- Input: text and optional filters; supports temporal queries by using a pipe `|` to denote two clauses.
	- Flavors:
		- Single-clause semantic search: compute text embedding once and search.
		- Two-clause temporal search: compute embedding for the first clause, search, then expand neighbors and re-score against the second clause embedding (see `temporal.expand_temporal` and `temporal.aggregate_temporal`).
	- Filters can be keyword-like (handled by `parse_raw_query`) — the dataset `filters` configuration maps shortened tokens (like `-ocr`, `-l`) to actual metadata fields, and indicates sparse-vector behavior.

3) Explore (similar / neighbor)
	- Similar images: given one or several images, compute mean embedding and use that embedding to retrieve similar images.
	- Neighbor images: simple temporal window around an image record id (no Milvus required for neighbor listing in current implementation).

4) Feedback-driven search
	- Uses user-provided liked/disliked prototypes to compute relevant and irrelevant examples using averaging / clustering + search by embedding.

## Flow of logic within each service (routers → internal,...)

1) main (user-facing)
- Router layer: `main/routers/*.py` defines endpoints and Pydantic request/response models.
- Internal layer: `main/internal/*` — orchestrates calls to `api_handler` (which is an HTTP client to other services), dataset utilities, scoring, temporal logic, and `postprocess`.
- Logging: `main/internal/logger.save_log` persists JSON-lines logs to the `logs/` folder.

2) embedding_compute
- Router: `embedding_compute/routers/embedding.py` accepts requests and forwards to `internal/embedding.py`.
- Internal: `embedding_compute/internal/embedding.py` decodes base64 images, loads them into PIL, and uses `ModelManager` from `models.py` to run the model.

3) milvus
- Router: `milvus/routers/search.py` and `milvus/routers/fetch.py` accept SearchRequest/FetchRequest and call `milvus/internal/search.py` or `milvus/internal/fetch.py`.
- Internal: `milvus/internal/search.py` constructs hybrid requests with `AnnSearchRequest` objects and uses `milvus_client.hybrid_search` or `search`.
- Fetch endpoints use `milvus_client.get` to retrieve metadata and embeddings.

## Key implementation details and why parameters matter

- dataset `filters` config: marks whether a metadata field is a sparse vector (BM25) or a normal textual field, whether it should be lowercased for index/search, and the shortened token for user queries. This drives the Milvus expression (`expr`) generation and whether a hybrid search is constructed.

- `temporal_window_size` and `display_window_size`: control how many neighbor frames are considered when doing temporal expansion and how many neighbor images are returned alongside each main result.

- `limit` / `NEIGHBOR_SEEK_RANGE` / `MAX_RECORDS`: control the top-k retrieved by Milvus and the amount of data processed during aggregation. They affect latency and memory usage.

- `ModelManager` singleton: controls when models are loaded (memory/initialization). Adding large models requires GPU/CPU considerations and may increase startup time.

- Combining scores: `scorer.get_standardized_scores` normalizes raw distances to a fixed range before combining — changing this will affect rank order and fusion behavior across modalities.

## Other notes and recommendations

- Logging: interactions are saved as JSONL in `main/logs/` via `save_log`. This is useful for offline analysis and evaluation.

- Tests: there are no unit tests in the folder. Adding small tests for `parse_raw_query`, scorer functions and dataset loading would make refactors safer.

- Runtime: services read `SYSTEM_CONFIG` environment variable via their `setup.py` files. Ensure `SYSTEM_CONFIG` points to `configs/system_config.yaml` before running each service.

## Try it — quick run hints

1) Ensure `SYSTEM_CONFIG` env var points to the repo config, e.g.:

```bash
export SYSTEM_CONFIG=/home/hlmquan/LSC24_SemanticSearchWebApp/backend_update/configs/system_config.yaml
```

2) Start Milvus service (the repo includes a `milvus` entrypoint) and make sure collections are loaded.

```bash
cd /home/hlmquan/milvus
bash standalone_embed.sh start
```

3) Start main service:

```bash
cd backend_update/main
conda deactivate
conda activate main
bash ./run.sh
```

4) Start embedding service:

```bash
cd backend_update/embedding_compute
conda deactivate
conda activate ebd
bash ./run.sh
```

5) Start milvus service:

```bash
cd backend_update/milvus
conda deactivate
conda activate milvus
bash ./run.sh
```
