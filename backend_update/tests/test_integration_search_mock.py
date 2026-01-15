import sys
import os
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Skip this test if FastAPI (and TestClient) are not available in the environment
pytest.importorskip("fastapi")
from fastapi.testclient import TestClient

# Import the main app
from main.main import app

# Import modules to monkeypatch
import main.internal.api_handler as api_handler
import main.internal.postprocess as postprocess


def async_stub(return_value):
    async def _inner(*args, **kwargs):
        return return_value
    return _inner


def test_search_with_text_query_monkeypatched():
    client = TestClient(app)

    # Monkeypatch async functions to avoid external services
    api_handler.compute_text_embedding = async_stub([0.1, 0.2, 0.3])
    api_handler.search_milvus = async_stub({"record_ids": [0, 1], "scores": [0.9, 0.8]})
    # postprocess.prepare_response is async; return a minimal response list
    postprocess.prepare_response = async_stub([
        {"img_link": "http://example.com/0.jpg", "score": 0.9},
        {"img_link": "http://example.com/1.jpg", "score": 0.8},
    ])

    payload = {
        "text_query": "breakfast",
        "filters": {},
        "dataset": "aic25",
        "model": "clips",
        "use_temporal_window": False,
        "temporal_window_size": 5,
        "display_window_size": 1,
        "subset_record_ids": []
    }

    resp = client.post("/search/search_with_text_query", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    # The router wraps the returned content inside 'data' key when success
    assert "data" in data
    assert isinstance(data["data"], list)
    assert len(data["data"]) == 2
